import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthCard } from "@/features/auth/auth-card";
import { LoginForm } from "@/features/auth/login-form";
import { safeNext } from "@/features/auth/safe-next";
import { getSessionUser } from "@/server/auth/session";

export const metadata: Metadata = { title: "Iniciar sesión" };

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({ searchParams }: PageProps<"/ingresar">) {
  const next = firstValue((await searchParams).next);
  if (await getSessionUser()) redirect(safeNext(next));

  return (
    <AuthCard tag="Acceso" title="Iniciar sesión" subtitle="Accede a tu biblioteca de cómics">
      <LoginForm next={next} />
    </AuthCard>
  );
}
