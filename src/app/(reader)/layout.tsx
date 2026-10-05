import { redirect } from "next/navigation";

import { routes } from "@/shared/config/routes";
import { LocalStoreProvider } from "@/shared/offline/local-store";
import { getSessionUser } from "@/server/auth/session";

/** Lector a pantalla completa: sin barra lateral, pero con la misma base local del usuario. */
export default async function ReaderLayout({ children }: LayoutProps<"/">) {
  const user = await getSessionUser();
  if (!user) redirect(routes.login);
  return (
    <main id="contenido">
      <LocalStoreProvider userId={user.id}>{children}</LocalStoreProvider>
    </main>
  );
}
