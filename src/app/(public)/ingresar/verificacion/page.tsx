import type { Metadata } from "next";

import { AuthCard } from "@/features/auth/auth-card";
import { TwoFactorForm } from "@/features/auth/two-factor-form";

export const metadata: Metadata = { title: "Verificación en dos pasos" };

export default async function TwoFactorPage({ searchParams }: PageProps<"/ingresar/verificacion">) {
  const raw = (await searchParams).next;
  const next = Array.isArray(raw) ? raw[0] : raw;
  return (
    <AuthCard tag="Paso 2 de 2" title="Verificación en dos pasos">
      <TwoFactorForm next={next} />
    </AuthCard>
  );
}
