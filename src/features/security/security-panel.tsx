"use client";

import { LogOut, ShieldAlert, ShieldCheck, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { logout } from "@/features/auth/api";
import { errorMessage } from "@/shared/api/http";
import { routes } from "@/shared/config/routes";
import { Alert } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Spinner } from "@/shared/ui/spinner";

import { beginTwoFactorSetup, getTwoFactorStatus, type TwoFactorSetup, type TwoFactorStatus } from "./api";
import { DisableTwoFactor } from "./disable-two-factor";
import { TwoFactorSetupFlow } from "./two-factor-setup";

type State =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; status: TwoFactorStatus }
  | { kind: "setup"; setup: TwoFactorSetup };

export function SecurityPanel() {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: "loading" });
  const [notice, setNotice] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  const load = useCallback(async () => {
    try {
      setState({ kind: "ready", status: await getTwoFactorStatus() });
    } catch (caught) {
      setState({ kind: "error", message: errorMessage(caught) });
    }
  }, []);

  useEffect(() => {
    // Carga inicial del estado del segundo factor (dato externo: el backend).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function start() {
    setStarting(true);
    setNotice(null);
    try {
      setState({ kind: "setup", setup: await beginTwoFactorSetup() });
    } catch (caught) {
      setNotice(errorMessage(caught));
    } finally {
      setStarting(false);
    }
  }

  async function signOut() {
    await logout().catch(() => null);
    router.replace(routes.home);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-8">
      <Card className="flex flex-col gap-6 p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheck aria-hidden className="size-7" />
            <h2 className="font-display text-2xl font-extrabold uppercase">Verificación en dos pasos</h2>
          </div>
          {state.kind === "ready" ? (
            <Badge tone={state.status.enabled ? "success" : "neutral"}>{state.status.enabled ? "Activada" : "Desactivada"}</Badge>
          ) : null}
        </div>

        {notice ? <Alert tone="error">{notice}</Alert> : null}
        {state.kind === "loading" ? <Spinner label="Cargando estado" /> : null}
        {state.kind === "error" ? (
          <Alert tone="error" title="No pudimos cargar tu configuración">
            {state.message}
          </Alert>
        ) : null}

        {state.kind === "ready" && !state.status.enabled ? (
          <div className="flex flex-col gap-4">
            <p className="max-w-2xl text-ink-muted">
              Además de tu contraseña, te pediremos un código de 6 dígitos que genera una app en tu celular. Así, aunque
              alguien conozca tu contraseña, no podrá entrar.
            </p>
            <Button className="self-start" onClick={start} disabled={starting}>
              {starting ? <Spinner label="Preparando" /> : <ShieldCheck aria-hidden className="size-4" />}
              Activar verificación
            </Button>
          </div>
        ) : null}

        {state.kind === "setup" ? (
          <TwoFactorSetupFlow
            setup={state.setup}
            onFinished={() => {
              setNotice(null);
              setState({ kind: "loading" });
              void load();
            }}
          />
        ) : null}

        {state.kind === "ready" && state.status.enabled ? (
          <div className="flex flex-col gap-4">
            <p className="text-ink-muted">
              Tu cuenta pide un código de la app autenticadora al iniciar sesión.
            </p>
            {state.status.recoveryCodesRemaining <= 2 ? (
              <Alert tone="warning" title="Te quedan pocos códigos de recuperación">
                Quedan {state.status.recoveryCodesRemaining}. Desactiva y vuelve a activar la verificación para generar nuevos.
              </Alert>
            ) : (
              <p className="font-mono text-sm uppercase text-ink-muted">
                Códigos de recuperación disponibles: {state.status.recoveryCodesRemaining}
              </p>
            )}
          </div>
        ) : null}
      </Card>

      {state.kind === "ready" && state.status.enabled ? (
        <Card className="flex flex-col gap-4 border-accent p-6 sm:p-8">
          <div className="flex items-center gap-3 text-accent">
            <TriangleAlert aria-hidden className="size-6" />
            <h2 className="font-display text-xl font-extrabold uppercase">Zona de peligro</h2>
          </div>
          <p className="text-ink-muted">
            Desactivar la verificación en dos pasos hace tu cuenta menos segura. Confirma con un código.
          </p>
          <DisableTwoFactor
            onDisabled={() => {
              setNotice(null);
              setState({ kind: "loading" });
              void load();
            }}
          />
        </Card>
      ) : null}

      <Card className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div className="flex items-center gap-3">
          <ShieldAlert aria-hidden className="size-6" />
          <div>
            <h2 className="font-display text-xl font-extrabold uppercase">Sesión</h2>
            <p className="text-ink-muted">Cierra la sesión en este navegador. Los cómics descargados siguen en el dispositivo.</p>
          </div>
        </div>
        <Button variant="secondary" onClick={signOut}>
          <LogOut aria-hidden className="size-4" />
          Cerrar sesión
        </Button>
      </Card>
    </div>
  );
}
