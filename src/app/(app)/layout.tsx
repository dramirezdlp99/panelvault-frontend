import { redirect } from "next/navigation";

import { AppShell } from "@/shared/layout/app-shell";
import { routes } from "@/shared/config/routes";
import { getSessionUser } from "@/server/auth/session";

/** Pantallas privadas. El proxy ya exigió sesión; aquí solo se obtiene el usuario para pintarlo. */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await getSessionUser();
  if (!user) redirect(routes.login);
  return <AppShell user={user}>{children}</AppShell>;
}
