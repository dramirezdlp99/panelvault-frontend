import type { Metadata } from "next";
import { Suspense } from "react";

import { LibraryView } from "@/features/library/library-view";
import { Spinner } from "@/shared/ui/spinner";

export const metadata: Metadata = { title: "Biblioteca" };

/** Renderizado en el cliente: los datos están en IndexedDB del dispositivo (offline-first). */
export default function LibraryPage() {
  return (
    <Suspense fallback={<Spinner label="Cargando biblioteca" />}>
      <LibraryView />
    </Suspense>
  );
}
