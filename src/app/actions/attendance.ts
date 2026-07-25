"use server";

import { revalidatePath } from "next/cache";

import { ATTENDANCE_WINDOW } from "@/lib/constants";
import { createQrPayload, encodeQrPayload, parseQrPayload, verifyQrPayload } from "@/lib/qr";
import {
  createSupabaseServerClient,
  hasSupabaseEnv,
} from "@/lib/supabase/server";
import { qrScanSchema } from "@/lib/validations";

export type QrActionResult = {
  ok: boolean;
  message: string;
  studentName?: string;
  payload?: string;
  expiresAt?: string;
  windowOpen?: boolean;
};

export async function generateQrTokenAction(): Promise<QrActionResult> {
  if (!hasSupabaseEnv()) {
    return { ok: false, message: "Supabase environment variables are required to generate QR tokens." };
  }

  const tokenJwt = crypto.randomUUID();
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Sign in as a student to generate a QR." };
  }

  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  if (!student) {
    return { ok: false, message: "Student profile not found." };
  }

  const qrPayload = createQrPayload({
    studentId: student.id,
    jwt: tokenJwt,
  });

  const { error: tokenError } = await supabase.from("qr_tokens").insert({
    token_uuid: qrPayload.uuid,
    student_id: student.id,
    nonce: qrPayload.nonce,
    payload: qrPayload,
    expires_at: qrPayload.expiresAt,
  });

  if (tokenError) {
    return { ok: false, message: tokenError.message };
  }

  return {
    ok: true,
    message: `QR valid for ${ATTENDANCE_WINDOW.expirySeconds} seconds.`,
    payload: encodeQrPayload(qrPayload),
    expiresAt: qrPayload.expiresAt,
    windowOpen: true,
  };
}

export async function verifyQrAttendanceAction(rawPayload: string) {
  const parsed = qrScanSchema.safeParse({ payload: rawPayload });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid QR payload." };
  }

  let payload;

  try {
    payload = parseQrPayload(parsed.data.payload);
  } catch {
    return { ok: false, message: "QR payload could not be read." };
  }

  const verification = verifyQrPayload(payload);

  if (!verification.signatureValid) {
    return { ok: false, message: "QR signature failed server verification." };
  }

  if (!verification.notExpired) {
    return { ok: false, message: "QR token expired. Ask the student to regenerate it." };
  }

  if (!hasSupabaseEnv()) {
    return { ok: false, message: "Supabase environment variables are required to verify attendance." };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Only signed-in wardens can verify attendance." };
  }

  const { data: tokenRow } = await supabase
    .from("qr_tokens")
    .select("id, used_at, student_id, expires_at")
    .eq("token_uuid", payload.uuid)
    .single();

  if (!tokenRow) {
    return { ok: false, message: "QR token is not registered on the server." };
  }

  if (tokenRow.used_at) {
    return { ok: false, message: "QR token has already been used." };
  }

  if (tokenRow.student_id !== payload.studentId) {
    return { ok: false, message: "QR token does not match the scanned student." };
  }

  const { data: studentRow } = await supabase
    .from("students")
    .select("full_name")
    .eq("id", tokenRow.student_id)
    .single();
  const studentName = studentRow?.full_name ?? "Student";

  const { data: existing } = await supabase
    .from("attendance")
    .select("id")
    .eq("student_id", payload.studentId)
    .eq("attendance_date", new Date().toISOString().slice(0, 10))
    .maybeSingle();

  if (existing) {
    return { ok: false, message: `${studentName} has already presented today.`, studentName };
  }

  const { error: attendanceError } = await supabase.from("attendance").insert({
    student_id: payload.studentId,
    attendance_date: new Date().toISOString().slice(0, 10),
    check_in_time: new Date().toISOString(),
    status: "present",
    verified_by: user.id,
    qr_token_id: tokenRow.id,
  });

  if (attendanceError) {
    return { ok: false, message: attendanceError.message };
  }

  await supabase
    .from("qr_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("id", tokenRow.id);

  await supabase.from("attendance_logs").insert({
    actor_id: user.id,
    student_id: payload.studentId,
    action: "qr_scan_verified",
    metadata: { token_uuid: payload.uuid },
  });

  revalidatePath("/warden");
  revalidatePath("/scanner");
  revalidatePath("/reports");

  return { ok: true, message: `${studentName} has presented.`, studentName };
}
