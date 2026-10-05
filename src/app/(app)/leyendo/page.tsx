import type { Metadata } from "next";

import { ReadingList } from "@/features/reading/reading-list";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata: Metadata = { title: "Leyendo" };

export default function ReadingPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader eyebrow="Continúa" title="Leyendo" description="Tus lecturas recientes en todos tus dispositivos." />
      <ReadingList />
    </div>
  );
}
