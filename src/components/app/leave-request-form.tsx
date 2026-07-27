"use client";

import { Send } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";

import { createLeaveRequestAction } from "@/app/actions/leave";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ActionState } from "@/lib/types";

const initialState: ActionState = {
  ok: false,
  message: "",
};

type LeaveRequestFormProps = {
  disabled?: boolean;
};

export function LeaveRequestForm({ disabled = false }: LeaveRequestFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(createLeaveRequestAction, initialState);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
    }
  }, [state.ok, state.message]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="fromDate">From Date</Label>
          <Input id="fromDate" name="fromDate" type="date" required disabled={disabled || pending} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="toDate">To Date</Label>
          <Input id="toDate" name="toDate" type="date" required disabled={disabled || pending} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="reason">Reason</Label>
        <Textarea
          id="reason"
          name="reason"
          required
          minLength={10}
          maxLength={1000}
          placeholder="Reason for leave"
          disabled={disabled || pending}
        />
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button type="submit" disabled={disabled || pending}>
          <Send className="size-4" />
          {pending ? "Submitting..." : "Submit Request"}
        </Button>
        {state.message ? (
          <p
            className={
              state.ok
                ? "text-sm text-emerald-600 dark:text-emerald-300"
                : "text-sm text-rose-600 dark:text-rose-300"
            }
            aria-live="polite"
          >
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
