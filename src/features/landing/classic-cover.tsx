import { WorkCover } from "@/features/catalog/work-cover";

import type { Classic } from "./content";

/** Portada de un clásico de la portada: reutiliza la portada tipográfica del catálogo. */
export function ClassicCover({ classic, className }: { classic: Classic; className?: string }) {
  return <WorkCover year={classic.year} publisher={classic.publisher} tone={classic.tone} className={className} />;
}
