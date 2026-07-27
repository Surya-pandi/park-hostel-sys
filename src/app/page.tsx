import Link from "next/link";
import { ArrowRight, ShieldCheck, UserPlus } from "lucide-react";

import { CollegeLogo } from "@/components/app/college-logo";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { APP_NAME, COLLEGE_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <section className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-5 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-4">
            <CollegeLogo />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{COLLEGE_NAME}</p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">{APP_NAME}</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <ThemeToggle />
              <Link href="/login" className={cn(buttonVariants({ variant: "outline" }))}>
                Login
              </Link>
            </div>
          </nav>

          <div className="grid flex-1 content-center py-12">
            <div className="max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                <ShieldCheck className="size-4 text-blue-600" />
                Supabase-backed hostel attendance
              </div>
              <h1 className="text-4xl font-semibold tracking-normal sm:text-5xl lg:text-6xl">
                PCET Hostel Attendance
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">
                Sign in to access your role-based attendance workspace. Student, warden, AO, and
                director screens now read directly from Supabase.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/login" className={cn(buttonVariants({ size: "lg" }))}>
                  Login
                  <ArrowRight className="size-4" />
                </Link>
                <Link href="/register" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
                  <UserPlus className="size-4" />
                  Register Student
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
