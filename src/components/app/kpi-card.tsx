import { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type KpiCardProps = {
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
  tone?: "blue" | "emerald" | "amber" | "rose" | "violet" | "zinc";
};

const toneClasses = {
  blue: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-200",
  emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200",
  amber: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-200",
  rose: "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-200",
  violet: "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-200",
  zinc: "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200",
};

export function KpiCard({ label, value, helper, icon: Icon, tone = "blue" }: KpiCardProps) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 p-4 sm:gap-4 sm:p-5">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 break-words text-2xl font-semibold tracking-normal text-slate-950 dark:text-white sm:text-3xl">
            {value}
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{helper}</p>
        </div>
        <span className={cn("shrink-0 rounded-md p-2", toneClasses[tone])}>
          <Icon className="size-5" />
        </span>
      </CardContent>
    </Card>
  );
}
