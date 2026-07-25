import { Badge } from "@/components/ui/badge";
import { AttendanceStatus } from "@/lib/types";

type StatusBadgeProps = {
  status: AttendanceStatus | "Open" | "Closed" | "Live";
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const variant =
    status === "Present" || status === "Open" || status === "Live"
      ? "success"
      : status === "Late" || status === "Pending"
        ? "warning"
        : status === "Absent" || status === "Closed"
          ? "danger"
          : "muted";

  return <Badge variant={variant}>{status}</Badge>;
}
