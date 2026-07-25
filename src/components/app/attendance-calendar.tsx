import { format } from "date-fns";

import { StatusBadge } from "@/components/app/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDay } from "@/lib/types";
import { cn } from "@/lib/utils";

const statusClasses = {
  Present: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  Absent: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200",
  Pending: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200",
  Late: "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-200",
};

export function AttendanceCalendar({ days }: { days: CalendarDay[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle>Attendance Calendar</CardTitle>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status="Present" />
          <StatusBadge status="Late" />
          <StatusBadge status="Absent" />
        </div>
      </CardHeader>
      <CardContent>
        {days.length ? (
          <div className="grid grid-cols-7 gap-2">
            {days.map((day) => (
              <div
                key={day.date}
                className={cn(
                  "flex aspect-square min-h-12 flex-col justify-between rounded-md border p-2 text-xs",
                  statusClasses[day.status],
                )}
                title={`${format(new Date(day.date), "dd MMM yyyy")} - ${day.status}`}
              >
                <span className="font-semibold">{format(new Date(day.date), "dd")}</span>
                <span className="truncate">{day.status}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-slate-200 p-4 text-sm text-slate-500 dark:border-slate-800">
            No attendance calendar data found.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
