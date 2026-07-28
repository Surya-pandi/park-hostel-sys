import { DashboardShell } from "@/components/app/dashboard-shell";
import { FoodMenuPanel } from "@/components/app/food-menu-panel";
import { getFoodMenuPageData } from "@/lib/food-menu-data";

export const dynamic = "force-dynamic";

function pageDescription(scope: string) {
  if (scope === "warden") {
    return "Submit seven-day hostel food menus for director approval and track review status.";
  }

  if (scope === "director") {
    return "Review weekly hostel food menu submissions and approve the menus students can see.";
  }

  return "View approved weekly hostel food menus.";
}

export default async function FoodMenuPage() {
  const data = await getFoodMenuPageData();

  return (
    <DashboardShell
      role={data.profile?.role ?? "student"}
      title="Food Menu"
      description={pageDescription(data.scope)}
    >
      <FoodMenuPanel data={data} />
    </DashboardShell>
  );
}
