import {
  BarChart3,
  Bell,
  Building2,
  CalendarCheck2,
  Camera,
  ClipboardList,
  GraduationCap,
  Home,
  KeyRound,
  LineChart,
  LucideIcon,
  QrCode,
  ScanLine,
  Settings,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react";

export const COLLEGE_NAME =
  "PARK COLLEGE OF ENGINEERING AND TECHNOLOGY";

export const APP_NAME = "Hostel Attendance Management System";

export const HOSTELS = [
  "MKG Boys Hostel",
  "MKG Girls Hostel",
  "NRI Boys Hostel",
  "NRI Girls Hostel",
] as const;

export const DEPARTMENTS = [
  "IT",
  "AI&DS",
  "AGRI",
  "TEXTILE",
  "CSE",
  "CYBER",
  "AERO",
  "MECHANICAL",
  "MECHATRONICS",
  "BME",
  "EEE",
  "MEDICAL ELECTRONICS",
  "ROBO",
  "GEO",
  "ECE",
  "AUTOMOBILE",
] as const;

export const YEARS = ["I", "II", "III", "IV"] as const;

export const SHARING_OPTIONS = ["Single", "2 Sharing", "3 Sharing", "4 Sharing", "12 Sharing"] as const;

export const BLOOD_GROUPS = ["A+", "A1+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

export const ATTENDANCE_WINDOW = {
  start: "06:00",
  end: "08:00",
  expirySeconds: 60,
};

export const REPORT_TYPES = [
  "Daily",
  "Weekly",
  "Monthly",
  "Yearly",
  "Department",
  "Hostel",
  "Student",
] as const;

export const EXPORT_FORMATS = ["CSV", "Excel", "PDF"] as const;

export type RoleSlug =
  | "student"
  | "mkg-boys-warden"
  | "mkg-girls-warden"
  | "nri-boys-warden"
  | "nri-girls-warden"
  | "ao"
  | "director";

export type RoleMeta = {
  slug: RoleSlug;
  label: string;
  route: string;
  hostel?: (typeof HOSTELS)[number];
  tone: "blue" | "emerald" | "amber" | "rose" | "violet" | "zinc";
  permissions: string[];
  icon: LucideIcon;
};

export const ROLE_CONFIG: Record<RoleSlug, RoleMeta> = {
  student: {
    slug: "student",
    label: "Student",
    route: "/student",
    tone: "blue",
    icon: GraduationCap,
    permissions: [
      "View own profile",
      "View own attendance",
      "Generate attendance QR",
      "View notifications",
      "Change password",
    ],
  },
  "mkg-boys-warden": {
    slug: "mkg-boys-warden",
    label: "MKG Boys Warden",
    route: "/warden?hostel=mkg-boys",
    hostel: "MKG Boys Hostel",
    tone: "emerald",
    icon: ShieldCheck,
    permissions: [
      "Live QR scanner",
      "Hostel students",
      "Room statistics",
      "Attendance reports",
      "Exports",
    ],
  },
  "mkg-girls-warden": {
    slug: "mkg-girls-warden",
    label: "MKG Girls Warden",
    route: "/warden?hostel=mkg-girls",
    hostel: "MKG Girls Hostel",
    tone: "rose",
    icon: ShieldCheck,
    permissions: [
      "Live QR scanner",
      "Hostel students",
      "Room statistics",
      "Attendance reports",
      "Exports",
    ],
  },
  "nri-boys-warden": {
    slug: "nri-boys-warden",
    label: "NRI Boys Warden",
    route: "/warden?hostel=nri-boys",
    hostel: "NRI Boys Hostel",
    tone: "amber",
    icon: ShieldCheck,
    permissions: [
      "Live QR scanner",
      "Hostel students",
      "Room statistics",
      "Attendance reports",
      "Exports",
    ],
  },
  "nri-girls-warden": {
    slug: "nri-girls-warden",
    label: "NRI Girls Warden",
    route: "/warden?hostel=nri-girls",
    hostel: "NRI Girls Hostel",
    tone: "violet",
    icon: ShieldCheck,
    permissions: [
      "Live QR scanner",
      "Hostel students",
      "Room statistics",
      "Attendance reports",
      "Exports",
    ],
  },
  ao: {
    slug: "ao",
    label: "AO",
    route: "/ao",
    tone: "zinc",
    icon: BarChart3,
    permissions: ["View all hostels", "Attendance reports", "Realtime dashboard"],
  },
  director: {
    slug: "director",
    label: "Director",
    route: "/director",
    tone: "blue",
    icon: LineChart,
    permissions: ["Full system access"],
  },
};

export const WARDEN_ROLES: RoleSlug[] = [
  "mkg-boys-warden",
  "mkg-girls-warden",
  "nri-boys-warden",
  "nri-girls-warden",
];

export const OFFICE_ROLES: RoleSlug[] = ["ao", "director"];

export const NAVIGATION = [
  {
    label: "Dashboard",
    href: "$dashboard",
    icon: Home,
    roles: ["student", ...WARDEN_ROLES, ...OFFICE_ROLES],
  },
  { label: "Attendance", href: "/attendance", icon: CalendarCheck2, roles: ["student"] },
  { label: "Scanner", href: "/scanner", icon: ScanLine, roles: WARDEN_ROLES },
  { label: "Reports", href: "/reports", icon: ClipboardList, roles: [...WARDEN_ROLES, ...OFFICE_ROLES] },
  {
    label: "Notifications",
    href: "/notifications",
    icon: Bell,
    roles: ["student", ...WARDEN_ROLES, ...OFFICE_ROLES],
  },
  {
    label: "Profile",
    href: "/profile",
    icon: UserRound,
    roles: ["student", ...WARDEN_ROLES, ...OFFICE_ROLES],
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    roles: ["student", ...WARDEN_ROLES, ...OFFICE_ROLES],
  },
];

export const STUDENT_WIDGETS = [
  { label: "Attendance Percentage", icon: BarChart3 },
  { label: "Today's Attendance", icon: CalendarCheck2 },
  { label: "Attendance Calendar", icon: CalendarCheck2 },
  { label: "Attendance History", icon: ClipboardList },
  { label: "Notifications", icon: Bell },
  { label: "Generate QR", icon: QrCode },
  { label: "Profile", icon: UserRound },
  { label: "Change Password", icon: KeyRound },
];

export const WARDEN_FEATURES = [
  { label: "Live QR Scanner", icon: Camera },
  { label: "Today's Attendance", icon: CalendarCheck2 },
  { label: "Hostel Students", icon: UsersRound },
  { label: "Room Statistics", icon: Building2 },
  { label: "Attendance Reports", icon: ClipboardList },
  { label: "Search Students", icon: ScanLine },
  { label: "Export CSV", icon: ClipboardList },
  { label: "Export Excel", icon: ClipboardList },
  { label: "Export PDF", icon: ClipboardList },
];
