import { DashboardShell } from "@/components/app/dashboard-shell";
import { AoDashboard } from "@/components/app/role-dashboard";
import { getOfficeDashboardData } from "@/lib/live-data";

export const dynamic = "force-dynamic";

export default async function AoPage() {
  const data = await getOfficeDashboardData();

  return (
    <DashboardShell
      role={data.profile?.role ?? "ao"}
      title="AO Dashboard"
      description="Overall attendance, hostel analytics, department analytics, realtime dashboard indicators, charts, and official reports."
    >
      <AoDashboard data={data} />
    </DashboardShell>
  );
}
