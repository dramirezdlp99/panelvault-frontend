import { Plus } from "lucide-react";
import type { Metadata } from "next";

import { CurationList } from "@/features/curation/curation-list";
import { routes } from "@/shared/config/routes";
import { ButtonLink } from "@/shared/ui/button";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata: Metadata = { title: "Curaduría" };

export default function CurationPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="Curadores"
        title="Curaduría"
        description="Administra las obras del catálogo público: borradores, publicación y edición."
        actions={
          <ButtonLink href={routes.curationNew}>
            <Plus aria-hidden className="size-4" />
            Nueva obra
          </ButtonLink>
        }
      />
      <CurationList />
    </div>
  );
}
