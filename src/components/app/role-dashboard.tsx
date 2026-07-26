import { Fragment } from "react";
import {
  Activity,
  BedDouble,
  Bell,
  Building2,
  CalendarCheck2,
  Clock3,
  FileText,
  Flame,
  Gauge,
  ScanLine,
  TrendingUp,
  UsersRound,
} from "lucide-react";

import { AnimatedSection } from "@/components/app/animated-section";
import { AttendanceCalendar } from "@/components/app/attendance-calendar";
import {
  AttendanceChart,
  DepartmentBarChart,
  HostelBarChart,
} from "@/components/app/attendance-chart";
import { KpiCard } from "@/components/app/kpi-card";
import { ManualAttendanceButton } from "@/components/app/manual-attendance-button";
import { NotificationsList } from "@/components/app/notifications-list";
import { ProfileCard } from "@/components/app/profile-card";
import { QrGenerator } from "@/components/app/qr-generator";
import { ReportExportPanel } from "@/components/app/report-export-panel";
import { ScannerPanel } from "@/components/app/scanner-panel";
import { StatusBadge } from "@/components/app/status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  OfficeDashboardData,
  StudentDashboardData,
  WardenDashboardData,
} from "@/lib/live-data";
import { YEARS } from "@/lib/constants";
import {
  AttendanceRecord,
  HostelAnalytics,
  Profile,
  RoomStatistic,
  Student,
} from "@/lib/types";
import { formatDate, getInitials, percent } from "@/lib/utils";

export function StudentDashboard({ data }: { data: StudentDashboardData }) {
  const { profile, student, history, calendarDays, notifications } = data;

  if (!student) {
    return (
      <EmptyState
        title="No student profile found"
        description="Sign in with a registered student account, or complete student registration in Supabase."
      />
    );
  }

  const cardProfile =
    profile ??
    ({
      id: student.id,
      fullName: student.fullName,
      email: student.email,
      role: "student",
      forcePasswordChange: false,
      avatarInitials: getInitials(student.fullName),
    } satisfies Profile);

  return (
    <div className="space-y-4 sm:space-y-5">
      <AnimatedSection className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <KpiCard
          label="Attendance Percentage"
          value={`${student.attendancePercentage}%`}
          helper="Calculated from recorded attendance"
          icon={Gauge}
          tone="blue"
        />
        <KpiCard
          label="Today's Attendance"
          value={student.todayStatus}
          helper="QR window 06:00 - 08:00"
          icon={CalendarCheck2}
          tone="amber"
        />
        <KpiCard
          label="Hostel Room"
          value={student.roomNumber}
          helper={student.hostel}
          icon={BedDouble}
          tone="emerald"
        />
        <KpiCard
          label="Notifications"
          value={`${notifications.length}`}
          helper="Visible notices"
          icon={Bell}
          tone="rose"
        />
      </AnimatedSection>

      <AnimatedSection delay={0.05} className="grid gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <QrGenerator />
        <ProfileCard profile={cardProfile} student={student} />
      </AnimatedSection>

      <AnimatedSection delay={0.1} className="grid gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
        <Card>
          <CardHeader>
            <CardTitle>Attendance History</CardTitle>
            <CardDescription>Recent verified scans and daily status.</CardDescription>
          </CardHeader>
          <CardContent>
            <AttendanceHistoryTable records={history} />
          </CardContent>
        </Card>
        <AttendanceCalendar days={calendarDays} />
      </AnimatedSection>
    </div>
  );
}

export function WardenDashboard({ data }: { data: WardenDashboardData }) {
  const present = data.students.filter(isPresentToday).length;

  return (
    <div className="space-y-4 sm:space-y-5">
      <AnimatedSection className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <KpiCard
          label="Hostel Students"
          value={`${data.analytics.totalStudents}`}
          helper={data.hostel}
          icon={UsersRound}
          tone="emerald"
        />
        <KpiCard
          label="Present Today"
          value={`${data.analytics.presentToday}`}
          helper={`${data.analytics.attendanceRate}% attendance`}
          icon={CalendarCheck2}
          tone="blue"
        />
        <KpiCard
          label="Absent Today"
          value={`${data.analytics.absentToday}`}
          helper="Based on today's rows"
          icon={Clock3}
          tone="rose"
        />
        <KpiCard
          label="Rooms"
          value={`${data.analytics.rooms}`}
          helper="Current occupancy"
          icon={Building2}
          tone="amber"
        />
      </AnimatedSection>

      <AnimatedSection delay={0.05}>
        <YearWisePresentDashboard students={data.students} />
      </AnimatedSection>

      <AnimatedSection delay={0.1}>
        <ScannerPanel />
      </AnimatedSection>

      <AnimatedSection delay={0.15} className="grid gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
        <Card>
          <CardHeader>
            <CardTitle>{data.hostel} Students</CardTitle>
            <CardDescription>Roster from Supabase grouped by academic year.</CardDescription>
          </CardHeader>
          <CardContent>
            <StudentsTable students={data.students} />
          </CardContent>
        </Card>

        <RoomStatsCard hostel={data.hostel} present={present} rooms={data.roomStatistics} />
      </AnimatedSection>
    </div>
  );
}

export function AoDashboard({ data }: { data: OfficeDashboardData }) {
  const totalStudents = data.hostelAnalytics.reduce((sum, item) => sum + item.totalStudents, 0);
  const presentToday = data.hostelAnalytics.reduce((sum, item) => sum + item.presentToday, 0);

  return (
    <div className="space-y-4 sm:space-y-5">
      <AnimatedSection className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <KpiCard
          label="Overall Attendance"
          value={`${percent(presentToday, totalStudents)}%`}
          helper={`${presentToday}/${totalStudents} present`}
          icon={Activity}
          tone="blue"
        />
        <KpiCard
          label="Hostels"
          value={`${data.hostelAnalytics.length}`}
          helper="Visible in Supabase"
          icon={Building2}
          tone="emerald"
        />
        <KpiCard
          label="Departments"
          value={`${data.departmentAnalytics.length}`}
          helper="With registered students"
          icon={TrendingUp}
          tone="amber"
        />
        <KpiCard
          label="Report Rows"
          value={`${data.reportRows.length}`}
          helper="Export-ready"
          icon={FileText}
          tone="rose"
        />
      </AnimatedSection>

      <AnimatedSection delay={0.05} className="grid gap-4 sm:gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Hostel Analytics</CardTitle>
            <CardDescription>Present and absent counts by hostel.</CardDescription>
          </CardHeader>
          <CardContent>
            <HostelBarChart data={data.hostelAnalytics} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Department Analytics</CardTitle>
            <CardDescription>Attendance percentage by department.</CardDescription>
          </CardHeader>
          <CardContent>
            <DepartmentBarChart data={data.departmentAnalytics} />
          </CardContent>
        </Card>
      </AnimatedSection>

      <AnimatedSection delay={0.1}>
        <ReportExportPanel rows={data.reportRows} />
      </AnimatedSection>
    </div>
  );
}

export function DirectorDashboard({ data }: { data: OfficeDashboardData }) {
  const totalStudents = data.hostelAnalytics.reduce((sum, item) => sum + item.totalStudents, 0);
  const presentToday = data.hostelAnalytics.reduce((sum, item) => sum + item.presentToday, 0);
  const riskHostels = data.hostelAnalytics.filter(
    (item) => item.totalStudents > 0 && item.attendanceRate < 80,
  ).length;

  return (
    <div className="space-y-4 sm:space-y-5">
      <AnimatedSection className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <KpiCard
          label="Complete Analytics"
          value={`${percent(presentToday, totalStudents)}%`}
          helper="Institution-level attendance"
          icon={TrendingUp}
          tone="blue"
        />
        <KpiCard
          label="Realtime Monitoring"
          value="Enabled"
          helper="Refreshes on Supabase changes"
          icon={ScanLine}
          tone="emerald"
        />
        <KpiCard
          label="Risk Hostels"
          value={`${riskHostels}`}
          helper="Below 80% today"
          icon={Flame}
          tone="rose"
        />
        <KpiCard
          label="Report Rows"
          value={`${data.reportRows.length}`}
          helper="CSV, Excel, PDF"
          icon={FileText}
          tone="amber"
        />
      </AnimatedSection>

      <AnimatedSection delay={0.05} className="grid gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Attendance Trends</CardTitle>
            <CardDescription>Recent trend from recorded attendance rows.</CardDescription>
          </CardHeader>
          <CardContent>
            <AttendanceChart data={data.attendanceSeries} />
          </CardContent>
        </Card>
        <HeatmapCard hostels={data.hostelAnalytics} />
      </AnimatedSection>

      <AnimatedSection delay={0.1} className="grid gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
        <ReportExportPanel rows={data.reportRows} />
        <NotificationsList items={data.notifications} />
      </AnimatedSection>
    </div>
  );
}

function isPresentToday(student: Student) {
  return student.todayStatus === "Present" || student.todayStatus === "Late";
}

function YearWisePresentDashboard({ students }: { students: Student[] }) {
  const groups = YEARS.map((year) => {
    const yearStudents = students.filter((student) => student.year === year);
    const presentStudents = yearStudents.filter(isPresentToday);

    return {
      year,
      total: yearStudents.length,
      present: presentStudents.length,
      presentStudents,
      attendanceRate: percent(presentStudents.length, yearStudents.length),
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Year Wise Present Students</CardTitle>
        <CardDescription>Present and late scans grouped by academic year.</CardDescription>
      </CardHeader>
      <CardContent>
        {students.length ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {groups.map((group) => (
              <div key={group.year} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800 sm:p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{group.year} Year</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {group.total} {group.total === 1 ? "student" : "students"}
                    </p>
                  </div>
                  <Badge variant={group.present ? "success" : "muted"}>
                    {group.present}/{group.total}
                  </Badge>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Present today</span>
                    <span className="font-medium">{group.attendanceRate}%</span>
                  </div>
                  <Progress value={group.attendanceRate} />
                </div>
                <div className="mt-4 space-y-2">
                  {group.presentStudents.length ? (
                    <>
                      {group.presentStudents.slice(0, 3).map((student) => (
                        <div key={student.id} className="truncate text-sm font-medium">
                          {student.fullName}
                        </div>
                      ))}
                      {group.presentStudents.length > 3 ? (
                        <Badge variant="muted">+{group.presentStudents.length - 3} more</Badge>
                      ) : null}
                    </>
                  ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400">No present students yet.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-slate-200 p-4 text-sm text-slate-500 dark:border-slate-800">
            No students found for this hostel.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function StudentsTable({ students }: { students: Student[] }) {
  const studentsByYear = YEARS.map((year) => ({
    year,
    students: students.filter((student) => student.year === year),
  })).filter((group) => group.students.length > 0);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Year</TableHead>
          <TableHead>Department</TableHead>
          <TableHead>Room</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {studentsByYear.map((group) => (
          <Fragment key={group.year}>
            <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 dark:bg-slate-900/70 dark:hover:bg-slate-900/70">
              <TableCell colSpan={6} className="py-2 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                {group.year} Year - {group.students.length} {group.students.length === 1 ? "student" : "students"}
              </TableCell>
            </TableRow>
            {group.students.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="font-medium">{student.fullName}</TableCell>
                <TableCell>{student.year}</TableCell>
                <TableCell>{student.department}</TableCell>
                <TableCell>{student.roomNumber}</TableCell>
                <TableCell>
                  <StatusBadge status={student.todayStatus} />
                </TableCell>
                <TableCell>
                  <ManualAttendanceButton
                    studentId={student.id}
                    studentName={student.fullName}
                    status={student.todayStatus}
                  />
                </TableCell>
              </TableRow>
            ))}
          </Fragment>
        ))}
        {!students.length ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-slate-500">
              No students found for this hostel.
            </TableCell>
          </TableRow>
        ) : null}
      </TableBody>
    </Table>
  );
}

function AttendanceHistoryTable({ records }: { records: AttendanceRecord[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Time</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Verified By</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {records.map((record) => (
          <TableRow key={record.id}>
            <TableCell>{formatDate(record.date)}</TableCell>
            <TableCell>{record.checkInTime ? formatDate(record.checkInTime, "HH:mm") : "-"}</TableCell>
            <TableCell>
              <StatusBadge status={record.status} />
            </TableCell>
            <TableCell>{record.verifiedBy ?? "Pending"}</TableCell>
          </TableRow>
        ))}
        {!records.length ? (
          <TableRow>
            <TableCell colSpan={4} className="text-center text-slate-500">
              No attendance records found.
            </TableCell>
          </TableRow>
        ) : null}
      </TableBody>
    </Table>
  );
}

function RoomStatsCard({
  hostel,
  present,
  rooms,
}: {
  hostel: string;
  present: number;
  rooms: RoomStatistic[];
}) {
  const occupied = rooms.reduce((sum, room) => sum + room.occupied, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Room Statistics</CardTitle>
        <CardDescription>{hostel} room occupancy and scan completion.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium">Visible roster completion</span>
            <span>
              {present}/{occupied}
            </span>
          </div>
          <Progress value={percent(present, occupied)} />
        </div>
        <div className="space-y-3">
          {rooms.map((room) => (
            <div key={room.roomNumber} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{room.roomNumber}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {room.occupied}/{room.capacity} occupied
                  </p>
                </div>
                <Badge variant={room.presentToday === room.occupied ? "success" : "warning"}>
                  {room.presentToday} present
                </Badge>
              </div>
            </div>
          ))}
          {!rooms.length ? (
            <p className="rounded-lg border border-slate-200 p-4 text-sm text-slate-500 dark:border-slate-800">
              No room assignments found.
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function HeatmapCard({ hostels }: { hostels: HostelAnalytics[] }) {
  const activeHostels = hostels.filter((hostel) => hostel.totalStudents > 0);
  const cells = activeHostels.flatMap((hostel) =>
    Array.from({ length: Math.max(1, hostel.rooms) }, (_, index) => ({
      key: `${hostel.hostel}-${index}`,
      hostel: hostel.hostel,
      value: hostel.attendanceRate,
    })),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance Heatmap</CardTitle>
        <CardDescription>Hostel clusters ranked by attendance signal.</CardDescription>
      </CardHeader>
      <CardContent>
        {cells.length ? (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {cells.map((cell) => (
              <div
                key={cell.key}
                className="aspect-square rounded-md border border-slate-200 p-2 text-xs dark:border-slate-800"
                style={{
                  backgroundColor: `color-mix(in srgb, #2563eb ${cell.value}%, white)`,
                  color: cell.value > 78 ? "white" : "#0f172a",
                }}
                title={`${cell.hostel}: ${cell.value}%`}
              >
                {cell.value}
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-slate-200 p-4 text-sm text-slate-500 dark:border-slate-800">
            No attendance heatmap data yet.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}
