import { DashboardShell } from "@/components/app/dashboard-shell";
import { DirectorDashboard } from "@/components/app/role-dashboard";
import { getOfficeDashboardData } from "@/lib/live-data";

export const dynamic = "force-dynamic";

export default async function DirectorPage() {
  const data = await getOfficeDashboardData();

  return (
    <DashboardShell
      role={data.profile?.role ?? "director"}
      title="Director Dashboard"
      description="Complete analytics, realtime monitoring, attendance heatmaps, trend analysis, notifications, and exportable reports."
    >
      <DirectorDashboard data={data} />
    </DashboardShell>
  );
}
