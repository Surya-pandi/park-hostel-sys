"use client";

import { CheckCircle2 } from "lucide-react";
import { useState, useTransition } from "react";

import { markManualAttendancePresentAction } from "@/app/actions/attendance";
import { Button } from "@/components/ui/button";
import { AttendanceStatus } from "@/lib/types";

type ManualAttendanceButtonProps = {
  studentId: string;
  studentName: string;
  status: AttendanceStatus;
};

export function ManualAttendanceButton({
  studentId,
  studentName,
  status,
}: ManualAttendanceButtonProps) {
  const [message, setMessage] = useState("");
  const [ok, setOk] = useState<boolean | null>(null);
  const [isPending, startTransition] = useTransition();
  const alreadyRecorded = status === "Present" || status === "Late";

  function markPresent() {
    startTransition(async () => {
      const result = await markManualAttendancePresentAction(studentId);
      setOk(result.ok);
      setMessage(result.message);
    });
  }

  return (
    <div className="min-w-28 space-y-1 sm:min-w-32">
      <Button
        type="button"
        className="w-full whitespace-nowrap"
        size="sm"
        variant={alreadyRecorded ? "outline" : "default"}
        onClick={markPresent}
        disabled={alreadyRecorded || isPending}
        aria-label={`Mark ${studentName} present manually`}
      >
        <CheckCircle2 className="size-4" />
        {alreadyRecorded ? "Recorded" : isPending ? "Marking..." : "Mark Present"}
      </Button>
      {message ? (
        <p
          className={
            ok
              ? "max-w-44 text-xs text-emerald-600 dark:text-emerald-300"
              : "max-w-44 text-xs text-rose-600 dark:text-rose-300"
          }
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
