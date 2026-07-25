"use server";

import { redirect } from "next/navigation";

import { ROLE_CONFIG, type RoleSlug } from "@/lib/constants";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
  hasSupabaseAdminEnv,
  hasSupabaseEnv,
} from "@/lib/supabase/server";
import type { ActionState } from "@/lib/types";
import { formatBirthDatePassword } from "@/lib/utils";
import {
  forgotPasswordSchema,
  loginSchema,
  passwordChangeSchema,
  studentRegistrationSchema,
} from "@/lib/validations";

const successState = (message: string): ActionState => ({ ok: true, message });
const errorState = (message: string): ActionState => ({ ok: false, message });

function actionErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function isRoleSlug(value: string | undefined): value is RoleSlug {
  return Boolean(value && Object.prototype.hasOwnProperty.call(ROLE_CONFIG, value));
}

function roleRoute(role: string | null | undefined) {
  const slug = (role || "student") as RoleSlug;
  return ROLE_CONFIG[slug]?.route ?? "/student";
}

export async function loginAction(_prevState: ActionState, formData: FormData) {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return errorState(parsed.error.issues[0]?.message ?? "Invalid login details.");
  }

  if (!hasSupabaseEnv()) {
    return errorState("Supabase environment variables are required for login.");
  }

  if (parsed.data.role && !isRoleSlug(parsed.data.role)) {
    return errorState("Select a valid role.");
  }

  let destination = "/student";

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error) {
      return errorState(error.message);
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      await supabase.auth.signOut();
      return errorState(userError?.message ?? "Login succeeded, but no auth user was returned.");
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      await supabase.auth.signOut();
      return errorState(profileError.message);
    }

    if (!isRoleSlug(profile?.role)) {
      await supabase.auth.signOut();
      return errorState("Login succeeded, but this account has no valid role in public.profiles.");
    }

    if (parsed.data.role && parsed.data.role !== profile.role) {
      await supabase.auth.signOut();
      return errorState("Selected role does not match this account.");
    }

    destination = roleRoute(profile.role);
  } catch (error) {
    return errorState(
      actionErrorMessage(error, "Unable to sign in. Check Supabase configuration and try again."),
    );
  }

  redirect(destination);
}

export async function registerStudentAction(_prevState: ActionState, formData: FormData) {
  const parsed = studentRegistrationSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return errorState(parsed.error.issues[0]?.message ?? "Invalid student details.");
  }

  if (!hasSupabaseEnv()) {
    return errorState("Supabase environment variables are required to register students.");
  }

  if (!hasSupabaseAdminEnv()) {
    return errorState("SUPABASE_SERVICE_ROLE_KEY is required to create student login accounts.");
  }

  const admin = createSupabaseAdminClient();
  const defaultPassword = formatBirthDatePassword(parsed.data.dateOfBirth);
  const { data: hostel, error: hostelError } = await admin
    .from("hostels")
    .select("id")
    .eq("name", parsed.data.hostel)
    .single();

  if (hostelError || !hostel) {
    return errorState(hostelError?.message ?? "Selected hostel was not found.");
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: defaultPassword,
    email_confirm: true,
    user_metadata: {
      full_name: parsed.data.fullName,
      role: "student",
      force_password_change: true,
    },
  });

  if (error || !data.user) {
    return errorState(error?.message ?? "Unable to create student account.");
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: data.user.id,
    full_name: parsed.data.fullName,
    email: parsed.data.email,
    role: "student",
    hostel_id: hostel.id,
    force_password_change: true,
  });

  if (profileError) {
    return errorState(profileError.message);
  }

  const { error: studentError } = await admin.from("students").insert({
    profile_id: data.user.id,
    full_name: parsed.data.fullName,
    email: parsed.data.email,
    date_of_birth: parsed.data.dateOfBirth,
    academic_year: parsed.data.year,
    department: parsed.data.department,
    hostel_id: hostel.id,
    hostel_name: parsed.data.hostel,
    room_number: parsed.data.roomNumber,
    sharing: parsed.data.sharing,
    blood_group: parsed.data.bloodGroup,
    student_phone: parsed.data.studentPhone,
    parent_phone: parsed.data.parentPhone,
  });

  if (studentError) {
    return errorState(studentError.message);
  }

  return successState("Student account created. Default password is date of birth in DD-MM-YYYY format.");
}

export async function forgotPasswordAction(_prevState: ActionState, formData: FormData) {
  const parsed = forgotPasswordSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return errorState(parsed.error.issues[0]?.message ?? "Enter a valid email address.");
  }

  if (!hasSupabaseEnv()) {
    return successState("Password reset flow validated. Configure Supabase SMTP to send emails.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/settings`,
  });

  if (error) {
    return errorState(error.message);
  }

  return successState("Password reset instructions sent.");
}

export async function changePasswordAction(_prevState: ActionState, formData: FormData) {
  const parsed = passwordChangeSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return errorState(parsed.error.issues[0]?.message ?? "Invalid password details.");
  }

  if (!hasSupabaseEnv()) {
    return successState("Password policy validated. Configure Supabase to update passwords.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.newPassword,
  });

  if (error) {
    return errorState(error.message);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await supabase
      .from("profiles")
      .update({ force_password_change: false })
      .eq("id", user.id);
  }

  return successState("Password changed successfully.");
}

export async function getCurrentProfile() {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, force_password_change")
    .eq("id", user.id)
    .single();

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    fullName: data.full_name,
    email: data.email,
    role: data.role as RoleSlug,
    forcePasswordChange: data.force_password_change,
    avatarInitials: data.full_name
      .split(" ")
      .slice(0, 2)
      .map((part: string) => part[0])
      .join("")
      .toUpperCase(),
  };
}
