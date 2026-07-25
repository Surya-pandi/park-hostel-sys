import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export function hasSupabaseEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function hasSupabaseAdminEnv() {
  return Boolean(hasSupabaseEnv() && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export async function createSupabaseServerClient() {
  if (!hasSupabaseEnv()) {
    throw new Error("Supabase environment variables are not configured.");
  }

  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components cannot set cookies; middleware and actions can.
          }
        },
      },
    },
  );
}

export function createSupabaseAdminClient() {
  if (!hasSupabaseAdminEnv()) {
    throw new Error("Supabase service role environment variable is not configured.");
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
