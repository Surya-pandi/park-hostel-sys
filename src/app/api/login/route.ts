import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { ROLE_CONFIG, type RoleSlug } from "@/lib/constants";
import { loginSchema } from "@/lib/validations";

type LoginResponse = {
  ok: boolean;
  message: string;
  redirectTo?: string;
};

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<ReturnType<typeof NextResponse.next>["cookies"]["set"]>[2];
};

function jsonResponse(body: LoginResponse, cookiesToSet: CookieToSet[] = [], status = 200) {
  const response = NextResponse.json(body, { status });

  cookiesToSet.forEach((cookie) => {
    response.cookies.set(cookie.name, cookie.value, cookie.options);
  });

  return response;
}

function errorResponse(message: string, status = 400) {
  return jsonResponse({ ok: false, message }, [], status);
}

function isRoleSlug(value: string | undefined): value is RoleSlug {
  return Boolean(value && Object.prototype.hasOwnProperty.call(ROLE_CONFIG, value));
}

function roleRoute(role: RoleSlug) {
  return ROLE_CONFIG[role]?.route ?? "/student";
}

function actionErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export async function POST(request: NextRequest) {
  const parsed = loginSchema.safeParse(await request.json().catch(() => ({})));

  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0]?.message ?? "Invalid login details.");
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return errorResponse("Supabase environment variables are required for login.", 500);
  }

  if (parsed.data.role && !isRoleSlug(parsed.data.role)) {
    return errorResponse("Select a valid role.");
  }

  const cookiesToSet: CookieToSet[] = [];
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(nextCookies) {
          cookiesToSet.push(...nextCookies);
        },
      },
    },
  );

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error) {
      return jsonResponse({ ok: false, message: error.message }, cookiesToSet);
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      await supabase.auth.signOut();
      return jsonResponse(
        { ok: false, message: userError?.message ?? "Login succeeded, but no auth user was returned." },
        cookiesToSet,
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      await supabase.auth.signOut();
      return jsonResponse({ ok: false, message: profileError.message }, cookiesToSet);
    }

    if (!isRoleSlug(profile?.role)) {
      await supabase.auth.signOut();
      return jsonResponse(
        { ok: false, message: "Login succeeded, but this account has no valid role in public.profiles." },
        cookiesToSet,
      );
    }

    if (parsed.data.role && parsed.data.role !== profile.role) {
      await supabase.auth.signOut();
      return jsonResponse({ ok: false, message: "Selected role does not match this account." }, cookiesToSet);
    }

    return jsonResponse(
      {
        ok: true,
        message: "Signed in successfully.",
        redirectTo: roleRoute(profile.role),
      },
      cookiesToSet,
    );
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        message: actionErrorMessage(error, "Unable to sign in. Check Supabase configuration and try again."),
      },
      cookiesToSet,
      500,
    );
  }
}
