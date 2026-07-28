"use server";

import { revalidatePath } from "next/cache";

import { WARDEN_ROLES, type RoleSlug } from "@/lib/constants";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
  hasSupabaseAdminEnv,
  hasSupabaseEnv,
} from "@/lib/supabase/server";
import type { ActionState } from "@/lib/types";
import { studentDetailsUpdateSchema } from "@/lib/validations";

type ProfileRow = {
  id: string;
  role: RoleSlug;
  hostel_id?: string | null;
};

type StudentRow = {
  id: string;
  hostel_id: string;
};

function firstIssueMessage(error: { issues: { message: string }[] }) {
  return error.issues[0]?.message ?? "Please check the submitted details.";
}

export async function updateStudentDetailsAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = studentDetailsUpdateSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { ok: false, message: firstIssueMessage(parsed.error) };
  }

  if (!hasSupabaseEnv()) {
    return { ok: false, message: "Supabase environment variables are required to edit students." };
  }

  if (!hasSupabaseAdminEnv()) {
    return { ok: false, message: "Supabase service role key is required to edit students." };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Sign in as a warden to edit student details." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, hostel_id")
    .eq("id", user.id)
    .maybeSingle();

  const wardenProfile = profile as ProfileRow | null;

  if (!wardenProfile || !WARDEN_ROLES.includes(wardenProfile.role)) {
    return { ok: false, message: "Only wardens can edit student details." };
  }

  if (!wardenProfile.hostel_id) {
    return { ok: false, message: "Warden hostel assignment is missing." };
  }

  const admin = createSupabaseAdminClient();
  const { data: student, error: studentError } = await admin
    .from("students")
    .select("id, hostel_id")
    .eq("id", parsed.data.studentId)
    .eq("active", true)
    .maybeSingle();

  if (studentError) {
    return { ok: false, message: studentError.message };
  }

  const existingStudent = student as StudentRow | null;

  if (!existingStudent) {
    return { ok: false, message: "Student was not found." };
  }

  if (existingStudent.hostel_id !== wardenProfile.hostel_id) {
    return { ok: false, message: "This student is not assigned to your hostel." };
  }

  const { error: updateError } = await admin
    .from("students")
    .update({
      admission_no: parsed.data.admissionNo?.trim() || null,
      full_name: parsed.data.fullName,
      date_of_birth: parsed.data.dateOfBirth,
      academic_year: parsed.data.year,
      department: parsed.data.department,
      room_number: parsed.data.roomNumber,
      sharing: parsed.data.sharing,
      blood_group: parsed.data.bloodGroup,
      student_phone: parsed.data.studentPhone,
      parent_phone: parsed.data.parentPhone,
    })
    .eq("id", parsed.data.studentId)
    .eq("hostel_id", wardenProfile.hostel_id);

  if (updateError) {
    return { ok: false, message: updateError.message };
  }

  await admin.from("audit_logs").insert({
    actor_id: user.id,
    table_name: "students",
    action: "student_details_updated_by_warden",
    row_id: parsed.data.studentId,
    new_data: {
      admission_no: parsed.data.admissionNo?.trim() || null,
      full_name: parsed.data.fullName,
      academic_year: parsed.data.year,
      department: parsed.data.department,
      room_number: parsed.data.roomNumber,
      sharing: parsed.data.sharing,
      blood_group: parsed.data.bloodGroup,
    },
  });

  revalidatePath("/warden");
  revalidatePath("/reports");
  revalidatePath("/ao");
  revalidatePath("/director");

  return { ok: true, message: "Student details updated." };
}
