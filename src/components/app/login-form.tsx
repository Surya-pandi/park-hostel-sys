"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ROLE_CONFIG } from "@/lib/constants";
import type { ActionState } from "@/lib/types";

const initialState: ActionState = { ok: false, message: "" };

export function LoginForm() {
  const router = useRouter();
  const [state, setState] = useState(initialState);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setState(initialState);

    try {
      const formData = new FormData(event.currentTarget);
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(Object.fromEntries(formData)),
      });
      const result = (await response.json()) as ActionState;

      setState(result);

      if (result.ok && result.redirectTo) {
        router.replace(result.redirectTo);
        router.refresh();
      }
    } catch {
      setState({ ok: false, message: "Login request failed. Check the server and try again." });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Secure Login</CardTitle>
        <CardDescription>
          Use college email. First-time student password is date of birth in DD-MM-YYYY format.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select id="role" name="role" defaultValue="student">
              {Object.values(ROLE_CONFIG).map((role) => (
                <option key={role.slug} value={role.slug}>
                  {role.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="student@pcet.ac.in" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" placeholder="DD-MM-YYYY" required />
          </div>
          {state.message ? (
            <p className={state.ok ? "text-sm text-emerald-600" : "text-sm text-rose-600"}>
              {state.message}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Signing in..." : "Sign in"}
          </Button>
        </form>
        <div className="mt-4 flex items-center justify-between text-sm">
          <Link href="/forgot-password" className="text-blue-600 hover:underline">
            Forgot password
          </Link>
          <Link href="/register" className="text-blue-600 hover:underline">
            Register student
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
