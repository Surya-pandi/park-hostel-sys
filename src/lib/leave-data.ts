import {
  DEPARTMENTS,
  HOSTELS,
  LEAVE_STATUSES,
  LEAVE_STATUS_LABELS,
  ROLE_CONFIG,
  WARDEN_ROLES,
  YEARS,
  type RoleSlug,
} from "@/lib/constants";
import {
  createSupabaseServerClient,
  hasSupabaseEnv,
} from "@/lib/supabase/server";
import type {
  AcademicYear,
  Department,
  HostelName,
  LeaveRequest,
  LeaveRequestStatus,
  Profile,
} from "@/lib/types";
import { getInitials } from "@/lib/utils";

type SupabaseClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

type ProfileRow = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  hostel_id?: string | null;
  force_password_change: boolean;
};

type LeaveStudentRow = {
  id: string;
  profile_id: string;
  admission_no?: string | null;
  full_name: string;
  academic_year: string;
  department: string;
  hostel_id: string;
  hostel_name: string;
  room_number: string;
};

type LeaveRequestRow = {
  id: string;
  student_id: string;
  profile_id: string;
  hostel_id: string;
  from_date: string;
  to_date: string;
  reason: string;
  status: string;
  warden_reviewed_at?: string | null;
  warden_note?: string | null;
  ao_reviewed_at?: string | null;
  ao_note?: string | null;
  director_reviewed_at?: string | null;
  director_note?: string | null;
  created_at: string;
};

export type LeaveStudentSummary = {
  id: string;
  fullName: string;
  admissionNo: string;
  year: AcademicYear;
  department: Department;
  hostelId: string;
  hostel: HostelName;
  roomNumber: string;
};

export type LeavePageData = {
  profile: Profile | null;
  student: LeaveStudentSummary | null;
  requests: LeaveRequest[];
  pendingReviewCount: number;
  scope: "student" | "warden" | "ao" | "director";
  schemaReady: boolean;
  errorMessage?: string;
};

function toRole(value: string | null | undefined): RoleSlug {
  return value && value in ROLE_CONFIG ? (value as RoleSlug) : "student";
}

function toHostel(value: string | null | undefined): HostelName {
  return HOSTELS.includes(value as HostelName) ? (value as HostelName) : HOSTELS[0];
}

function toDepartment(value: string | null | undefined): Department {
  return DEPARTMENTS.includes(value as Department) ? (value as Department) : DEPARTMENTS[0];
}

function toAcademicYear(value: string | null | undefined): AcademicYear {
  return YEARS.includes(value as AcademicYear) ? (value as AcademicYear) : YEARS[0];
}

function toLeaveStatus(value: string | null | undefined): LeaveRequestStatus {
  return LEAVE_STATUSES.includes(value as LeaveRequestStatus)
    ? (value as LeaveRequestStatus)
    : "pending_warden";
}

function toProfile(row: ProfileRow): Profile {
  const role = toRole(row.role);

  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    role,
    hostel: ROLE_CONFIG[role].hostel,
    forcePasswordChange: row.force_password_change,
    avatarInitials: getInitials(row.full_name),
  };
}

function toStudentSummary(row: LeaveStudentRow): LeaveStudentSummary {
  return {
    id: row.id,
    fullName: row.full_name,
    admissionNo: row.admission_no ?? "-",
    year: toAcademicYear(row.academic_year),
    department: toDepartment(row.department),
    hostelId: row.hostel_id,
    hostel: toHostel(row.hostel_name),
    roomNumber: row.room_number,
  };
}

function getScope(role: RoleSlug): LeavePageData["scope"] {
  if (WARDEN_ROLES.includes(role)) {
    return "warden";
  }

  if (role === "ao") {
    return "ao";
  }

  if (role === "director") {
    return "director";
  }

  return "student";
}

function canReviewLeave(
  row: LeaveRequestRow,
  role: RoleSlug,
  profileHostelId?: string | null,
) {
  if (WARDEN_ROLES.includes(role)) {
    return row.status === "pending_warden" && Boolean(profileHostelId) && row.hostel_id === profileHostelId;
  }

  if (role === "ao") {
    return row.status === "pending_ao";
  }

  if (role === "director") {
    return row.status === "pending_director";
  }

  return false;
}

function toLeaveRequest(
  row: LeaveRequestRow,
  studentsById: Map<string, LeaveStudentSummary>,
  role: RoleSlug,
  profileHostelId?: string | null,
): LeaveRequest {
  const student = studentsById.get(row.student_id);
  const status = toLeaveStatus(row.status);

  return {
    id: row.id,
    studentId: row.student_id,
    studentName: student?.fullName ?? "Unknown student",
    admissionNo: student?.admissionNo ?? "-",
    year: student?.year ?? YEARS[0],
    department: student?.department ?? DEPARTMENTS[0],
    hostel: student?.hostel ?? HOSTELS[0],
    roomNumber: student?.roomNumber ?? "-",
    fromDate: row.from_date,
    toDate: row.to_date,
    reason: row.reason,
    status,
    statusLabel: LEAVE_STATUS_LABELS[status],
    wardenReviewedAt: row.warden_reviewed_at ?? undefined,
    wardenNote: row.warden_note ?? undefined,
    aoReviewedAt: row.ao_reviewed_at ?? undefined,
    aoNote: row.ao_note ?? undefined,
    directorReviewedAt: row.director_reviewed_at ?? undefined,
    directorNote: row.director_note ?? undefined,
    createdAt: row.created_at,
    canReview: canReviewLeave(row, role, profileHostelId),
  };
}

async function getAuthenticatedProfile(supabase: SupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { userId: null, profile: null, profileRow: null };
  }

  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, hostel_id, force_password_change")
    .eq("id", user.id)
    .maybeSingle();

  const profileRow = data ? (data as ProfileRow) : null;

  return {
    userId: user.id,
    profile: profileRow ? toProfile(profileRow) : null,
    profileRow,
  };
}

async function fetchCurrentStudent(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase
    .from("students")
    .select(
      "id, profile_id, admission_no, full_name, academic_year, department, hostel_id, hostel_name, room_number",
    )
    .eq("profile_id", userId)
    .maybeSingle();

  return data ? toStudentSummary(data as LeaveStudentRow) : null;
}

async function fetchStudentsById(supabase: SupabaseClient, studentIds: string[]) {
  if (!studentIds.length) {
    return new Map<string, LeaveStudentSummary>();
  }

  const { data } = await supabase
    .from("students")
    .select(
      "id, profile_id, admission_no, full_name, academic_year, department, hostel_id, hostel_name, room_number",
    )
    .in("id", studentIds);

  return new Map(
    ((data ?? []) as LeaveStudentRow[]).map((row) => {
      const student = toStudentSummary(row);
      return [student.id, student];
    }),
  );
}

export async function getLeavePageData(): Promise<LeavePageData> {
  if (!hasSupabaseEnv()) {
    return {
      profile: null,
      student: null,
      requests: [],
      pendingReviewCount: 0,
      scope: "student",
      schemaReady: true,
      errorMessage: "Supabase environment variables are required for leave requests.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { userId, profile, profileRow } = await getAuthenticatedProfile(supabase);
  const role = profile?.role ?? "student";

  if (!userId || !profileRow) {
    return {
      profile,
      student: null,
      requests: [],
      pendingReviewCount: 0,
      scope: getScope(role),
      schemaReady: true,
    };
  }

  const [{ data: leaveRows, error }, student] = await Promise.all([
    supabase
      .from("leave_requests")
      .select(
        "id, student_id, profile_id, hostel_id, from_date, to_date, reason, status, warden_reviewed_at, warden_note, ao_reviewed_at, ao_note, director_reviewed_at, director_note, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(100),
    fetchCurrentStudent(supabase, userId),
  ]);

  if (error) {
    return {
      profile,
      student,
      requests: [],
      pendingReviewCount: 0,
      scope: getScope(role),
      schemaReady: error.code !== "42P01",
      errorMessage: error.message,
    };
  }

  const rows = (leaveRows ?? []) as LeaveRequestRow[];
  const studentIds = Array.from(new Set(rows.map((row) => row.student_id)));
  const studentsById = await fetchStudentsById(supabase, studentIds);
  const requests = rows.map((row) =>
    toLeaveRequest(row, studentsById, role, profileRow.hostel_id),
  );

  return {
    profile,
    student,
    requests,
    pendingReviewCount: requests.filter((request) => request.canReview).length,
    scope: getScope(role),
    schemaReady: true,
  };
}
