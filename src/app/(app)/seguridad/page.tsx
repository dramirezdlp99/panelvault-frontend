import type { Metadata } from "next";

import { SecurityPanel } from "@/features/security/security-panel";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata: Metadata = { title: "Seguridad" };

export default function SecurityPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader eyebrow="Tu cuenta" title="Seguridad" description="Protege tu cuenta con un segundo factor de verificación." />
      <SecurityPanel />
    </div>
  );
}
