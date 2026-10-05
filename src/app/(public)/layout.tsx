import { PublicFooter } from "@/shared/layout/public-footer";
import { PublicHeader } from "@/shared/layout/public-header";
import { ServiceWorkerRegistration } from "@/shared/offline/service-worker";

/** Estructura de las páginas públicas (portada, catálogo, ingreso): barra superior y pie. */
export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader />
      <main id="contenido" className="flex-1">
        {children}
      </main>
      <PublicFooter />
      <ServiceWorkerRegistration />
    </div>
  );
}
