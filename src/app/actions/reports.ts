"use server";

import { ROLE_CONFIG } from "@/lib/constants";
import { getCurrentProfileData, getReportRows } from "@/lib/live-data";
import { hasSupabaseEnv } from "@/lib/supabase/server";
import { reportRequestSchema } from "@/lib/validations";

export async function createReportAction(formData: FormData) {
  const parsed = reportRequestSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Invalid report filters.",
      rows: [],
    };
  }

  if (!hasSupabaseEnv()) {
    return {
      ok: false,
      message: "Supabase environment variables are required to prepare reports.",
      rows: [],
    };
  }

  const profile = await getCurrentProfileData();
  const assignedHostel = profile?.role.endsWith("warden")
    ? ROLE_CONFIG[profile.role].hostel
    : undefined;
  const reportRows = await getReportRows();
  const rows = reportRows.filter((row) => {
    const hostelMatch = assignedHostel
      ? row.hostel === assignedHostel
      : parsed.data.hostel === "All Hostels" || row.hostel === parsed.data.hostel;
    const departmentMatch =
      parsed.data.department === "All Departments" || row.department === parsed.data.department;
    return hostelMatch && departmentMatch;
  });

  return {
    ok: true,
    message: `${parsed.data.type} report prepared for ${rows.length} students.`,
    rows,
    filters: parsed.data,
  };
}
