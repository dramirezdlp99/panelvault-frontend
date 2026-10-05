import type { Metadata } from "next";

import { WorkForm } from "@/features/curation/work-form";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata: Metadata = { title: "Nueva obra" };

export default function NewWorkPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader eyebrow="Curaduría" title="Nueva obra" description="Las obras nuevas quedan como borrador hasta que las publiques." />
      <WorkForm />
    </div>
  );
}
