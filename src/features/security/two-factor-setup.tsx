"use client";

import { ShieldCheck } from "lucide-react";
import { useState } from "react";

import { errorMessage } from "@/shared/api/http";
import { Alert } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { CodeInput } from "@/shared/ui/code-input";
import { Spinner } from "@/shared/ui/spinner";

import { confirmTwoFactor, type TwoFactorSetup as SetupData } from "./api";
import { CopyButton } from "./copy-button";
import { groupSecret } from "./format";
import { QrCode } from "./qr-code";
import { RecoveryCodes } from "./recovery-codes";

function Step({ number, title, active, children }: { number: number; title: string; active: boolean; children: React.ReactNode }) {
  return (
    <li className={active ? "" : "opacity-50"}>
      <div className="flex items-center gap-3">
        <span className="inline-flex size-9 items-center justify-center rounded-[var(--radius-chip)] border-2 border-line bg-highlight font-mono font-bold text-on-highlight">
          {number}
        </span>
        <h3 className="font-display text-xl font-bold uppercase">{title}</h3>
      </div>
      {active ? <div className="mt-4 pl-0 sm:pl-12">{children}</div> : null}
    </li>
  );
}

/** Activación en 3 pasos: escanear el QR, confirmar un código y guardar los códigos de recuperación. */
export function TwoFactorSetupFlow({ setup, onFinished }: { setup: SetupData; onFinished: () => void }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [code, setCode] = useState("");
  const [codes, setCodes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);

  async function confirm(value: string) {
    if (pending || value.length !== 6) return;
    setPending(true);
    setError(null);
    try {
      const result = await confirmTwoFactor(value);
      setCodes(result.recoveryCodes);
      setStep(3);
    } catch (caught) {
      setError(errorMessage(caught));
      setCode("");
    } finally {
      setPending(false);
    }
  }

  return (
    <ol className="flex flex-col gap-8">
      <Step number={1} title="Escanea el código QR" active={step === 1}>
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <QrCode value={setup.otpauthUri} label="Código QR para tu app autenticadora" />
          <div className="flex flex-col gap-4">
            <p className="text-ink-muted">
              Ábrelo con una app autenticadora gratuita como Google Authenticator, Aegis o Authy. Si no puedes escanear,
              escribe esta clave a mano:
            </p>
            <code className="rounded-[var(--radius-panel)] border-2 border-line bg-surface-muted px-4 py-3 font-mono text-lg font-bold tracking-wider break-all">
              {groupSecret(setup.secret)}
            </code>
            <div className="flex flex-wrap gap-3">
              <CopyButton text={setup.secret} label="Copiar clave" />
              <Button size="sm" onClick={() => setStep(2)}>
                Ya lo escaneé
              </Button>
            </div>
          </div>
        </div>
      </Step>

      <Step number={2} title="Confirma el código" active={step === 2}>
        <div className="flex max-w-md flex-col gap-4">
          <p className="text-ink-muted">Escribe el código de 6 dígitos que muestra la app ahora mismo.</p>
          {error ? <Alert tone="error">{error}</Alert> : null}
          <CodeInput value={code} onChange={setCode} onComplete={(v) => void confirm(v)} disabled={pending} invalid={Boolean(error)} />
          <div className="flex gap-3">
            <Button variant="secondary" size="sm" onClick={() => setStep(1)} disabled={pending}>
              Volver
            </Button>
            <Button size="sm" onClick={() => void confirm(code)} disabled={pending || code.length !== 6}>
              {pending ? <Spinner label="Activando" /> : <ShieldCheck aria-hidden className="size-4" />}
              Activar
            </Button>
          </div>
        </div>
      </Step>

      <Step number={3} title="Guarda tus códigos de recuperación" active={step === 3}>
        <div className="flex max-w-xl flex-col gap-4">
          <RecoveryCodes codes={codes} />
          <label className="flex items-center gap-3 font-semibold">
            <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} className="size-5 accent-[var(--pv-accent)]" />
            Ya guardé mis códigos en un lugar seguro
          </label>
          <Button className="self-start" disabled={!saved} onClick={onFinished}>
            Terminar
          </Button>
        </div>
      </Step>
    </ol>
  );
}
