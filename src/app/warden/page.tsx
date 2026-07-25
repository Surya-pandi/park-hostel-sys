import { DashboardShell } from "@/components/app/dashboard-shell";
import { WardenDashboard } from "@/components/app/role-dashboard";
import { HOSTELS, ROLE_CONFIG, type RoleSlug } from "@/lib/constants";
import { getWardenDashboardData } from "@/lib/live-data";
import { HostelName } from "@/lib/types";

export const dynamic = "force-dynamic";

const hostelMap: Record<string, HostelName> = {
  "mkg-boys": "MKG Boys Hostel",
  "mkg-girls": "MKG Girls Hostel",
  "nri-boys": "NRI Boys Hostel",
  "nri-girls": "NRI Girls Hostel",
};

const roleByHostel: Record<HostelName, RoleSlug> = Object.fromEntries(
  Object.values(ROLE_CONFIG)
    .filter((role) => role.hostel)
    .map((role) => [role.hostel, role.slug]),
) as Record<HostelName, RoleSlug>;

export default async function WardenPage({
  searchParams,
}: {
  searchParams: Promise<{ hostel?: string }>;
}) {
  const params = await searchParams;
  const hostel = hostelMap[params.hostel ?? "mkg-boys"] ?? HOSTELS[0];
  const data = await getWardenDashboardData(hostel);
  const role = data.profile?.role.endsWith("warden")
    ? data.profile.role
    : roleByHostel[data.hostel] ?? "mkg-boys-warden";

  return (
    <DashboardShell
      role={role}
      title={`${data.hostel} Warden Dashboard`}
      description="Scan student QR codes, monitor today's attendance, inspect room statistics, search hostel students, and export attendance reports."
    >
      <WardenDashboard data={data} />
    </DashboardShell>
  );
}
