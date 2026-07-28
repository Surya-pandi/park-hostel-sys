"use server";

import { revalidatePath } from "next/cache";

import {
  FOOD_MENU_DAY_LABELS,
  ROLE_CONFIG,
  WARDEN_ROLES,
  type RoleSlug,
} from "@/lib/constants";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
  hasSupabaseAdminEnv,
  hasSupabaseEnv,
} from "@/lib/supabase/server";
import type { ActionState } from "@/lib/types";
import { foodMenuDecisionSchema, foodMenuSchema } from "@/lib/validations";

type ProfileRow = {
  id: string;
  role: RoleSlug;
  hostel_id?: string | null;
};

type FoodMenuRow = {
  id: string;
  status: string;
};

function firstIssueMessage(error: { issues: { message: string }[] }) {
  return error.issues[0]?.message ?? "Please check the submitted details.";
}

function addDaysToIsoDate(isoDate: string, days: number) {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function textFromForm(formData: FormData, name: string) {
  return String(formData.get(name) ?? "");
}

function parseMenuForm(formData: FormData) {
  const weekStart = textFromForm(formData, "weekStart");
  const title = textFromForm(formData, "title").trim() || undefined;
  const days = FOOD_MENU_DAY_LABELS.map((day, index) => ({
    day,
    date: weekStart ? addDaysToIsoDate(weekStart, index) : "",
    breakfast: textFromForm(formData, `breakfast-${index}`),
    lunch: textFromForm(formData, `lunch-${index}`),
    snacks: textFromForm(formData, `snacks-${index}`),
    dinner: textFromForm(formData, `dinner-${index}`),
  }));

  return foodMenuSchema.safeParse({
    title,
    weekStart,
    days,
  });
}

async function getAuthenticatedProfile() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, userId: null, profile: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, hostel_id")
    .eq("id", user.id)
    .maybeSingle();

  return {
    supabase,
    userId: user.id,
    profile: profile as ProfileRow | null,
  };
}

async function resolveWardenHostelId(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  profile: ProfileRow,
) {
  if (profile.hostel_id) {
    return profile.hostel_id;
  }

  const hostelName = ROLE_CONFIG[profile.role].hostel;

  if (!hostelName) {
    return null;
  }

  const { data } = await supabase
    .from("hostels")
    .select("id")
    .eq("name", hostelName)
    .maybeSingle();

  return (data as { id?: string } | null)?.id ?? null;
}

function revalidateFoodMenuViews() {
  revalidatePath("/food-menu");
  revalidatePath("/student");
  revalidatePath("/warden");
  revalidatePath("/director");
}

export async function submitFoodMenuAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parseMenuForm(formData);

  if (!parsed.success) {
    return { ok: false, message: firstIssueMessage(parsed.error) };
  }

  if (!hasSupabaseEnv()) {
    return { ok: false, message: "Supabase environment variables are required for food menus." };
  }

  if (!hasSupabaseAdminEnv()) {
    return { ok: false, message: "Supabase service role key is required for food menu updates." };
  }

  const { supabase, userId, profile } = await getAuthenticatedProfile();

  if (!userId || !profile) {
    return { ok: false, message: "Sign in as a warden to submit food menus." };
  }

  if (!WARDEN_ROLES.includes(profile.role)) {
    return { ok: false, message: "Only wardens can submit weekly food menus." };
  }

  const hostelId = await resolveWardenHostelId(supabase, profile);

  if (!hostelId) {
    return { ok: false, message: "Assigned hostel was not found for this warden account." };
  }

  const admin = createSupabaseAdminClient();
  const weekEnd = addDaysToIsoDate(parsed.data.weekStart, 6);
  const title = parsed.data.title?.trim() || "Weekly Food Menu";
  const { data: existing, error: existingError } = await admin
    .from("food_menus")
    .select("id, status")
    .eq("hostel_id", hostelId)
    .eq("week_start", parsed.data.weekStart)
    .maybeSingle();

  if (existingError) {
    return { ok: false, message: existingError.message };
  }

  const payload = {
    hostel_id: hostelId,
    title,
    week_start: parsed.data.weekStart,
    week_end: weekEnd,
    items: parsed.data.days,
    status: "pending_director",
    submitted_by: userId,
    submitted_at: new Date().toISOString(),
    director_reviewed_by: null,
    director_reviewed_at: null,
    director_note: null,
  };

  const result = existing
    ? await admin
        .from("food_menus")
        .update(payload)
        .eq("id", (existing as FoodMenuRow).id)
        .select("id")
        .maybeSingle()
    : await admin
        .from("food_menus")
        .insert(payload)
        .select("id")
        .maybeSingle();

  if (result.error) {
    return { ok: false, message: result.error.message };
  }

  if (!result.data) {
    return { ok: false, message: "Food menu could not be saved. Refresh and try again." };
  }

  await admin.from("audit_logs").insert({
    actor_id: userId,
    table_name: "food_menus",
    action: existing ? "food_menu_resubmitted" : "food_menu_submitted",
    row_id: (result.data as { id: string }).id,
    old_data: existing ? { status: (existing as FoodMenuRow).status } : null,
    new_data: { status: "pending_director", week_start: parsed.data.weekStart },
  });

  revalidateFoodMenuViews();

  return {
    ok: true,
    message: "Food menu submitted for director approval.",
  };
}

export async function decideFoodMenuAction(
  menuId: string,
  decision: "approve" | "reject",
  note = "",
): Promise<ActionState> {
  const parsed = foodMenuDecisionSchema.safeParse({ menuId, decision, note });

  if (!parsed.success) {
    return { ok: false, message: firstIssueMessage(parsed.error) };
  }

  if (!hasSupabaseEnv()) {
    return { ok: false, message: "Supabase environment variables are required for food menu approvals." };
  }

  if (!hasSupabaseAdminEnv()) {
    return { ok: false, message: "Supabase service role key is required for food menu approvals." };
  }

  const { userId, profile } = await getAuthenticatedProfile();

  if (!userId || !profile) {
    return { ok: false, message: "Sign in as director to review food menus." };
  }

  if (profile.role !== "director") {
    return { ok: false, message: "Only the director can approve food menus." };
  }

  const admin = createSupabaseAdminClient();
  const { data: menu, error: menuError } = await admin
    .from("food_menus")
    .select("id, status")
    .eq("id", parsed.data.menuId)
    .maybeSingle();

  if (menuError) {
    return { ok: false, message: menuError.message };
  }

  if (!menu) {
    return { ok: false, message: "Food menu was not found." };
  }

  if ((menu as FoodMenuRow).status !== "pending_director") {
    return { ok: false, message: "This food menu is not waiting for director approval." };
  }

  const nextStatus = parsed.data.decision === "approve" ? "approved" : "rejected_director";
  const { data: updatedMenu, error: updateError } = await admin
    .from("food_menus")
    .update({
      status: nextStatus,
      director_reviewed_by: userId,
      director_reviewed_at: new Date().toISOString(),
      director_note: parsed.data.note?.trim() || null,
    })
    .eq("id", parsed.data.menuId)
    .eq("status", "pending_director")
    .select("id")
    .maybeSingle();

  if (updateError) {
    return { ok: false, message: updateError.message };
  }

  if (!updatedMenu) {
    return { ok: false, message: "Food menu status changed. Refresh and try again." };
  }

  await admin.from("audit_logs").insert({
    actor_id: userId,
    table_name: "food_menus",
    action: nextStatus === "approved" ? "food_menu_approved_by_director" : "food_menu_rejected_by_director",
    row_id: parsed.data.menuId,
    old_data: { status: "pending_director" },
    new_data: { status: nextStatus },
  });

  revalidateFoodMenuViews();

  return {
    ok: true,
    message: nextStatus === "approved"
      ? "Food menu approved and visible to students."
      : "Food menu rejected.",
  };
}
