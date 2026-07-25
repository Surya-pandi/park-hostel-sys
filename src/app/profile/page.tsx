import { DashboardShell } from "@/components/app/dashboard-shell";
import { ProfileCard } from "@/components/app/profile-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getStudentDashboardData } from "@/lib/live-data";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const data = await getStudentDashboardData();

  return (
    <DashboardShell
      role={data.profile?.role ?? "student"}
      title="Profile"
      description="Student identity, hostel allocation, contact details, attendance percentage, and first-login password status."
    >
      <div className="space-y-5">
        {data.profile ? (
          <ProfileCard profile={data.profile} student={data.student ?? undefined} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No profile found</CardTitle>
              <CardDescription>Sign in with an account that has a row in public.profiles.</CardDescription>
            </CardHeader>
          </Card>
        )}
        <Card>
          <CardHeader>
            <CardTitle>Account Security</CardTitle>
            <CardDescription>Authentication and server-side verification state.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            {["JWT authentication", "Role based access", "Audit logging"].map((item) => (
              <div key={item} className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                <p className="font-medium">{item}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Supabase</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
