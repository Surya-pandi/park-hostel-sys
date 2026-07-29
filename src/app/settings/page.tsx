import { DashboardShell } from "@/components/app/dashboard-shell";
import { SettingsPanel } from "@/components/app/settings-panel";
import { getCurrentProfileData } from "@/lib/live-data";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const profile = await getCurrentProfileData();

  return (
    <DashboardShell
      role={profile?.role ?? "student"}
      title="Settings"
      description="Password management, theme preferences, and security defaults."
    >
      <SettingsPanel />
    </DashboardShell>
  );
}
