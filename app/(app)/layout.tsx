import { redirect } from "next/navigation";
import { createClient } from "@/packages/supabase/server";

/**
 * Everything behind the door.
 *
 * The session is checked once, here, rather than on each page: every route in
 * this group is about somebody's own organization, and a page that renders its
 * own empty state for a visitor with no session is a page that has to remember
 * to. Row level security still decides what is visible — this only decides
 * whether there is anyone to show it to.
 */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return children;
}
