import { DashboardShell } from "@/components/app/dashboard-shell";
import { StudentDashboard } from "@/components/app/role-dashboard";
import { getStudentDashboardData } from "@/lib/live-data";

export const dynamic = "force-dynamic";

export default async function StudentPage() {
  const data = await getStudentDashboardData();

  return (
    <DashboardShell
      role={data.profile?.role ?? "student"}
      title="Student Dashboard"
      description="View attendance percentage, today's status, QR generation, history, calendar, profile, notifications, and password settings."
    >
      <StudentDashboard data={data} />
    </DashboardShell>
  );
}
