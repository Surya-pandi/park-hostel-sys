import { DashboardShell } from "@/components/app/dashboard-shell";
import { WardenStudentsDashboard } from "@/components/app/role-dashboard";
import { getWardenDashboardData } from "@/lib/live-data";
import {
  getResolvedWardenRole,
  getWardenHostelFromSearchParams,
} from "@/lib/warden-context";

export const dynamic = "force-dynamic";

export default async function WardenStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ hostel?: string }>;
}) {
  const params = await searchParams;
  const hostel = getWardenHostelFromSearchParams(params);
  const data = await getWardenDashboardData(hostel);
  const role = getResolvedWardenRole(data.profile?.role, data.hostel);

  return (
    <DashboardShell
      role={role}
      title={`${data.hostel} Students`}
      description="Manage assigned hostel students, room occupancy, and daily manual attendance actions."
    >
      <WardenStudentsDashboard data={data} />
    </DashboardShell>
  );
}
