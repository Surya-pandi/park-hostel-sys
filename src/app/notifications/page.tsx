import { DashboardShell } from "@/components/app/dashboard-shell";
import { NotificationsList } from "@/components/app/notifications-list";
import { getCurrentProfileData, getNotificationsData } from "@/lib/live-data";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const [profile, notifications] = await Promise.all([
    getCurrentProfileData(),
    getNotificationsData(),
  ]);

  return (
    <DashboardShell
      role={profile?.role ?? "student"}
      title="Notifications"
      description="Role-targeted student, warden, AO, director, and all-hostel notifications."
    >
      <NotificationsList items={notifications} />
    </DashboardShell>
  );
}
