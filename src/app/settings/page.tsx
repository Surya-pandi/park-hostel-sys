import { DashboardShell } from "@/components/app/dashboard-shell";
import { SettingsPanel } from "@/components/app/settings-panel";

export default function SettingsPage() {
  return (
    <DashboardShell
      role="student"
      title="Settings"
      description="Password management, theme preferences, and security defaults."
    >
      <SettingsPanel />
    </DashboardShell>
  );
}
