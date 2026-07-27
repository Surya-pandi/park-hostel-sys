import Link from "next/link";

import { CollegeLogo } from "@/components/app/college-logo";
import { LoginForm } from "@/components/app/login-form";
import { APP_NAME, COLLEGE_NAME } from "@/lib/constants";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-10 dark:bg-slate-950">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 flex items-center justify-center gap-3 text-center">
          <CollegeLogo />
          <span className="text-left">
            <span className="block text-sm font-semibold">{COLLEGE_NAME}</span>
            <span className="block text-xs text-slate-500 dark:text-slate-400">{APP_NAME}</span>
          </span>
        </Link>
        <LoginForm />
      </div>
    </main>
  );
}
