"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { useState, useTransition } from "react";

import { decideLeaveRequestAction } from "@/app/actions/leave";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ActionState } from "@/lib/types";

type LeaveDecisionControlsProps = {
  requestId: string;
};

export function LeaveDecisionControls({ requestId }: LeaveDecisionControlsProps) {
  const [note, setNote] = useState("");
  const [state, setState] = useState<ActionState>({ ok: false, message: "" });
  const [isPending, startTransition] = useTransition();

  function review(decision: "approve" | "reject") {
    startTransition(async () => {
      const result = await decideLeaveRequestAction(requestId, decision, note);
      setState(result);
    });
  }

  return (
    <div className="min-w-64 space-y-2">
      <Textarea
        aria-label="Review note"
        className="min-h-16 text-xs"
        maxLength={500}
        placeholder="Review note"
        value={note}
        onChange={(event) => setNote(event.target.value)}
        disabled={isPending}
      />
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={() => review("approve")} disabled={isPending}>
          <CheckCircle2 className="size-4" />
          {isPending ? "Saving..." : "Confirm"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="destructive"
          onClick={() => review("reject")}
          disabled={isPending}
        >
          <XCircle className="size-4" />
          Reject
        </Button>
      </div>
      {state.message ? (
        <p
          className={
            state.ok
              ? "max-w-72 text-xs text-emerald-600 dark:text-emerald-300"
              : "max-w-72 text-xs text-rose-600 dark:text-rose-300"
          }
          aria-live="polite"
        >
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
