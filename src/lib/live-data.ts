import { format } from "date-fns";

import {
  BLOOD_GROUPS,
  DEPARTMENTS,
  HOSTELS,
  ROLE_CONFIG,
  YEARS,
  type RoleSlug,
} from "@/lib/constants";
import {
  createSupabaseServerClient,
  hasSupabaseEnv,
} from "@/lib/supabase/server";
import {
  AttendanceRecord,
  AttendanceSeriesPoint,
  AttendanceStatus,
  BloodGroup,
  CalendarDay,
  Department,
  DepartmentAnalytics,
  HostelAnalytics,
  HostelName,
  NotificationItem,
  Profile,
  ReportRow,
  RoomStatistic,
  Student,
} from "@/lib/types";
import { getInitials, percent } from "@/lib/utils";

type SupabaseClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

type ProfileRow = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  hostel_id?: string | null;
  force_password_change: boolean;
};

type StudentRow = {
  id: string;
  profile_id: string;
  admission_no?: string | null;
  full_name: string;
  email: string;
  date_of_birth: string;
  academic_year: string;
  department: string;
  hostel_name: string;
  room_number: string;
  sharing: string;
  blood_group?: string | null;
  student_phone: string;
  parent_phone: string;
};

type AttendanceRow = {
  id: string;
  student_id: string;
  attendance_date: string;
  check_in_time?: string | null;
  status: string;
  verified_by?: string | null;
  created_at?: string | null;
};

type NotificationRow = {
  id: string;
  title: string;
  body: string;
  audience: string;
  severity: string;
  created_at: string;
};

export type StudentDashboardData = {
  profile: Profile | null;
  student: Student | null;
  history: AttendanceRecord[];
  attendanceSeries: AttendanceSeriesPoint[];
  calendarDays: CalendarDay[];
  notifications: NotificationItem[];
};

export type WardenDashboardData = {
  profile: Profile | null;
  hostel: HostelName;
  students: Student[];
  analytics: HostelAnalytics;
  roomStatistics: RoomStatistic[];
};

export type OfficeDashboardData = {
  profile: Profile | null;
  hostelAnalytics: HostelAnalytics[];
  departmentAnalytics: DepartmentAnalytics[];
  attendanceSeries: AttendanceSeriesPoint[];
  reportRows: ReportRow[];
  notifications: NotificationItem[];
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function dateDaysAgo(daysAgo: number) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

function toRole(value: string): RoleSlug {
  return value in ROLE_CONFIG ? (value as RoleSlug) : "student";
}

function toHostel(value: string | null | undefined): HostelName {
  return HOSTELS.includes(value as HostelName) ? (value as HostelName) : HOSTELS[0];
}

function toDepartment(value: string | null | undefined): Department {
  return DEPARTMENTS.includes(value as Department) ? (value as Department) : DEPARTMENTS[0];
}

function toAcademicYear(value: string | null | undefined) {
  return YEARS.includes(value as (typeof YEARS)[number]) ? (value as (typeof YEARS)[number]) : YEARS[0];
}

function toBloodGroup(value: string | null | undefined): BloodGroup | undefined {
  return BLOOD_GROUPS.includes(value as BloodGroup) ? (value as BloodGroup) : undefined;
}

function toAttendanceStatus(value: string | null | undefined): AttendanceStatus {
  const normalized = value?.toLowerCase();

  if (normalized === "present") {
    return "Present";
  }

  if (normalized === "absent") {
    return "Absent";
  }

  if (normalized === "late") {
    return "Late";
  }

  return "Pending";
}

function isAttended(status: AttendanceStatus) {
  return status === "Present" || status === "Late";
}

function toProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    role: toRole(row.role),
    forcePasswordChange: row.force_password_change,
    avatarInitials: getInitials(row.full_name),
  };
}

function toStudent(row: StudentRow, todayStatus: AttendanceStatus, attendancePercentage: number): Student {
  return {
    id: row.id,
    admissionNo: row.admission_no ?? "-",
    fullName: row.full_name,
    email: row.email,
    dateOfBirth: row.date_of_birth,
    year: toAcademicYear(row.academic_year),
    department: toDepartment(row.department),
    hostel: toHostel(row.hostel_name),
    roomNumber: row.room_number,
    sharing: row.sharing,
    bloodGroup: toBloodGroup(row.blood_group),
    studentPhone: row.student_phone,
    parentPhone: row.parent_phone,
    attendancePercentage,
    todayStatus,
  };
}

function emptyHostelAnalytics(hostel: HostelName): HostelAnalytics {
  return {
    hostel,
    totalStudents: 0,
    presentToday: 0,
    absentToday: 0,
    rooms: 0,
    attendanceRate: 0,
  };
}

async function getClient() {
  if (!hasSupabaseEnv()) {
    return null;
  }

  return createSupabaseServerClient();
}

async function getAuthenticatedProfile(supabase: SupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { userId: null, profile: null };
  }

  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, hostel_id, force_password_change")
    .eq("id", user.id)
    .maybeSingle();

  return {
    userId: user.id,
    profile: data ? toProfile(data as ProfileRow) : null,
  };
}

async function fetchVisibleStudents(supabase: SupabaseClient, hostel?: HostelName) {
  let query = supabase
    .from("students")
    .select(
      "id, profile_id, admission_no, full_name, email, date_of_birth, academic_year, department, hostel_name, room_number, sharing, blood_group, student_phone, parent_phone",
    )
    .eq("active", true);

  if (hostel) {
    query = query.eq("hostel_name", hostel);
  }

  const { data } = await query
    .order("hostel_name", { ascending: true })
    .order("room_number", { ascending: true });

  return (data ?? []) as StudentRow[];
}

async function fetchAttendanceForStudents(
  supabase: SupabaseClient,
  studentIds: string[],
  fromDate = dateDaysAgo(29),
  toDate = todayIso(),
) {
  if (!studentIds.length) {
    return [];
  }

  const { data } = await supabase
    .from("attendance")
    .select("id, student_id, attendance_date, check_in_time, status, verified_by, created_at")
    .in("student_id", studentIds)
    .gte("attendance_date", fromDate)
    .lte("attendance_date", toDate)
    .order("attendance_date", { ascending: false });

  return (data ?? []) as AttendanceRow[];
}

async function fetchNotifications(supabase: SupabaseClient, limit = 20) {
  const { data } = await supabase
    .from("notifications")
    .select("id, title, body, audience, severity, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  return ((data ?? []) as NotificationRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    body: row.body,
    audience: toNotificationAudience(row.audience),
    severity: toNotificationSeverity(row.severity),
    createdAt: row.created_at,
    unread: false,
  }));
}

function toNotificationAudience(value: string): NotificationItem["audience"] {
  const allowed: NotificationItem["audience"][] = ["Student", "Warden", "AO", "Director", "All"];
  return allowed.includes(value as NotificationItem["audience"])
    ? (value as NotificationItem["audience"])
    : "All";
}

function toNotificationSeverity(value: string): NotificationItem["severity"] {
  const allowed: NotificationItem["severity"][] = ["info", "success", "warning", "critical"];
  return allowed.includes(value as NotificationItem["severity"])
    ? (value as NotificationItem["severity"])
    : "info";
}

function latestStatusByStudent(attendanceRows: AttendanceRow[], date = todayIso()) {
  const statusMap = new Map<string, AttendanceStatus>();

  for (const row of attendanceRows) {
    if (row.attendance_date === date && !statusMap.has(row.student_id)) {
      statusMap.set(row.student_id, toAttendanceStatus(row.status));
    }
  }

  return statusMap;
}

function attendancePercentages(attendanceRows: AttendanceRow[]) {
  const totals = new Map<string, number>();
  const attended = new Map<string, number>();

  for (const row of attendanceRows) {
    const status = toAttendanceStatus(row.status);
    totals.set(row.student_id, (totals.get(row.student_id) ?? 0) + 1);

    if (isAttended(status)) {
      attended.set(row.student_id, (attended.get(row.student_id) ?? 0) + 1);
    }
  }

  const percentages = new Map<string, number>();

  for (const [studentId, total] of totals) {
    percentages.set(studentId, percent(attended.get(studentId) ?? 0, total));
  }

  return percentages;
}

function buildAttendanceRecords(
  attendanceRows: AttendanceRow[],
  studentsById: Map<string, Student>,
) {
  return attendanceRows.map((row) => {
    const student = studentsById.get(row.student_id);

    return {
      id: row.id,
      studentId: row.student_id,
      studentName: student?.fullName ?? "Unknown student",
      department: student?.department ?? DEPARTMENTS[0],
      hostel: student?.hostel ?? HOSTELS[0],
      roomNumber: student?.roomNumber ?? "-",
      date: row.attendance_date,
      checkInTime: row.check_in_time ?? undefined,
      status: toAttendanceStatus(row.status),
      verifiedBy: row.verified_by ? "Verified" : undefined,
    };
  });
}

function buildCalendar(attendanceRows: AttendanceRow[], days = 28): CalendarDay[] {
  const byDate = new Map<string, AttendanceStatus>();

  for (const row of attendanceRows) {
    byDate.set(row.attendance_date, toAttendanceStatus(row.status));
  }

  return Array.from({ length: days }, (_, index) => {
    const date = dateDaysAgo(days - index - 1);

    return {
      date,
      status: byDate.get(date) ?? "Pending",
    };
  });
}

function buildAttendanceSeries(attendanceRows: AttendanceRow[], days = 7): AttendanceSeriesPoint[] {
  return Array.from({ length: days }, (_, index) => {
    const date = dateDaysAgo(days - index - 1);
    const rowsForDate = attendanceRows.filter((row) => row.attendance_date === date);

    return {
      label: format(new Date(`${date}T00:00:00`), "EEE"),
      present: rowsForDate.filter((row) => toAttendanceStatus(row.status) === "Present").length,
      absent: rowsForDate.filter((row) => toAttendanceStatus(row.status) === "Absent").length,
      late: rowsForDate.filter((row) => toAttendanceStatus(row.status) === "Late").length,
    };
  });
}

function buildStudents(studentRows: StudentRow[], attendanceRows: AttendanceRow[]) {
  const todayStatus = latestStatusByStudent(attendanceRows);
  const percentages = attendancePercentages(attendanceRows);

  return studentRows.map((row) =>
    toStudent(row, todayStatus.get(row.id) ?? "Pending", percentages.get(row.id) ?? 0),
  );
}

function buildHostelAnalytics(students: Student[]) {
  return HOSTELS.map((hostel) => {
    const hostelStudents = students.filter((student) => student.hostel === hostel);
    const presentToday = hostelStudents.filter((student) => isAttended(student.todayStatus)).length;
    const rooms = new Set(hostelStudents.map((student) => student.roomNumber)).size;

    return {
      hostel,
      totalStudents: hostelStudents.length,
      presentToday,
      absentToday: Math.max(0, hostelStudents.length - presentToday),
      rooms,
      attendanceRate: percent(presentToday, hostelStudents.length),
    };
  });
}

function buildDepartmentAnalytics(students: Student[]) {
  return DEPARTMENTS.map((department) => {
    const departmentStudents = students.filter((student) => student.department === department);
    const presentToday = departmentStudents.filter((student) => isAttended(student.todayStatus)).length;

    return {
      department,
      students: departmentStudents.length,
      attendanceRate: percent(presentToday, departmentStudents.length),
    };
  }).filter((item) => item.students > 0);
}

function sharingCapacity(sharing: string) {
  if (sharing.toLowerCase() === "single") {
    return 1;
  }

  const parsed = Number.parseInt(sharing, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function buildRoomStatistics(students: Student[], hostel: HostelName): RoomStatistic[] {
  const rooms = new Map<string, RoomStatistic>();

  for (const student of students.filter((item) => item.hostel === hostel)) {
    const existing =
      rooms.get(student.roomNumber) ??
      ({
        hostel,
        roomNumber: student.roomNumber,
        capacity: sharingCapacity(student.sharing),
        occupied: 0,
        presentToday: 0,
      } satisfies RoomStatistic);

    existing.occupied += 1;
    existing.capacity = Math.max(existing.capacity, sharingCapacity(student.sharing));

    if (isAttended(student.todayStatus)) {
      existing.presentToday += 1;
    }

    rooms.set(student.roomNumber, existing);
  }

  return Array.from(rooms.values()).sort((a, b) => a.roomNumber.localeCompare(b.roomNumber));
}

function buildReportRows(students: Student[]): ReportRow[] {
  const date = todayIso();

  return students.map((student) => ({
    id: `student-${student.id}-${date}`,
    studentId: student.id,
    studentName: student.fullName,
    department: student.department,
    hostel: student.hostel,
    roomNumber: student.roomNumber,
    date,
    status: student.todayStatus,
    percentage: student.attendancePercentage,
  }));
}

export async function getCurrentProfileData() {
  const supabase = await getClient();

  if (!supabase) {
    return null;
  }

  const { profile } = await getAuthenticatedProfile(supabase);
  return profile;
}

export async function getStudentDashboardData(): Promise<StudentDashboardData> {
  const supabase = await getClient();

  if (!supabase) {
    return {
      profile: null,
      student: null,
      history: [],
      attendanceSeries: [],
      calendarDays: [],
      notifications: [],
    };
  }

  const { userId, profile } = await getAuthenticatedProfile(supabase);

  if (!userId) {
    return {
      profile,
      student: null,
      history: [],
      attendanceSeries: [],
      calendarDays: [],
      notifications: [],
    };
  }

  const [{ data: studentRow }, notifications] = await Promise.all([
    supabase
      .from("students")
      .select(
        "id, profile_id, admission_no, full_name, email, date_of_birth, academic_year, department, hostel_name, room_number, sharing, blood_group, student_phone, parent_phone",
      )
      .eq("profile_id", userId)
      .maybeSingle(),
    fetchNotifications(supabase, 10),
  ]);

  if (!studentRow) {
    return {
      profile,
      student: null,
      history: [],
      attendanceSeries: [],
      calendarDays: [],
      notifications,
    };
  }

  const attendanceRows = await fetchAttendanceForStudents(supabase, [(studentRow as StudentRow).id]);
  const students = buildStudents([studentRow as StudentRow], attendanceRows);
  const student = students[0] ?? null;
  const studentsById = new Map(students.map((item) => [item.id, item]));

  return {
    profile,
    student,
    history: buildAttendanceRecords(attendanceRows, studentsById),
    attendanceSeries: buildAttendanceSeries(attendanceRows),
    calendarDays: buildCalendar(attendanceRows),
    notifications,
  };
}

export async function getWardenDashboardData(hostel: HostelName): Promise<WardenDashboardData> {
  const supabase = await getClient();

  if (!supabase) {
    return {
      profile: null,
      hostel,
      students: [],
      analytics: emptyHostelAnalytics(hostel),
      roomStatistics: [],
    };
  }

  const { profile } = await getAuthenticatedProfile(supabase);
  const profileHostel = profile?.role.endsWith("warden")
    ? ROLE_CONFIG[profile.role].hostel
    : undefined;
  const effectiveHostel = profileHostel ?? hostel;
  const studentRows = await fetchVisibleStudents(supabase, effectiveHostel);
  const attendanceRows = await fetchAttendanceForStudents(
    supabase,
    studentRows.map((student) => student.id),
  );
  const students = buildStudents(studentRows, attendanceRows);
  const analytics =
    buildHostelAnalytics(students).find((item) => item.hostel === effectiveHostel) ??
    emptyHostelAnalytics(effectiveHostel);

  return {
    profile,
    hostel: effectiveHostel,
    students,
    analytics,
    roomStatistics: buildRoomStatistics(students, effectiveHostel),
  };
}

export async function getOfficeDashboardData(): Promise<OfficeDashboardData> {
  const supabase = await getClient();

  if (!supabase) {
    return {
      profile: null,
      hostelAnalytics: HOSTELS.map(emptyHostelAnalytics),
      departmentAnalytics: [],
      attendanceSeries: [],
      reportRows: [],
      notifications: [],
    };
  }

  const [{ profile }, studentRows, notifications] = await Promise.all([
    getAuthenticatedProfile(supabase),
    fetchVisibleStudents(supabase),
    fetchNotifications(supabase),
  ]);
  const attendanceRows = await fetchAttendanceForStudents(
    supabase,
    studentRows.map((student) => student.id),
  );
  const students = buildStudents(studentRows, attendanceRows);

  return {
    profile,
    hostelAnalytics: buildHostelAnalytics(students),
    departmentAnalytics: buildDepartmentAnalytics(students),
    attendanceSeries: buildAttendanceSeries(attendanceRows),
    reportRows: buildReportRows(students),
    notifications,
  };
}

export async function getRecentScans(limit = 20) {
  const supabase = await getClient();

  if (!supabase) {
    return [];
  }

  const { data } = await supabase
    .from("attendance")
    .select("id, student_id, attendance_date, check_in_time, status, verified_by, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  const attendanceRows = (data ?? []) as AttendanceRow[];
  const studentRows = await fetchVisibleStudents(supabase);
  const attendanceStudentIds = new Set(attendanceRows.map((row) => row.student_id));
  const students = buildStudents(
    studentRows.filter((student) => attendanceStudentIds.has(student.id)),
    attendanceRows,
  );
  const studentsById = new Map(students.map((student) => [student.id, student]));

  return buildAttendanceRecords(attendanceRows, studentsById);
}

export async function getReportRows() {
  const { reportRows } = await getOfficeDashboardData();
  return reportRows;
}

export async function getNotificationsData() {
  const supabase = await getClient();

  if (!supabase) {
    return [];
  }

  return fetchNotifications(supabase);
}
