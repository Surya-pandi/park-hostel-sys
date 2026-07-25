"use client";

import { useActionState } from "react";

import { forgotPasswordAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState = { ok: false, message: "" };

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(forgotPasswordAction, initialState);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Forgot Password</CardTitle>
        <CardDescription>Send password reset instructions to the registered email.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          {state.message ? (
            <p className={state.ok ? "text-sm text-emerald-600" : "text-sm text-rose-600"}>
              {state.message}
            </p>
          ) : null}
          <Button className="w-full" disabled={isPending}>
            {isPending ? "Sending..." : "Send Reset Link"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
