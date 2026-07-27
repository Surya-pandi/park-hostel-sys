import Image from "next/image";

import { cn } from "@/lib/utils";

type CollegeLogoProps = {
  className?: string;
};

export function CollegeLogo({ className }: CollegeLogoProps) {
  return (
    <span
      className={cn(
        "relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-md border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-700",
        className,
      )}
      aria-hidden="true"
    >
      <Image
        src="/college-logo.jpg"
        alt=""
        width={64}
        height={64}
        className="h-full w-full object-contain"
      />
    </span>
  );
}
