"use server";

import { revalidatePath } from "next/cache";

import { WARDEN_ROLES, type RoleSlug } from "@/lib/constants";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
  hasSupabaseAdminEnv,
  hasSupabaseEnv,
} from "@/lib/supabase/server";
import type { ActionState, LeaveRequestStatus } from "@/lib/types";
import { leaveDecisionSchema, leaveRequestSchema } from "@/lib/validations";

type ProfileRow = {
  id: string;
  role: RoleSlug;
  hostel_id?: string | null;
};

type LeaveRequestRow = {
  id: string;
  student_id: string;
  hostel_id: string;
  status: LeaveRequestStatus;
};

type ReviewPlan = {
  nextStatus: LeaveRequestStatus;
  reviewedByColumn: "warden_reviewed_by" | "ao_reviewed_by" | "director_reviewed_by";
  reviewedAtColumn: "warden_reviewed_at" | "ao_reviewed_at" | "director_reviewed_at";
  noteColumn: "warden_note" | "ao_note" | "director_note";
  auditAction: string;
};

function firstIssueMessage(error: { issues: { message: string }[] }) {
  return error.issues[0]?.message ?? "Please check the submitted details.";
}

function actionMessage(nextStatus: LeaveRequestStatus) {
  if (nextStatus === "pending_ao") {
    return "Leave request confirmed by warden and sent to AO.";
  }

  if (nextStatus === "pending_director") {
    return "Leave request confirmed by AO and sent to director.";
  }

  if (nextStatus === "approved") {
    return "Leave request approved by director.";
  }

  return "Leave request rejected.";
}

function buildReviewPlan(
  request: LeaveRequestRow,
  profile: ProfileRow,
  decision: "approve" | "reject",
): ReviewPlan | null {
  if (WARDEN_ROLES.includes(profile.role)) {
    if (request.status !== "pending_warden" || request.hostel_id !== profile.hostel_id) {
      return null;
    }

    return {
      nextStatus: decision === "approve" ? "pending_ao" : "rejected_warden",
      reviewedByColumn: "warden_reviewed_by",
      reviewedAtColumn: "warden_reviewed_at",
      noteColumn: "warden_note",
      auditAction: decision === "approve" ? "leave_confirmed_by_warden" : "leave_rejected_by_warden",
    };
  }

  if (profile.role === "ao") {
    if (request.status !== "pending_ao") {
      return null;
    }

    return {
      nextStatus: decision === "approve" ? "pending_director" : "rejected_ao",
      reviewedByColumn: "ao_reviewed_by",
      reviewedAtColumn: "ao_reviewed_at",
      noteColumn: "ao_note",
      auditAction: decision === "approve" ? "leave_confirmed_by_ao" : "leave_rejected_by_ao",
    };
  }

  if (profile.role === "director") {
    if (request.status !== "pending_director") {
      return null;
    }

    return {
      nextStatus: decision === "approve" ? "approved" : "rejected_director",
      reviewedByColumn: "director_reviewed_by",
      reviewedAtColumn: "director_reviewed_at",
      noteColumn: "director_note",
      auditAction: decision === "approve" ? "leave_approved_by_director" : "leave_rejected_by_director",
    };
  }

  return null;
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

export async function createLeaveRequestAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = leaveRequestSchema.safeParse({
    fromDate: formData.get("fromDate"),
    toDate: formData.get("toDate"),
    reason: formData.get("reason"),
  });

  if (!parsed.success) {
    return { ok: false, message: firstIssueMessage(parsed.error) };
  }

  if (!hasSupabaseEnv()) {
    return { ok: false, message: "Supabase environment variables are required for leave requests." };
  }

  const { supabase, userId, profile } = await getAuthenticatedProfile();

  if (!userId || !profile) {
    return { ok: false, message: "Sign in as a student to request leave." };
  }

  if (profile.role !== "student") {
    return { ok: false, message: "Only students can create leave requests." };
  }

  const { data: student } = await supabase
    .from("students")
    .select("id, hostel_id")
    .eq("profile_id", userId)
    .eq("active", true)
    .maybeSingle();

  if (!student) {
    return { ok: false, message: "Student profile not found." };
  }

  const { error } = await supabase.from("leave_requests").insert({
    student_id: student.id,
    profile_id: userId,
    hostel_id: student.hostel_id,
    from_date: parsed.data.fromDate,
    to_date: parsed.data.toDate,
    reason: parsed.data.reason,
    status: "pending_warden",
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/leave");

  return {
    ok: true,
    message: "Leave request submitted for warden confirmation.",
  };
}

export async function decideLeaveRequestAction(
  requestId: string,
  decision: "approve" | "reject",
  note = "",
): Promise<ActionState> {
  const parsed = leaveDecisionSchema.safeParse({ requestId, decision, note });

  if (!parsed.success) {
    return { ok: false, message: firstIssueMessage(parsed.error) };
  }

  if (!hasSupabaseEnv()) {
    return { ok: false, message: "Supabase environment variables are required for leave approvals." };
  }

  if (!hasSupabaseAdminEnv()) {
    return { ok: false, message: "Supabase service role key is required for leave approvals." };
  }

  const { userId, profile } = await getAuthenticatedProfile();

  if (!userId || !profile) {
    return { ok: false, message: "Sign in with an approval role to review leave." };
  }

  const admin = createSupabaseAdminClient();
  const { data: request, error: requestError } = await admin
    .from("leave_requests")
    .select("id, student_id, hostel_id, status")
    .eq("id", parsed.data.requestId)
    .maybeSingle();

  if (requestError) {
    return { ok: false, message: requestError.message };
  }

  if (!request) {
    return { ok: false, message: "Leave request was not found." };
  }

  const reviewPlan = buildReviewPlan(request as LeaveRequestRow, profile, parsed.data.decision);

  if (!reviewPlan) {
    return { ok: false, message: "This leave request is not waiting for your approval." };
  }

  const now = new Date().toISOString();
  const updatePayload = {
    status: reviewPlan.nextStatus,
    [reviewPlan.reviewedByColumn]: userId,
    [reviewPlan.reviewedAtColumn]: now,
    [reviewPlan.noteColumn]: parsed.data.note?.trim() || null,
  };

  const { data: updatedRequest, error: updateError } = await admin
    .from("leave_requests")
    .update(updatePayload)
    .eq("id", parsed.data.requestId)
    .eq("status", (request as LeaveRequestRow).status)
    .select("id")
    .maybeSingle();

  if (updateError) {
    return { ok: false, message: updateError.message };
  }

  if (!updatedRequest) {
    return { ok: false, message: "Leave request status changed. Refresh and try again." };
  }

  await admin.from("audit_logs").insert({
    actor_id: userId,
    table_name: "leave_requests",
    action: reviewPlan.auditAction,
    row_id: parsed.data.requestId,
    old_data: { status: (request as LeaveRequestRow).status },
    new_data: { status: reviewPlan.nextStatus },
  });

  revalidatePath("/leave");

  return {
    ok: true,
    message: actionMessage(reviewPlan.nextStatus),
  };
}
