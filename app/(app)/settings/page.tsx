import { PageHeader } from "@/app/ui/page-header";
import { Settings } from "@/app/ui/settings/settings";
import { getHomeProfile } from "@/lib/data/home";

export default async function SettingsPage() {
  const { home, user } = await getHomeProfile();
  return (
    <>
      <PageHeader title="Settings" subtitle="Manage your account, home details, and preferences." />
      <Settings home={home} user={user} />
    </>
  );
}
