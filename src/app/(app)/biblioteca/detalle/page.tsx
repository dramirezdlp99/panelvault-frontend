import type { Metadata } from "next";
import { Suspense } from "react";

import { ComicDetailPage } from "@/features/library/comic-detail";
import { Spinner } from "@/shared/ui/spinner";

export const metadata: Metadata = { title: "Detalle del cómic" };

/**
 * El id va en la query (?id=) y se lee en el navegador: así esta página es la misma para
 * todos los cómics y el service worker puede servirla sin conexión para cualquiera de ellos.
 */
export default function ComicPage() {
  return (
    <Suspense fallback={<Spinner label="Cargando cómic" />}>
      <ComicDetailPage />
    </Suspense>
  );
}
