import type { Metadata } from "next";

import { BookmarksView } from "@/features/bookmarks/bookmarks-view";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata: Metadata = { title: "Marcadores" };

export default function BookmarksPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader eyebrow="Guardados" title="Marcadores" description="Las páginas que marcaste, agrupadas por cómic." />
      <BookmarksView />
    </div>
  );
}
