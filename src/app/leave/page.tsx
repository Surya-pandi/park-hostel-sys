import { DashboardShell } from "@/components/app/dashboard-shell";
import { LeaveRequestPanel } from "@/components/app/leave-request-panel";
import { getLeavePageData } from "@/lib/leave-data";

export const dynamic = "force-dynamic";

export default async function LeavePage() {
  const data = await getLeavePageData();

  return (
    <DashboardShell
      role={data.profile?.role ?? "student"}
      title="Leave Permission"
      description="Student leave requests with warden, AO, and director approval status."
    >
      <LeaveRequestPanel data={data} />
    </DashboardShell>
  );
}
