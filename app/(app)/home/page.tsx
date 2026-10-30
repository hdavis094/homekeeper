import React from "react";
import { HomeDashboardView } from "@/app/ui/home/dashboard-view";
import { buildHomeViewModel } from "@/app/ui/home/view-model";
import { listItemOptions } from "@/lib/data/items";
import { getDashboard } from "@/lib/data/stats";
import { listUpcomingTasks } from "@/lib/data/tasks";
import { getCurrentHome } from "@/lib/session";

export default async function HomePage() {
  const [{ user }, dashboard, upcomingTasks, itemOptions] = await Promise.all([
    getCurrentHome(),
    getDashboard(),
    listUpcomingTasks(5),
    listItemOptions(),
  ]);

  const viewModel = buildHomeViewModel({
    userName: user.name,
    dashboard,
    upcomingTasks,
    itemCount: itemOptions.length,
  });

  return (
    <HomeDashboardView
      viewModel={viewModel}
      user={{ name: user.name, image: user.image ?? null }}
    />
  );
}
