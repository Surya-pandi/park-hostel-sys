import {
  CheckCircle2,
  Clock3,
  FileText,
} from "lucide-react";

import { LeaveDecisionControls } from "@/components/app/leave-decision-controls";
import { LeaveRequestForm } from "@/components/app/leave-request-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { LeavePageData } from "@/lib/leave-data";
import type { LeaveRequest, LeaveRequestStatus } from "@/lib/types";
import { formatDate } from "@/lib/utils";

type LeaveRequestPanelProps = {
  data: LeavePageData;
};

export function LeaveRequestPanel({ data }: LeaveRequestPanelProps) {
  if (data.errorMessage && !data.schemaReady) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Leave Requests Unavailable</CardTitle>
          <CardDescription>Apply the latest Supabase migration before opening this page.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-rose-600 dark:text-rose-300">{data.errorMessage}</p>
        </CardContent>
      </Card>
    );
  }

  if (!data.profile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sign In Required</CardTitle>
          <CardDescription>Leave permissions are available after sign in.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (data.scope === "student") {
    return <StudentLeaveView data={data} />;
  }

  return <ApprovalLeaveView data={data} />;
}

function StudentLeaveView({ data }: { data: LeavePageData }) {
  const latest = data.requests[0];

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="grid gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
        <Card>
          <CardHeader>
            <CardTitle>Request Leave</CardTitle>
            <CardDescription>
              {data.student
                ? `${data.student.fullName} - ${data.student.hostel}, room ${data.student.roomNumber}`
                : "No active student profile found."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LeaveRequestForm disabled={!data.student} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Latest Status</CardTitle>
            <CardDescription>{latest ? formatDate(latest.createdAt, "dd MMM yyyy, HH:mm") : "No request yet"}</CardDescription>
          </CardHeader>
          <CardContent>
            {latest ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <LeaveStatusBadge status={latest.status} label={latest.statusLabel} />
                  <Badge variant="muted">{formatDateRange(latest)}</Badge>
                </div>
                <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{latest.reason}</p>
                <LeaveStageTrail request={latest} />
              </div>
            ) : (
              <EmptyText>No leave requests found.</EmptyText>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Leave Requests</CardTitle>
          <CardDescription>Status across warden, AO, and director review.</CardDescription>
        </CardHeader>
        <CardContent>
          <LeaveRequestsTable requests={data.requests} showStudent={false} showActions={false} />
        </CardContent>
      </Card>
    </div>
  );
}

function ApprovalLeaveView({ data }: { data: LeavePageData }) {
  const reviewRequests = data.requests.filter((request) => request.canReview);

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryTile
          label="Pending Review"
          value={data.pendingReviewCount}
          helper={reviewScopeLabel(data.scope)}
          icon="pending"
        />
        <SummaryTile
          label="Visible Requests"
          value={data.requests.length}
          helper={data.scope === "warden" ? data.profile?.hostel ?? "Assigned hostel" : "All hostels"}
          icon="total"
        />
        <SummaryTile
          label="Approved"
          value={data.requests.filter((request) => request.status === "approved").length}
          helper="Director-confirmed permissions"
          icon="approved"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Requests For Review</CardTitle>
          <CardDescription>{reviewScopeLabel(data.scope)}</CardDescription>
        </CardHeader>
        <CardContent>
          <LeaveRequestsTable requests={reviewRequests} showStudent showActions />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Leave Request History</CardTitle>
          <CardDescription>Visible requests and their approval trail.</CardDescription>
        </CardHeader>
        <CardContent>
          <LeaveRequestsTable requests={data.requests} showStudent showActions={false} />
        </CardContent>
      </Card>
    </div>
  );
}

function LeaveRequestsTable({
  requests,
  showStudent,
  showActions,
}: {
  requests: LeaveRequest[];
  showStudent: boolean;
  showActions: boolean;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {showStudent ? <TableHead>Student</TableHead> : null}
          {showStudent ? <TableHead>Hostel</TableHead> : null}
          <TableHead>Dates</TableHead>
          <TableHead>Reason</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Approval Trail</TableHead>
          {showActions ? <TableHead>Action</TableHead> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((request) => (
          <TableRow key={request.id}>
            {showStudent ? (
              <TableCell>
                <div className="min-w-44">
                  <p className="font-medium">{request.studentName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {request.admissionNo} - {request.year} {request.department}
                  </p>
                </div>
              </TableCell>
            ) : null}
            {showStudent ? (
              <TableCell>
                <div className="min-w-36">
                  <p>{request.hostel}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Room {request.roomNumber}</p>
                </div>
              </TableCell>
            ) : null}
            <TableCell>
              <div className="min-w-36">
                <p className="font-medium">{formatDateRange(request)}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Requested {formatDate(request.createdAt)}
                </p>
              </div>
            </TableCell>
            <TableCell>
              <p className="max-w-72 whitespace-normal text-sm leading-5">{request.reason}</p>
            </TableCell>
            <TableCell>
              <LeaveStatusBadge status={request.status} label={request.statusLabel} />
            </TableCell>
            <TableCell>
              <LeaveStageTrail request={request} />
            </TableCell>
            {showActions ? (
              <TableCell>
                {request.canReview ? <LeaveDecisionControls requestId={request.id} /> : null}
              </TableCell>
            ) : null}
          </TableRow>
        ))}
        {!requests.length ? (
          <TableRow>
            <TableCell colSpan={showStudent ? (showActions ? 7 : 6) : 4} className="text-center text-slate-500">
              No leave requests found.
            </TableCell>
          </TableRow>
        ) : null}
      </TableBody>
    </Table>
  );
}

function LeaveStatusBadge({
  status,
  label,
}: {
  status: LeaveRequestStatus;
  label: string;
}) {
  const variant = status === "approved" ? "success" : status.startsWith("rejected") ? "danger" : "warning";

  return <Badge variant={variant}>{label}</Badge>;
}

function LeaveStageTrail({ request }: { request: LeaveRequest }) {
  const stages = [
    {
      label: "Warden",
      reviewedAt: request.wardenReviewedAt,
      note: request.wardenNote,
      rejected: request.status === "rejected_warden",
      pending: request.status === "pending_warden",
    },
    {
      label: "AO",
      reviewedAt: request.aoReviewedAt,
      note: request.aoNote,
      rejected: request.status === "rejected_ao",
      pending: request.status === "pending_ao",
    },
    {
      label: "Director",
      reviewedAt: request.directorReviewedAt,
      note: request.directorNote,
      rejected: request.status === "rejected_director",
      pending: request.status === "pending_director",
    },
  ];

  return (
    <div className="min-w-64 space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {stages.map((stage) => (
          <Badge
            key={stage.label}
            variant={stage.rejected ? "danger" : stage.reviewedAt ? "success" : stage.pending ? "warning" : "muted"}
          >
            {stage.label}: {stage.rejected ? "Rejected" : stage.reviewedAt ? "Confirmed" : stage.pending ? "Pending" : "Waiting"}
          </Badge>
        ))}
      </div>
      {stages
        .filter((stage) => stage.note)
        .map((stage) => (
          <p key={stage.label} className="max-w-72 text-xs text-slate-500 dark:text-slate-400">
            {stage.label}: {stage.note}
          </p>
        ))}
    </div>
  );
}

function SummaryTile({
  label,
  value,
  helper,
  icon,
}: {
  label: string;
  value: number;
  helper: string;
  icon: "pending" | "total" | "approved";
}) {
  const Icon = icon === "pending" ? Clock3 : icon === "approved" ? CheckCircle2 : FileText;

  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4 sm:p-5">
        <span className="grid size-10 shrink-0 place-items-center rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-200">
          <Icon className="size-5" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm text-slate-500 dark:text-slate-400">{label}</span>
          <span className="block text-2xl font-semibold">{value}</span>
          <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{helper}</span>
        </span>
      </CardContent>
    </Card>
  );
}

function reviewScopeLabel(scope: LeavePageData["scope"]) {
  if (scope === "warden") {
    return "Warden confirmation pending";
  }

  if (scope === "ao") {
    return "AO confirmation pending";
  }

  if (scope === "director") {
    return "Director final approval pending";
  }

  return "Student leave status";
}

function formatDateRange(request: LeaveRequest) {
  if (request.fromDate === request.toDate) {
    return formatDate(request.fromDate);
  }

  return `${formatDate(request.fromDate)} - ${formatDate(request.toDate)}`;
}

function EmptyText({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-slate-200 p-4 text-sm text-slate-500 dark:border-slate-800">
      {children}
    </p>
  );
}
