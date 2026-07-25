import Link from "next/link";
import { LogOut, PanelLeft, QrCode } from "lucide-react";

import { RealtimeRefresh } from "@/components/app/realtime-refresh";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { APP_NAME, COLLEGE_NAME, NAVIGATION, ROLE_CONFIG, type RoleSlug } from "@/lib/constants";
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <RealtimeRefresh />
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation">
            <PanelLeft className="size-5" />
          </Button>
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-md bg-blue-600 text-white">
              <QrCode className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold leading-5">{COLLEGE_NAME}</span>
              <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                {APP_NAME}
              </span>
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <Badge variant="muted">{roleMeta.label}</Badge>
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
      </header>

      <div className="grid lg:grid-cols-[260px_1fr]">
        <aside className="hidden min-h-[calc(100vh-4rem)] border-r border-slate-200 bg-white px-4 py-6 dark:border-slate-800 dark:bg-slate-950 lg:block">
          <nav className="space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href === "$dashboard" ? roleMeta.route : item.href}
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
              Dynamic QR validation is configured for 06:00 to 08:00 with 30-second expiry.
            </p>
          </div>
        </aside>

        <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-blue-600 dark:text-blue-300">{roleMeta.label}</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-normal sm:text-3xl">{title}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                {description}
              </p>
            </div>
            {action}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
