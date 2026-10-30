import "server-only";
import type { Home } from "@/lib/db/schema";
import { getCurrentHome } from "@/lib/session";

export type Profile = {
  id: string;
  name: string;
  email: string;
  /** Avatar URL (Vercel Blob) or null → show initials. */
  image: string | null;
  phone: string | null;
  timeZone: string;
};

/** Settings, sidebar user card, greeting: the home row plus the user's profile. */
export async function getHomeProfile(): Promise<{ home: Home; user: Profile; today: string }> {
  const { home, user, today, timeZone } = await getCurrentHome();
  return {
    home,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image ?? null,
      phone: user.phone ?? null,
      timeZone,
    },
    today,
  };
}
