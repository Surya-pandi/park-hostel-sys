import { AttendanceCalendar } from "@/components/app/attendance-calendar";
import { AttendanceChart } from "@/components/app/attendance-chart";
import { DashboardShell } from "@/components/app/dashboard-shell";
import { QrGenerator } from "@/components/app/qr-generator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getStudentDashboardData } from "@/lib/live-data";

export const dynamic = "force-dynamic";

export default async function AttendancePage() {
  const data = await getStudentDashboardData();

  return (
    <DashboardShell
      role={data.profile?.role ?? "student"}
      title="Attendance"
      description="Generate secure QR attendance, inspect history, and track daily attendance status."
    >
      <div className="space-y-5">
        <QrGenerator />
        <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Trend</CardTitle>
              <CardDescription>Present, late, and absent trend for recent days.</CardDescription>
            </CardHeader>
            <CardContent>
              <AttendanceChart data={data.attendanceSeries} />
            </CardContent>
          </Card>
          <AttendanceCalendar days={data.calendarDays} />
        </div>
      </div>
    </DashboardShell>
  );
}
