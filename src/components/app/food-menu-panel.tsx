import {
  CheckCircle2,
  Clock3,
  FileText,
} from "lucide-react";

import { FoodMenuDecisionControls } from "@/components/app/food-menu-decision-controls";
import { FoodMenuForm } from "@/components/app/food-menu-form";
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
import type { FoodMenuPageData } from "@/lib/food-menu-data";
import type { FoodMenu, FoodMenuStatus } from "@/lib/types";
import { formatDate } from "@/lib/utils";

type FoodMenuPanelProps = {
  data: FoodMenuPageData;
};

export function FoodMenuPanel({ data }: FoodMenuPanelProps) {
  if (data.errorMessage && !data.schemaReady) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Food Menu Unavailable</CardTitle>
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
          <CardDescription>Food menus are available after sign in.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (data.scope === "warden") {
    return <WardenFoodMenuView data={data} />;
  }

  if (data.scope === "director") {
    return <DirectorFoodMenuView data={data} />;
  }

  return <StudentFoodMenuView data={data} />;
}

function StudentFoodMenuView({ data }: { data: FoodMenuPageData }) {
  return (
    <div className="space-y-4 sm:space-y-5">
      {data.currentMenu ? (
        <FoodMenuDetailCard menu={data.currentMenu} title="Current Food Menu" />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Current Food Menu</CardTitle>
            <CardDescription>Approved hostel menu for the current week.</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyText>No approved food menu is available yet.</EmptyText>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Approved Menu History</CardTitle>
          <CardDescription>Recent approved menus for your hostel.</CardDescription>
        </CardHeader>
        <CardContent>
          <FoodMenuHistoryTable menus={data.menus} showHostel={false} />
        </CardContent>
      </Card>
    </div>
  );
}

function WardenFoodMenuView({ data }: { data: FoodMenuPageData }) {
  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="grid gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Submit Weekly Food Menu</CardTitle>
            <CardDescription>
              {data.assignedHostel ? `${data.assignedHostel} seven-day menu` : "Assigned hostel menu"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FoodMenuForm disabled={!data.assignedHostel} />
            {data.errorMessage ? (
              <p className="mt-3 text-sm text-rose-600 dark:text-rose-300">{data.errorMessage}</p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Latest Approved Menu</CardTitle>
            <CardDescription>{data.assignedHostel ?? "Assigned hostel"}</CardDescription>
          </CardHeader>
          <CardContent>
            {data.currentMenu ? (
              <div className="space-y-3">
                <MenuHeading menu={data.currentMenu} showHostel={false} />
                <FoodMenuMiniList menu={data.currentMenu} />
              </div>
            ) : (
              <EmptyText>No approved menu found.</EmptyText>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Submission History</CardTitle>
          <CardDescription>Weekly menus submitted for director review.</CardDescription>
        </CardHeader>
        <CardContent>
          <FoodMenuHistoryTable menus={data.menus} showHostel={false} />
        </CardContent>
      </Card>
    </div>
  );
}

function DirectorFoodMenuView({ data }: { data: FoodMenuPageData }) {
  const pendingMenus = data.menus.filter((menu) => menu.canApprove);

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryTile
          label="Pending Approval"
          value={data.pendingApprovalCount}
          helper="Awaiting director review"
          icon="pending"
        />
        <SummaryTile
          label="Visible Menus"
          value={data.menus.filter((menu) => menu.status === "approved").length}
          helper="Approved for students"
          icon="approved"
        />
        <SummaryTile
          label="Total Submissions"
          value={data.menus.length}
          helper="Recent weekly menus"
          icon="total"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Menus For Approval</CardTitle>
          <CardDescription>Warden submissions waiting for final approval.</CardDescription>
        </CardHeader>
        <CardContent>
          <DirectorPendingMenuList menus={pendingMenus} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Food Menu History</CardTitle>
          <CardDescription>Approved, pending, and rejected weekly menus.</CardDescription>
        </CardHeader>
        <CardContent>
          <FoodMenuHistoryTable menus={data.menus} showHostel />
        </CardContent>
      </Card>
    </div>
  );
}

function FoodMenuDetailCard({
  menu,
  title,
}: {
  menu: FoodMenu;
  title: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{formatMenuRange(menu)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <MenuHeading menu={menu} showHostel />
        <FoodMenuTable menu={menu} />
      </CardContent>
    </Card>
  );
}

function DirectorPendingMenuList({ menus }: { menus: FoodMenu[] }) {
  if (!menus.length) {
    return <EmptyText>No food menus are waiting for approval.</EmptyText>;
  }

  return (
    <div className="space-y-4">
      {menus.map((menu) => (
        <section key={menu.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800 sm:p-4">
          <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
            <MenuHeading menu={menu} showHostel />
            <FoodMenuDecisionControls menuId={menu.id} />
          </div>
          <FoodMenuTable menu={menu} />
        </section>
      ))}
    </div>
  );
}

function MenuHeading({
  menu,
  showHostel,
}: {
  menu: FoodMenu;
  showHostel: boolean;
}) {
  return (
    <div className="min-w-0 space-y-2">
      <div>
        <p className="text-base font-semibold">{menu.title}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {showHostel ? `${menu.hostel} - ` : ""}
          {formatMenuRange(menu)}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <FoodMenuStatusBadge status={menu.status} label={menu.statusLabel} />
        <Badge variant="muted">Submitted {formatDate(menu.submittedAt, "dd MMM yyyy, HH:mm")}</Badge>
      </div>
      {menu.directorNote ? (
        <p className="max-w-3xl text-sm text-slate-500 dark:text-slate-400">
          Director: {menu.directorNote}
        </p>
      ) : null}
    </div>
  );
}

function FoodMenuMiniList({ menu }: { menu: FoodMenu }) {
  return (
    <div className="space-y-2">
      {menu.items.slice(0, 3).map((item) => (
        <div key={item.date} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
          <p className="text-sm font-semibold">
            {item.day} - {formatDate(item.date)}
          </p>
          <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
            {item.breakfast}; {item.lunch}; {item.dinner}
          </p>
        </div>
      ))}
      {menu.items.length > 3 ? <Badge variant="muted">+{menu.items.length - 3} more days</Badge> : null}
    </div>
  );
}

function FoodMenuTable({ menu }: { menu: FoodMenu }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Day</TableHead>
          <TableHead>Breakfast</TableHead>
          <TableHead>Lunch</TableHead>
          <TableHead>Snacks</TableHead>
          <TableHead>Dinner</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {menu.items.map((item) => (
          <TableRow key={item.date}>
            <TableCell>
              <div className="min-w-32">
                <p className="font-medium">{item.day}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{formatDate(item.date)}</p>
              </div>
            </TableCell>
            <TableCell>
              <p className="max-w-64 whitespace-normal leading-5">{item.breakfast}</p>
            </TableCell>
            <TableCell>
              <p className="max-w-64 whitespace-normal leading-5">{item.lunch}</p>
            </TableCell>
            <TableCell>
              <p className="max-w-64 whitespace-normal leading-5">{item.snacks}</p>
            </TableCell>
            <TableCell>
              <p className="max-w-64 whitespace-normal leading-5">{item.dinner}</p>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function FoodMenuHistoryTable({
  menus,
  showHostel,
}: {
  menus: FoodMenu[];
  showHostel: boolean;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {showHostel ? <TableHead>Hostel</TableHead> : null}
          <TableHead>Week</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Submitted</TableHead>
          <TableHead>Director Note</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {menus.map((menu) => (
          <TableRow key={menu.id}>
            {showHostel ? <TableCell className="font-medium">{menu.hostel}</TableCell> : null}
            <TableCell>
              <div className="min-w-44">
                <p className="font-medium">{menu.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{formatMenuRange(menu)}</p>
              </div>
            </TableCell>
            <TableCell>
              <FoodMenuStatusBadge status={menu.status} label={menu.statusLabel} />
            </TableCell>
            <TableCell>{formatDate(menu.submittedAt, "dd MMM yyyy, HH:mm")}</TableCell>
            <TableCell>
              <p className="max-w-72 whitespace-normal text-sm leading-5 text-slate-600 dark:text-slate-300">
                {menu.directorNote ?? "-"}
              </p>
            </TableCell>
          </TableRow>
        ))}
        {!menus.length ? (
          <TableRow>
            <TableCell colSpan={showHostel ? 5 : 4} className="text-center text-slate-500">
              No food menus found.
            </TableCell>
          </TableRow>
        ) : null}
      </TableBody>
    </Table>
  );
}

function FoodMenuStatusBadge({
  status,
  label,
}: {
  status: FoodMenuStatus;
  label: string;
}) {
  const variant = status === "approved" ? "success" : status === "rejected_director" ? "danger" : "warning";

  return <Badge variant={variant}>{label}</Badge>;
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
  icon: "pending" | "approved" | "total";
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

function formatMenuRange(menu: FoodMenu) {
  return `${formatDate(menu.weekStart)} - ${formatDate(menu.weekEnd)}`;
}

function EmptyText({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-slate-200 p-4 text-sm text-slate-500 dark:border-slate-800">
      {children}
    </p>
  );
}
