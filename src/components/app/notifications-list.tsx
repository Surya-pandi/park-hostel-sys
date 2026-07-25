import { Bell, CircleAlert, CircleCheck, Info } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NotificationItem } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const severityIcon = {
  info: Info,
  success: CircleCheck,
  warning: CircleAlert,
  critical: Bell,
};

const severityVariant = {
  info: "default",
  success: "success",
  warning: "warning",
  critical: "danger",
} as const;

export function NotificationsList({ items }: { items: NotificationItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => {
          const Icon = severityIcon[item.severity];

          return (
            <div
              key={item.id}
              className="flex gap-3 rounded-lg border border-slate-200 p-4 dark:border-slate-800"
            >
              <span className="mt-0.5 grid size-9 place-items-center rounded-md bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{item.title}</p>
                  {item.unread ? <Badge variant="warning">Unread</Badge> : null}
                  <Badge variant={severityVariant[item.severity]}>{item.audience}</Badge>
                </div>
                <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{item.body}</p>
                <p className="mt-2 text-xs text-slate-400">{formatDate(item.createdAt, "dd MMM yyyy, HH:mm")}</p>
              </div>
            </div>
          );
        })}
        {!items.length ? (
          <p className="rounded-lg border border-slate-200 p-4 text-sm text-slate-500 dark:border-slate-800">
            No notifications found.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
