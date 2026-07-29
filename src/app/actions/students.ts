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
import { formatBirthDatePassword } from "@/lib/utils";
import {
  studentDeleteSchema,
  studentDetailsUpdateSchema,
  wardenStudentCreateSchema,
} from "@/lib/validations";

type ProfileRow = {
  id: string;
  role: RoleSlug;
  hostel_id?: string | null;
};

type StudentRow = {
  id: string;
  hostel_id: string;
  profile_id: string;
  admission_no?: string | null;
  full_name: string;
  email: string;
};

function firstIssueMessage(error: { issues: { message: string }[] }) {
  return error.issues[0]?.message ?? "Please check the submitted details.";
}

function actionErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function normalizeOptionalText(value: string | undefined) {
  return value?.trim() || null;
}

function revalidateStudentViews() {
  revalidatePath("/warden");
  revalidatePath("/reports");
  revalidatePath("/ao");
  revalidatePath("/director");
}

async function getWardenContext(action: string) {
  if (!hasSupabaseEnv()) {
    return { ok: false, message: `Supabase environment variables are required to ${action}.` } as const;
  }

  if (!hasSupabaseAdminEnv()) {
    return { ok: false, message: `Supabase service role key is required to ${action}.` } as const;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: `Sign in as a warden to ${action}.` } as const;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, hostel_id")
    .eq("id", user.id)
    .maybeSingle();

  const wardenProfile = profile as ProfileRow | null;

  if (!wardenProfile || !WARDEN_ROLES.includes(wardenProfile.role)) {
    return { ok: false, message: `Only wardens can ${action}.` } as const;
  }

  if (!wardenProfile.hostel_id) {
    return { ok: false, message: "Warden hostel assignment is missing." } as const;
  }

  return {
    ok: true,
    admin: createSupabaseAdminClient(),
    hostelId: wardenProfile.hostel_id,
    profile: wardenProfile,
    userId: user.id,
  } as const;
}

async function getStudentForWarden(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  studentId: string,
  hostelId: string,
) {
  const { data: student, error } = await admin
    .from("students")
    .select("id, hostel_id, profile_id, admission_no, full_name, email")
    .eq("id", studentId)
    .eq("active", true)
    .maybeSingle();

  if (error) {
    return { ok: false, message: error.message } as const;
  }

  const existingStudent = student as StudentRow | null;

  if (!existingStudent) {
    return { ok: false, message: "Student was not found." } as const;
  }

  if (existingStudent.hostel_id !== hostelId) {
    return { ok: false, message: "This student is not assigned to your hostel." } as const;
  }

  return { ok: true, student: existingStudent } as const;
}

export async function createStudentByWardenAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    return await createStudentByWarden(formData);
  } catch (error) {
    return { ok: false, message: actionErrorMessage(error, "Unable to add student.") };
  }
}

async function createStudentByWarden(formData: FormData): Promise<ActionState> {
  const parsed = wardenStudentCreateSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { ok: false, message: firstIssueMessage(parsed.error) };
  }

  const context = await getWardenContext("add students");

  if (!context.ok) {
    return { ok: false, message: context.message };
  }

  const { data: hostel, error: hostelError } = await context.admin
    .from("hostels")
    .select("id, name")
    .eq("id", context.hostelId)
    .single();

  if (hostelError || !hostel) {
    return { ok: false, message: hostelError?.message ?? "Warden hostel was not found." };
  }

  const defaultPassword = formatBirthDatePassword(parsed.data.dateOfBirth);
  const { data: authData, error: authError } = await context.admin.auth.admin.createUser({
    email: parsed.data.email,
    password: defaultPassword,
    email_confirm: true,
    user_metadata: {
      full_name: parsed.data.fullName,
      role: "student",
      force_password_change: true,
    },
  });

  if (authError || !authData.user) {
    return { ok: false, message: authError?.message ?? "Unable to create student account." };
  }

  const cleanupCreatedUser = async () => {
    await context.admin.auth.admin.deleteUser(authData.user.id);
  };

  const { error: profileError } = await context.admin.from("profiles").insert({
    id: authData.user.id,
    full_name: parsed.data.fullName,
    email: parsed.data.email,
    role: "student",
    hostel_id: context.hostelId,
    force_password_change: true,
  });

  if (profileError) {
    await cleanupCreatedUser();
    return { ok: false, message: profileError.message };
  }

  const { data: student, error: studentError } = await context.admin
    .from("students")
    .insert({
      profile_id: authData.user.id,
      admission_no: normalizeOptionalText(parsed.data.admissionNo),
      full_name: parsed.data.fullName,
      email: parsed.data.email,
      date_of_birth: parsed.data.dateOfBirth,
      academic_year: parsed.data.year,
      department: parsed.data.department,
      hostel_id: context.hostelId,
      hostel_name: hostel.name,
      room_number: parsed.data.roomNumber,
      sharing: parsed.data.sharing,
      blood_group: parsed.data.bloodGroup,
      student_phone: parsed.data.studentPhone,
      parent_phone: parsed.data.parentPhone,
    })
    .select("id")
    .single();

  if (studentError || !student) {
    await cleanupCreatedUser();
    return { ok: false, message: studentError?.message ?? "Unable to create student record." };
  }

  await context.admin.from("audit_logs").insert({
    actor_id: context.userId,
    table_name: "students",
    action: "student_created_by_warden",
    row_id: student.id,
    new_data: {
      admission_no: normalizeOptionalText(parsed.data.admissionNo),
      full_name: parsed.data.fullName,
      email: parsed.data.email,
      academic_year: parsed.data.year,
      department: parsed.data.department,
      hostel_id: context.hostelId,
      hostel_name: hostel.name,
      room_number: parsed.data.roomNumber,
      sharing: parsed.data.sharing,
      blood_group: parsed.data.bloodGroup,
    },
  });

  revalidateStudentViews();

  return {
    ok: true,
    message: "Student added. Default password is date of birth in DD-MM-YYYY format.",
  };
}

export async function updateStudentDetailsAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    return await updateStudentDetails(formData);
  } catch (error) {
    return { ok: false, message: actionErrorMessage(error, "Unable to update student details.") };
  }
}

async function updateStudentDetails(formData: FormData): Promise<ActionState> {
  const parsed = studentDetailsUpdateSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { ok: false, message: firstIssueMessage(parsed.error) };
  }

  const context = await getWardenContext("edit student details");

  if (!context.ok) {
    return { ok: false, message: context.message };
  }

  const existing = await getStudentForWarden(
    context.admin,
    parsed.data.studentId,
    context.hostelId,
  );

  if (!existing.ok) {
    return { ok: false, message: existing.message };
  }

  const { error: updateError } = await context.admin
    .from("students")
    .update({
      admission_no: normalizeOptionalText(parsed.data.admissionNo),
      full_name: parsed.data.fullName,
      email: parsed.data.email,
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
    .eq("hostel_id", context.hostelId);

  if (updateError) {
    return { ok: false, message: updateError.message };
  }

  const { error: profileError } = await context.admin
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      email: parsed.data.email,
      hostel_id: context.hostelId,
    })
    .eq("id", existing.student.profile_id);

  if (profileError) {
    return { ok: false, message: profileError.message };
  }

  const { error: authError } = await context.admin.auth.admin.updateUserById(
    existing.student.profile_id,
    {
      email: parsed.data.email,
      email_confirm: true,
      user_metadata: {
        full_name: parsed.data.fullName,
        role: "student",
      },
    },
  );

  if (authError) {
    return { ok: false, message: authError.message };
  }

  await context.admin.from("audit_logs").insert({
    actor_id: context.userId,
    table_name: "students",
    action: "student_details_updated_by_warden",
    row_id: parsed.data.studentId,
    old_data: {
      admission_no: existing.student.admission_no,
      full_name: existing.student.full_name,
      email: existing.student.email,
    },
    new_data: {
      admission_no: normalizeOptionalText(parsed.data.admissionNo),
      full_name: parsed.data.fullName,
      email: parsed.data.email,
      academic_year: parsed.data.year,
      department: parsed.data.department,
      room_number: parsed.data.roomNumber,
      sharing: parsed.data.sharing,
      blood_group: parsed.data.bloodGroup,
    },
  });

  revalidateStudentViews();

  return { ok: true, message: "Student details updated." };
}

export async function deleteStudentByWardenAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    return await deleteStudentByWarden(formData);
  } catch (error) {
    return { ok: false, message: actionErrorMessage(error, "Unable to delete student.") };
  }
}

async function deleteStudentByWarden(formData: FormData): Promise<ActionState> {
  const parsed = studentDeleteSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { ok: false, message: firstIssueMessage(parsed.error) };
  }

  const context = await getWardenContext("delete students");

  if (!context.ok) {
    return { ok: false, message: context.message };
  }

  const existing = await getStudentForWarden(
    context.admin,
    parsed.data.studentId,
    context.hostelId,
  );

  if (!existing.ok) {
    return { ok: false, message: existing.message };
  }

  const { error: logDeleteError } = await context.admin
    .from("attendance_logs")
    .delete()
    .eq("student_id", existing.student.id);

  if (logDeleteError) {
    return { ok: false, message: logDeleteError.message };
  }

  await context.admin.from("audit_logs").insert({
    actor_id: context.userId,
    table_name: "students",
    action: "student_deleted_by_warden",
    row_id: existing.student.id,
    old_data: {
      admission_no: existing.student.admission_no,
      full_name: existing.student.full_name,
      email: existing.student.email,
      hostel_id: existing.student.hostel_id,
      profile_id: existing.student.profile_id,
    },
  });

  const { error: deleteError } = await context.admin.auth.admin.deleteUser(
    existing.student.profile_id,
  );

  if (deleteError) {
    return { ok: false, message: deleteError.message };
  }

  revalidateStudentViews();

  return { ok: true, message: "Student deleted from Supabase." };
}
