import Link from "next/link";

import { ForgotPasswordForm } from "@/components/app/forgot-password-form";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ForgotPasswordPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-10 dark:bg-slate-950">
      <div className="w-full max-w-md">
        <div className="mb-5">
          <Link href="/login" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Back to login
          </Link>
        </div>
        <ForgotPasswordForm />
      </div>
    </main>
  );
}
