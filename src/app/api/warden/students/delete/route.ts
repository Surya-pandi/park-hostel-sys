import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

import { WARDEN_ROLES, type RoleSlug } from "@/lib/constants";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
  hasSupabaseAdminEnv,
  hasSupabaseEnv,
} from "@/lib/supabase/server";
import { studentDeleteSchema } from "@/lib/validations";

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

type DeleteResponse = {
  ok: boolean;
  message: string;
};

function jsonResponse(body: DeleteResponse, status = 200) {
  return NextResponse.json(body, { status });
}

function actionErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function revalidateStudentViews() {
  revalidatePath("/warden");
  revalidatePath("/reports");
  revalidatePath("/ao");
  revalidatePath("/director");
}

export async function POST(request: NextRequest) {
  try {
    const parsed = studentDeleteSchema.safeParse(await request.json().catch(() => ({})));

    if (!parsed.success) {
      return jsonResponse(
        { ok: false, message: parsed.error.issues[0]?.message ?? "Student is invalid." },
        400,
      );
    }

    if (!hasSupabaseEnv()) {
      return jsonResponse(
        { ok: false, message: "Supabase environment variables are required to delete students." },
        500,
      );
    }

    if (!hasSupabaseAdminEnv()) {
      return jsonResponse(
        { ok: false, message: "Supabase service role key is required to delete students." },
        500,
      );
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return jsonResponse({ ok: false, message: "Sign in as a warden to delete students." }, 401);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role, hostel_id")
      .eq("id", user.id)
      .maybeSingle();

    const wardenProfile = profile as ProfileRow | null;

    if (!wardenProfile || !WARDEN_ROLES.includes(wardenProfile.role)) {
      return jsonResponse({ ok: false, message: "Only wardens can delete students." }, 403);
    }

    if (!wardenProfile.hostel_id) {
      return jsonResponse({ ok: false, message: "Warden hostel assignment is missing." }, 400);
    }

    const admin = createSupabaseAdminClient();
    const { data: student, error: studentError } = await admin
      .from("students")
      .select("id, hostel_id, profile_id, admission_no, full_name, email")
      .eq("id", parsed.data.studentId)
      .eq("active", true)
      .maybeSingle();

    if (studentError) {
      return jsonResponse({ ok: false, message: studentError.message }, 500);
    }

    const existingStudent = student as StudentRow | null;

    if (!existingStudent) {
      return jsonResponse({ ok: false, message: "Student was not found." }, 404);
    }

    if (existingStudent.hostel_id !== wardenProfile.hostel_id) {
      return jsonResponse(
        { ok: false, message: "This student is not assigned to your hostel." },
        403,
      );
    }

    const { error: logDeleteError } = await admin
      .from("attendance_logs")
      .delete()
      .eq("student_id", existingStudent.id);

    if (logDeleteError) {
      return jsonResponse({ ok: false, message: logDeleteError.message }, 500);
    }

    await admin.from("audit_logs").insert({
      actor_id: user.id,
      table_name: "students",
      action: "student_deleted_by_warden",
      row_id: existingStudent.id,
      old_data: {
        admission_no: existingStudent.admission_no,
        full_name: existingStudent.full_name,
        email: existingStudent.email,
        hostel_id: existingStudent.hostel_id,
        profile_id: existingStudent.profile_id,
      },
    });

    const { error: deleteError } = await admin.auth.admin.deleteUser(existingStudent.profile_id);

    if (deleteError) {
      return jsonResponse({ ok: false, message: deleteError.message }, 500);
    }

    revalidateStudentViews();

    return jsonResponse({ ok: true, message: "Student deleted from Supabase." });
  } catch (error) {
    return jsonResponse(
      { ok: false, message: actionErrorMessage(error, "Unable to delete student.") },
      500,
    );
  }
}
