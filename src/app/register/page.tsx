import Link from "next/link";

import { RegisterForm } from "@/components/app/register-form";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex flex-col items-start justify-between gap-4 min-[480px]:flex-row min-[480px]:items-center">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold">Register Student</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Student login username is email and default password is date of birth in DD-MM-YYYY format.
            </p>
          </div>
          <Link href="/login" className={cn(buttonVariants({ variant: "outline" }), "w-full min-[480px]:w-auto")}>
            Login
          </Link>
        </div>
        <RegisterForm />
      </div>
    </main>
  );
}
