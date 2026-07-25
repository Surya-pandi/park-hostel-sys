import { Droplet, Mail, Phone, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Profile, Student } from "@/lib/types";

type ProfileCardProps = {
  profile: Profile;
  student?: Student;
};

export function ProfileCard({ profile, student }: ProfileCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
          <div className="grid size-20 shrink-0 place-items-center rounded-lg bg-blue-600 text-2xl font-semibold text-white">
            {profile.avatarInitials}
          </div>
          <div className="min-w-0 flex-1 space-y-4">
            <div>
              <h2 className="break-words text-lg font-semibold sm:text-xl">{student?.fullName ?? profile.fullName}</h2>
              <p className="break-words text-sm text-slate-500 dark:text-slate-400">{profile.email}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge>{profile.role}</Badge>
                {profile.forcePasswordChange ? <Badge variant="warning">Password change required</Badge> : null}
              </div>
            </div>
            {student ? (
              <div className="grid gap-3 md:grid-cols-2">
                <Info label="Admission No" value={student.admissionNo} />
                <Info label="Department" value={`${student.department} - ${student.year} Year`} />
                <Info label="Hostel" value={student.hostel} />
                <Info label="Room" value={`${student.roomNumber} (${student.sharing})`} />
                <Info label="Blood Group" value={student.bloodGroup ?? "Not set"} icon={Droplet} />
                <Info label="Student Phone" value={student.studentPhone} icon={Phone} />
                <Info label="Parent Phone" value={student.parentPhone} icon={Phone} />
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                <Info label="Email" value={profile.email} icon={Mail} />
                <Info label="Role" value={profile.role} icon={UserRound} />
              </div>
            )}
            {student ? (
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium">Attendance Percentage</span>
                  <span>{student.attendancePercentage}%</span>
                </div>
                <Progress value={student.attendancePercentage} />
              </div>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Info({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: typeof Mail;
}) {
  return (
    <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
      <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-normal text-slate-500 dark:text-slate-400">
        {Icon ? <Icon className="size-3.5" /> : null}
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-medium">{value}</p>
    </div>
  );
}
