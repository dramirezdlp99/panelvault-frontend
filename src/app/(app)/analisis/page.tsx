import type { Metadata } from "next";

import { AnalysisView } from "@/features/analysis/analysis-view";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata: Metadata = { title: "Análisis de viñetas" };

export default function AnalysisPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="Visión por computador"
        title="Análisis de página"
        description="Sube una página y el motor de IA detecta sus viñetas y el orden de lectura."
      />
      <AnalysisView />
    </div>
  );
}
