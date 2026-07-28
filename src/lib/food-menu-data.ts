import {
  FOOD_MENU_DAY_LABELS,
  FOOD_MENU_STATUS_LABELS,
  FOOD_MENU_STATUSES,
  HOSTELS,
  ROLE_CONFIG,
  WARDEN_ROLES,
  type RoleSlug,
} from "@/lib/constants";
import {
  createSupabaseServerClient,
  hasSupabaseEnv,
} from "@/lib/supabase/server";
import type {
  FoodMenu,
  FoodMenuDay,
  FoodMenuStatus,
  HostelName,
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

type HostelRow = {
  id: string;
  name: string;
};

type FoodMenuRow = {
  id: string;
  hostel_id: string;
  title: string;
  week_start: string;
  week_end: string;
  items: unknown;
  status: string;
  submitted_by: string;
  submitted_at: string;
  director_reviewed_at?: string | null;
  director_note?: string | null;
  created_at: string;
};

export type FoodMenuPageData = {
  profile: Profile | null;
  scope: "guest" | "student" | "warden" | "director";
  assignedHostel?: HostelName;
  menus: FoodMenu[];
  currentMenu: FoodMenu | null;
  pendingApprovalCount: number;
  schemaReady: boolean;
  errorMessage?: string;
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysToIsoDate(isoDate: string, days: number) {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function asText(value: unknown) {
  return typeof value === "string" ? value : "";
}

function toRole(value: string | null | undefined): RoleSlug {
  return value && value in ROLE_CONFIG ? (value as RoleSlug) : "student";
}

function toHostel(value: string | null | undefined): HostelName {
  return HOSTELS.includes(value as HostelName) ? (value as HostelName) : HOSTELS[0];
}

function toFoodMenuStatus(value: string | null | undefined): FoodMenuStatus {
  return FOOD_MENU_STATUSES.includes(value as FoodMenuStatus)
    ? (value as FoodMenuStatus)
    : "pending_director";
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

function toMenuDays(value: unknown, weekStart: string): FoodMenuDay[] {
  const rows = Array.isArray(value) ? value : [];

  return FOOD_MENU_DAY_LABELS.map((day, index) => {
    const row = rows[index] && typeof rows[index] === "object" ? (rows[index] as Record<string, unknown>) : {};

    return {
      day,
      date: asText(row.date) || addDaysToIsoDate(weekStart, index),
      breakfast: asText(row.breakfast),
      lunch: asText(row.lunch),
      snacks: asText(row.snacks),
      dinner: asText(row.dinner),
    };
  });
}

function getScope(role: RoleSlug): FoodMenuPageData["scope"] {
  if (WARDEN_ROLES.includes(role)) {
    return "warden";
  }

  if (role === "director") {
    return "director";
  }

  return "student";
}

function resolveAssignedHostel(
  role: RoleSlug,
  profileHostelId: string | null | undefined,
  hostels: HostelRow[],
) {
  const configuredHostel = ROLE_CONFIG[role].hostel;
  const assignedHostelRow =
    hostels.find((hostel) => hostel.id === profileHostelId) ??
    hostels.find((hostel) => hostel.name === configuredHostel);

  return assignedHostelRow
    ? {
        id: assignedHostelRow.id,
        name: toHostel(assignedHostelRow.name),
      }
    : null;
}

function toFoodMenu(
  row: FoodMenuRow,
  hostelsById: Map<string, HostelName>,
  role: RoleSlug,
): FoodMenu {
  const status = toFoodMenuStatus(row.status);

  return {
    id: row.id,
    hostelId: row.hostel_id,
    hostel: hostelsById.get(row.hostel_id) ?? HOSTELS[0],
    title: row.title || "Weekly Food Menu",
    weekStart: row.week_start,
    weekEnd: row.week_end,
    items: toMenuDays(row.items, row.week_start),
    status,
    statusLabel: FOOD_MENU_STATUS_LABELS[status],
    submittedBy: row.submitted_by,
    submittedAt: row.submitted_at,
    directorReviewedAt: row.director_reviewed_at ?? undefined,
    directorNote: row.director_note ?? undefined,
    createdAt: row.created_at,
    canApprove: role === "director" && status === "pending_director",
  };
}

function isCurrentApproved(menu: FoodMenu, date = todayIso()) {
  return menu.status === "approved" && menu.weekStart <= date && menu.weekEnd >= date;
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

async function fetchHostels(supabase: SupabaseClient) {
  const { data } = await supabase
    .from("hostels")
    .select("id, name")
    .order("name", { ascending: true });

  return (data ?? []) as HostelRow[];
}

async function fetchStudentHostelId(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase
    .from("students")
    .select("hostel_id")
    .eq("profile_id", userId)
    .eq("active", true)
    .maybeSingle();

  return (data as { hostel_id?: string | null } | null)?.hostel_id ?? null;
}

function emptyData(
  overrides: Partial<FoodMenuPageData> = {},
): FoodMenuPageData {
  return {
    profile: null,
    scope: "guest",
    menus: [],
    currentMenu: null,
    pendingApprovalCount: 0,
    schemaReady: true,
    ...overrides,
  };
}

export async function getFoodMenuPageData(): Promise<FoodMenuPageData> {
  if (!hasSupabaseEnv()) {
    return emptyData({
      errorMessage: "Supabase environment variables are required for food menus.",
    });
  }

  const supabase = await createSupabaseServerClient();
  const { userId, profile, profileRow } = await getAuthenticatedProfile(supabase);

  if (!userId || !profileRow || !profile) {
    return emptyData({ profile });
  }

  const role = profile.role;
  const scope = getScope(role);
  const hostels = await fetchHostels(supabase);
  const hostelsById = new Map(hostels.map((hostel) => [hostel.id, toHostel(hostel.name)]));
  const assignedHostel = WARDEN_ROLES.includes(role)
    ? resolveAssignedHostel(role, profileRow.hostel_id, hostels)
    : null;
  const studentHostelId = scope === "student" ? await fetchStudentHostelId(supabase, userId) : null;

  let query = supabase
    .from("food_menus")
    .select(
      "id, hostel_id, title, week_start, week_end, items, status, submitted_by, submitted_at, director_reviewed_at, director_note, created_at",
    )
    .order("week_start", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(60);

  if (scope === "warden") {
    if (!assignedHostel) {
      return emptyData({
        profile,
        scope,
        errorMessage: "Assigned hostel was not found for this warden account.",
      });
    }

    query = query.eq("hostel_id", assignedHostel.id);
  }

  if (scope === "student") {
    if (!studentHostelId) {
      return emptyData({ profile, scope });
    }

    query = query.eq("hostel_id", studentHostelId).eq("status", "approved");
  }

  const { data, error } = await query;

  if (error) {
    return emptyData({
      profile,
      scope,
      assignedHostel: assignedHostel?.name,
      schemaReady: error.code !== "42P01",
      errorMessage: error.message,
    });
  }

  const menus = ((data ?? []) as FoodMenuRow[]).map((row) =>
    toFoodMenu(row, hostelsById, role),
  );
  const sortedMenus = menus.sort((a, b) => {
    if (a.canApprove !== b.canApprove) {
      return a.canApprove ? -1 : 1;
    }

    return b.weekStart.localeCompare(a.weekStart);
  });
  const currentMenu =
    sortedMenus.find((menu) => isCurrentApproved(menu)) ??
    sortedMenus.find((menu) => menu.status === "approved") ??
    null;

  return {
    profile,
    scope,
    assignedHostel: assignedHostel?.name,
    menus: sortedMenus,
    currentMenu,
    pendingApprovalCount: sortedMenus.filter((menu) => menu.canApprove).length,
    schemaReady: true,
  };
}
