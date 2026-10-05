"use client";

import { LogIn } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { ApiRequestError, errorMessage } from "@/shared/api/http";
import { routes } from "@/shared/config/routes";
import { Alert } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Field } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { PasswordInput } from "@/shared/ui/password-input";
import { Spinner } from "@/shared/ui/spinner";

import { login } from "./api";
import { safeNext } from "./safe-next";
import { normalizeEmail, validateEmail } from "./validation";

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const destination = safeNext(next);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [error, setError] = useState<{ tone: "error" | "warning"; text: string } | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const invalidEmail = validateEmail(email);
    setEmailError(invalidEmail);
    if (invalidEmail || !password) {
      if (!password) setError({ tone: "error", text: "Escribe tu contraseña." });
      return;
    }

    setPending(true);
    setError(null);
    try {
      const reply = await login(normalizeEmail(email), password);
      if (reply.status === "TWO_FACTOR_REQUIRED") {
        router.push(`${routes.twoFactor}?next=${encodeURIComponent(destination)}`);
        return;
      }
      router.replace(destination);
      router.refresh();
    } catch (caught) {
      setPassword("");
      const tooMany = caught instanceof ApiRequestError && caught.status === 429;
      setError({ tone: tooMany ? "warning" : "error", text: errorMessage(caught) });
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {error ? (
        <Alert tone={error.tone} title={error.tone === "warning" ? "Espera un momento" : "No pudimos iniciar sesión"}>
          {error.text}
        </Alert>
      ) : null}

      <Field label="Correo electrónico" error={emailError}>
        <Input
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@correo.com"
          required
        />
      </Field>

      <Field label="Contraseña">
        <PasswordInput
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </Field>

      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? <Spinner label="Ingresando" /> : <LogIn aria-hidden className="size-5" />}
        Entrar
      </Button>

      <p className="border-t-2 border-dashed border-line/20 pt-5 text-center text-ink-muted">
        ¿No tienes cuenta?{" "}
        <Link href={routes.register} className="font-display font-bold uppercase text-accent underline-offset-4 hover:underline">
          Crear cuenta
        </Link>
      </p>
    </form>
  );
}
