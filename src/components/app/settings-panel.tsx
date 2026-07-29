"use client";

import { useActionState } from "react";

import { changePasswordAction } from "@/app/actions/auth";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState = { ok: false, message: "" };

export function SettingsPanel() {
  const [state, formAction, isPending] = useActionState(changePasswordAction, initialState);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Students are forced to change the default DD-MM-YYYY date-of-birth password.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current password</Label>
              <Input id="currentPassword" name="currentPassword" type="password" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New password</Label>
              <Input id="newPassword" name="newPassword" type="password" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" required />
            </div>
            {state.message ? (
              <p
                className={
                  state.ok
                    ? "text-sm text-emerald-600 md:col-span-2"
                    : "text-sm text-rose-600 md:col-span-2"
                }
              >
                {state.message}
              </p>
            ) : null}
            <Button className="md:col-span-2" disabled={isPending}>
              {isPending ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Device-level dashboard display controls.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="font-medium">Theme</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Light or dark mode</p>
          </div>
          <ThemeToggle />
        </CardContent>
      </Card>
    </div>
  );
}
