import type { Metadata } from "next";

import { WorkEditor } from "@/features/curation/work-editor";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata: Metadata = { title: "Editar obra" };

export default async function EditWorkPage({ params }: PageProps<"/curaduria/[id]">) {
  const { id } = await params;
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader eyebrow="Curaduría" title="Editar obra" />
      <WorkEditor id={id} />
    </div>
  );
}
