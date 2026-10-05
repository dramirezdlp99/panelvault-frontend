"use client";

import { ShieldOff } from "lucide-react";
import { useState, type FormEvent } from "react";

import { errorMessage } from "@/shared/api/http";
import { Button } from "@/shared/ui/button";
import { Field } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Spinner } from "@/shared/ui/spinner";

import { disableTwoFactor } from "./api";

/** Zona de peligro: desactivar el segundo factor exige un código válido. */
export function DisableTwoFactor({ onDisabled }: { onDisabled: () => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!code.trim()) {
      setError("Escribe un código para confirmar.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      await disableTwoFactor(code.trim());
      onDisabled();
    } catch (caught) {
      setError(errorMessage(caught));
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <div className="flex-1">
        <Field label="Código de la app o de recuperación" error={error}>
          <Input value={code} onChange={(e) => setCode(e.target.value)} autoComplete="one-time-code" className="font-mono tracking-widest" maxLength={20} />
        </Field>
      </div>
      <Button type="submit" disabled={pending} className="sm:mb-[2px]">
        {pending ? <Spinner label="Desactivando" /> : <ShieldOff aria-hidden className="size-4" />}
        Desactivar
      </Button>
    </form>
  );
}
