import Link from "next/link";
import { LogOut } from "lucide-react";

import { CollegeLogo } from "@/components/app/college-logo";
import { RealtimeRefresh } from "@/components/app/realtime-refresh";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  APP_NAME,
  ATTENDANCE_WINDOW,
  COLLEGE_NAME,
  NAVIGATION,
  ROLE_CONFIG,
  type RoleSlug,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

type DashboardShellProps = {
  role: RoleSlug;
  title: string;
  description: string;
  children: React.ReactNode;
  action?: React.ReactNode;
};

export function DashboardShell({
  role,
  title,
  description,
  children,
  action,
}: DashboardShellProps) {
  const roleMeta = ROLE_CONFIG[role];
  const navigation = NAVIGATION.filter((item) => item.roles.includes(role));
  const resolveNavigationHref = (href: string) => {
    if (href === "$dashboard") {
      return roleMeta.route;
    }

    if (href === "$students") {
      const [pathname, search] = roleMeta.route.split("?");
      return `${pathname}/students${search ? `?${search}` : ""}`;
    }

    return href;
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <RealtimeRefresh />
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="flex min-h-16 items-center gap-3 px-3 py-2 sm:px-6 lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3" aria-label={APP_NAME}>
            <CollegeLogo className="size-10 sm:size-11" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold leading-5">{COLLEGE_NAME}</span>
              <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                {APP_NAME}
              </span>
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge variant="muted" className="hidden sm:inline-flex">
              {roleMeta.label}
            </Badge>
            <ThemeToggle />
            <Link
              href="/login"
              className={cn(buttonVariants({ variant: "outline", size: "icon" }))}
              aria-label="Logout"
              title="Logout"
            >
              <LogOut className="size-4" />
            </Link>
          </div>
        </div>
        <nav className="flex gap-2 overflow-x-auto border-t border-slate-100 px-3 py-2 dark:border-slate-900 lg:hidden">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={resolveNavigationHref(item.href)}
              className="inline-flex min-w-max items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <div className="grid lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="hidden min-h-[calc(100vh-4rem)] border-r border-slate-200 bg-white px-4 py-6 dark:border-slate-800 dark:bg-slate-950 lg:block">
          <nav className="space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={resolveNavigationHref(item.href)}
                className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white"
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
            <p className="text-sm font-semibold">Attendance window</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Dynamic QR validation is configured for 06:00 to 08:00 with{" "}
              {ATTENDANCE_WINDOW.expirySeconds}-second expiry.
            </p>
          </div>
        </aside>

        <main className="min-w-0 px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
          <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-blue-600 dark:text-blue-300">{roleMeta.label}</p>
              <h1 className="mt-1 text-xl font-semibold tracking-normal sm:text-3xl">{title}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-5 text-slate-500 dark:text-slate-400 sm:leading-6">
                {description}
              </p>
            </div>
            {action ? <div className="w-full shrink-0 sm:w-auto">{action}</div> : null}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
