import { BLOOD_GROUPS, DEPARTMENTS, HOSTELS, RoleSlug, YEARS } from "./constants";

export type HostelName = (typeof HOSTELS)[number];
export type Department = (typeof DEPARTMENTS)[number];
export type AcademicYear = (typeof YEARS)[number];
export type BloodGroup = (typeof BLOOD_GROUPS)[number];

export type Profile = {
  id: string;
  fullName: string;
  email: string;
  role: RoleSlug;
  hostel?: HostelName;
  forcePasswordChange: boolean;
  avatarInitials: string;
};

export type Student = {
  id: string;
  admissionNo: string;
  fullName: string;
  email: string;
  dateOfBirth: string;
  year: AcademicYear;
  department: Department;
  hostel: HostelName;
  roomNumber: string;
  sharing: string;
  bloodGroup?: BloodGroup;
  studentPhone: string;
  parentPhone: string;
  attendancePercentage: number;
  todayStatus: AttendanceStatus;
};

export type AttendanceStatus = "Present" | "Absent" | "Pending" | "Late";

export type AttendanceRecord = {
  id: string;
  studentId: string;
  studentName: string;
  department: Department;
  hostel: HostelName;
  roomNumber: string;
  date: string;
  checkInTime?: string;
  status: AttendanceStatus;
  verifiedBy?: string;
};

export type AttendanceSeriesPoint = {
  label: string;
  present: number;
  absent: number;
  late: number;
};

export type HostelAnalytics = {
  hostel: HostelName;
  totalStudents: number;
  presentToday: number;
  absentToday: number;
  rooms: number;
  attendanceRate: number;
};

export type DepartmentAnalytics = {
  department: Department;
  attendanceRate: number;
  students: number;
};

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  audience: "Student" | "Warden" | "AO" | "Director" | "All";
  severity: "info" | "success" | "warning" | "critical";
  createdAt: string;
  unread: boolean;
};

export type RoomStatistic = {
  hostel: HostelName;
  roomNumber: string;
  capacity: number;
  occupied: number;
  presentToday: number;
};

export type CalendarDay = {
  date: string;
  status: AttendanceStatus;
};

export type ReportRow = AttendanceRecord & {
  percentage: number;
};

export type ActionState = {
  ok: boolean;
  message: string;
  redirectTo?: string;
};
