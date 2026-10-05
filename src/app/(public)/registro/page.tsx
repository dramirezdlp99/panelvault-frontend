import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthCard } from "@/features/auth/auth-card";
import { RegisterForm } from "@/features/auth/register-form";
import { routes } from "@/shared/config/routes";
import { getSessionUser } from "@/server/auth/session";

export const metadata: Metadata = { title: "Crear cuenta" };

export default async function RegisterPage() {
  if (await getSessionUser()) redirect(routes.library);
  return (
    <AuthCard tag="Nuevo lector" title="Crear cuenta" subtitle="Tu biblioteca personal, en cualquier dispositivo">
      <RegisterForm />
    </AuthCard>
  );
}
