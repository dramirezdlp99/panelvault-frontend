import type { Metadata } from "next";

import { LabView } from "@/features/lab/lab-view";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata: Metadata = { title: "Laboratorio del navegador" };

/** CSR: todo lo que se muestra aquí ocurre en el navegador (hilos, memoria compartida, INP). */
export default function LabPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="Motor del navegador"
        title="Laboratorio"
        description="Event Loop, Web Workers, Shared Worker, memoria compartida e INP, funcionando en vivo dentro de PanelVault."
      />
      <LabView />
    </div>
  );
}
