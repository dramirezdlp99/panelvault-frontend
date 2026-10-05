import type { Metadata } from "next";
import { Suspense } from "react";

import { ReaderPage } from "@/features/reader/reader";

export const metadata: Metadata = { title: "Lector" };

/** El id del cómic va en la query y se lee en el navegador: la página sirve sin conexión. */
export default function LectorPage() {
  return (
    <Suspense fallback={null}>
      <ReaderPage />
    </Suspense>
  );
}
