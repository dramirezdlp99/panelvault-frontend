"use client";

import { KeyRound, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { ApiRequestError, errorMessage } from "@/shared/api/http";
import { routes } from "@/shared/config/routes";
import { Alert } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { CodeInput } from "@/shared/ui/code-input";
import { Field } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Spinner } from "@/shared/ui/spinner";

import { verifyTwoFactor } from "./api";
import { safeNext } from "./safe-next";

type Mode = "app" | "recovery";

export function TwoFactorForm({ next }: { next?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("app");
  const [code, setCode] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [error, setError] = useState<{ tone: "error" | "warning"; text: string; expired?: boolean } | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(value: string) {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      await verifyTwoFactor(value);
      router.replace(safeNext(next));
      router.refresh();
    } catch (caught) {
      const status = caught instanceof ApiRequestError ? caught.status : 0;
      const expired = caught instanceof ApiRequestError && caught.code === "auth.challenge_invalid";
      setError({ tone: status === 429 ? "warning" : "error", text: errorMessage(caught), expired });
      setCode("");
      setPending(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = mode === "app" ? code : recoveryCode.trim();
    if (mode === "app" && value.length !== 6) {
      setError({ tone: "error", text: "Escribe los 6 dígitos del código." });
      return;
    }
    if (mode === "recovery" && !value) {
      setError({ tone: "error", text: "Escribe uno de tus códigos de recuperación." });
      return;
    }
    void submit(value);
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setCode("");
    setRecoveryCode("");
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      {error ? (
        <Alert tone={error.tone} title={error.tone === "warning" ? "Demasiados intentos" : "Código no válido"}>
          {error.text}
          {error.expired ? (
            <>
              {" "}
              <Link href={routes.login} className="font-bold underline">
                Volver a iniciar sesión
              </Link>
            </>
          ) : null}
        </Alert>
      ) : null}

      {mode === "app" ? (
        <>
          <p className="text-center text-ink-muted">Escribe el código de 6 dígitos de tu app autenticadora.</p>
          <CodeInput value={code} onChange={setCode} onComplete={(v) => void submit(v)} disabled={pending} invalid={Boolean(error)} />
        </>
      ) : (
        <Field label="Código de recuperación" hint="Cada código de recuperación sirve una sola vez.">
          <Input
            name="recoveryCode"
            autoComplete="off"
            value={recoveryCode}
            onChange={(e) => setRecoveryCode(e.target.value)}
            className="font-mono uppercase tracking-widest"
            maxLength={20}
          />
        </Field>
      )}

      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? <Spinner label="Verificando" /> : <ShieldCheck aria-hidden className="size-5" />}
        Verificar
      </Button>

      <button
        type="button"
        onClick={() => switchMode(mode === "app" ? "recovery" : "app")}
        className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-accent underline-offset-4 hover:underline"
      >
        <KeyRound aria-hidden className="size-4" />
        {mode === "app" ? "Usar un código de recuperación" : "Usar la app autenticadora"}
      </button>
    </form>
  );
}
