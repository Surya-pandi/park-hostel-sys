"use client";

import { useActionState } from "react";

import { registerStudentAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { BLOOD_GROUPS, DEPARTMENTS, HOSTELS, SHARING_OPTIONS, YEARS } from "@/lib/constants";

const initialState = { ok: false, message: "" };

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(registerStudentAction, initialState);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Student Registration</CardTitle>
        <CardDescription>
          Creates profile, student record, hostel assignment, and first-login password policy.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input id="fullName" name="fullName" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Input id="dateOfBirth" name="dateOfBirth" type="date" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="year">Year</Label>
            <Select id="year" name="year" defaultValue="I">
              {YEARS.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Select id="department" name="department" defaultValue="IT">
              {DEPARTMENTS.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="hostel">Hostel</Label>
            <Select id="hostel" name="hostel" defaultValue="MKG Boys Hostel">
              {HOSTELS.map((hostel) => (
                <option key={hostel} value={hostel}>
                  {hostel}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="roomNumber">Room Number</Label>
            <Input id="roomNumber" name="roomNumber" placeholder="B-214" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sharing">Sharing</Label>
            <Select id="sharing" name="sharing" defaultValue="3 Sharing">
              {SHARING_OPTIONS.map((sharing) => (
                <option key={sharing} value={sharing}>
                  {sharing}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bloodGroup">Blood Group</Label>
            <Select id="bloodGroup" name="bloodGroup" defaultValue="" required>
              <option value="" disabled>
                Select blood group
              </option>
              {BLOOD_GROUPS.map((bloodGroup) => (
                <option key={bloodGroup} value={bloodGroup}>
                  {bloodGroup}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="studentPhone">Student Phone</Label>
            <Input id="studentPhone" name="studentPhone" type="tel" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="parentPhone">Parent Phone</Label>
            <Input id="parentPhone" name="parentPhone" type="tel" required />
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
          <Button type="submit" className="md:col-span-2" disabled={isPending}>
            {isPending ? "Registering..." : "Register Student"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
