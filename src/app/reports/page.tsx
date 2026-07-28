import { redirect } from "next/navigation";

import { DepartmentBarChart, HostelBarChart } from "@/components/app/attendance-chart";
import { DashboardShell } from "@/components/app/dashboard-shell";
import { ReportExportPanel } from "@/components/app/report-export-panel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DEPARTMENTS, ROLE_CONFIG, YEARS, type RoleSlug } from "@/lib/constants";
import { getOfficeDashboardData } from "@/lib/live-data";
import type { DepartmentAnalytics, HostelAnalytics, HostelName, ReportRow } from "@/lib/types";
import { percent } from "@/lib/utils";

export const dynamic = "force-dynamic";

function isWardenRole(role: RoleSlug) {
  return role.endsWith("warden");
}

function isAttended(status: ReportRow["status"]) {
  return status === "Present" || status === "Late";
}

function buildDepartmentSnapshot(rows: ReportRow[]): DepartmentAnalytics[] {
  return DEPARTMENTS.map((department) => {
    const departmentRows = rows.filter((row) => row.department === department);
    const presentToday = departmentRows.filter((row) => isAttended(row.status)).length;

    return {
      department,
      students: departmentRows.length,
      attendanceRate: percent(presentToday, departmentRows.length),
    };
  }).filter((item) => item.students > 0);
}

function buildYearSnapshot(rows: ReportRow[]) {
  return YEARS.map((year) => {
    const yearRows = rows.filter((row) => row.year === year);
    const presentToday = yearRows.filter((row) => isAttended(row.status)).length;

    return {
      year,
      totalStudents: yearRows.length,
      presentToday,
      absentToday: Math.max(0, yearRows.length - presentToday),
      attendanceRate: percent(presentToday, yearRows.length),
    };
  }).filter((item) => item.totalStudents > 0);
}

function scopeReportsForRole(
  role: RoleSlug,
  reportRows: ReportRow[],
  hostelAnalytics: HostelAnalytics[],
) {
  const assignedHostel = isWardenRole(role) ? ROLE_CONFIG[role].hostel : undefined;

  if (!assignedHostel) {
    return {
      assignedHostel: null,
      reportRows,
      hostelAnalytics,
      departmentAnalytics: null,
    };
  }

  const scopedRows = reportRows.filter((row) => row.hostel === assignedHostel);

  return {
    assignedHostel,
    reportRows: scopedRows,
    hostelAnalytics: hostelAnalytics.filter((item) => item.hostel === assignedHostel),
    departmentAnalytics: buildDepartmentSnapshot(scopedRows),
  };
}

export default async function ReportsPage() {
  const data = await getOfficeDashboardData();
  const role = data.profile?.role ?? "ao";

  if (role === "student") {
    redirect("/student");
  }

  const scopedReports = scopeReportsForRole(role, data.reportRows, data.hostelAnalytics);
  const assignedHostel = scopedReports.assignedHostel as HostelName | null;
  const reportRows = scopedReports.reportRows;
  const hostelAnalytics = scopedReports.hostelAnalytics;
  const departmentAnalytics = scopedReports.departmentAnalytics ?? data.departmentAnalytics;

  return (
    <DashboardShell
      role={role}
      title="Reports"
      description={
        assignedHostel
          ? `Generate attendance reports for ${assignedHostel} with CSV, Excel, and PDF exports.`
          : "Generate daily, weekly, monthly, yearly, department, hostel, and student reports with CSV, Excel, and PDF exports."
      }
    >
      <div className="space-y-5">
        <YearWiseStudentSnapshot rows={reportRows} />
        <ReportExportPanel
          rows={reportRows}
          allowAllHostels={!assignedHostel}
          hostelOptions={assignedHostel ? [assignedHostel] : undefined}
        />
        <div className="grid gap-5 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{assignedHostel ? `${assignedHostel} Snapshot` : "Hostel Report Snapshot"}</CardTitle>
              <CardDescription>
                {assignedHostel
                  ? "Present and absent breakdown for the assigned hostel."
                  : "Present and absent breakdown by hostel."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HostelBarChart data={hostelAnalytics} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Department Report Snapshot</CardTitle>
              <CardDescription>
                {assignedHostel
                  ? `Attendance rate by department inside ${assignedHostel}.`
                  : "Attendance rate by department."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DepartmentBarChart data={departmentAnalytics} />
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}

function YearWiseStudentSnapshot({ rows }: { rows: ReportRow[] }) {
  const groups = buildYearSnapshot(rows);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Year Wise Student Details</CardTitle>
        <CardDescription>Total, present, and absent students grouped by academic year.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Year</TableHead>
              <TableHead>Total Students</TableHead>
              <TableHead>Present Today</TableHead>
              <TableHead>Absent Today</TableHead>
              <TableHead className="text-right">Attendance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map((group) => (
              <TableRow key={group.year}>
                <TableCell className="font-medium">{group.year} Year</TableCell>
                <TableCell>{group.totalStudents}</TableCell>
                <TableCell>{group.presentToday}</TableCell>
                <TableCell>{group.absentToday}</TableCell>
                <TableCell className="text-right">{group.attendanceRate}%</TableCell>
              </TableRow>
            ))}
            {!groups.length ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-slate-500">
                  No students found for this report scope.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
