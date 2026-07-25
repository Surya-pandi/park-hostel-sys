import { redirect } from "next/navigation";

import { ScannerPanel } from "@/components/app/scanner-panel";
import { DashboardShell } from "@/components/app/dashboard-shell";
import { StatusBadge } from "@/components/app/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WARDEN_ROLES } from "@/lib/constants";
import { getCurrentProfileData, getRecentScans } from "@/lib/live-data";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ScannerPage() {
  const [profile, attendanceRecords] = await Promise.all([
    getCurrentProfileData(),
    getRecentScans(),
  ]);

  if (profile?.role && !WARDEN_ROLES.includes(profile.role)) {
    redirect(profile.role === "student" ? "/student" : "/reports");
  }

  return (
    <DashboardShell
      role={profile?.role ?? "mkg-boys-warden"}
      title="Scanner"
      description="Live QR verification station for wardens with manual fallback and scan history."
    >
      <div className="space-y-5">
        <ScannerPanel />
        <Card>
          <CardHeader>
            <CardTitle>Recent Scans</CardTitle>
            <CardDescription>Latest attendance verification events.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Hostel</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{formatDate(record.date)}</TableCell>
                    <TableCell className="font-medium">{record.studentName}</TableCell>
                    <TableCell>{record.hostel}</TableCell>
                    <TableCell>
                      <StatusBadge status={record.status} />
                    </TableCell>
                  </TableRow>
                ))}
                {!attendanceRecords.length ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-slate-500">
                      No attendance scans found.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
