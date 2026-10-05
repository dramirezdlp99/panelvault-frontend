"use client";

import { CloudOff } from "lucide-react";

import { useOnlineStatus } from "@/shared/hooks/use-online-status";

/** Aviso a lo ancho cuando no hay red: la app sigue funcionando con lo guardado en el dispositivo. */
export function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;
  return (
    <div role="status" className="flex items-center justify-center gap-2 border-b-2 border-line bg-highlight px-4 py-2 text-center text-sm font-semibold text-on-highlight">
      <CloudOff aria-hidden className="size-4 shrink-0" />
      Sin conexión — tus cambios se guardan en este dispositivo y se sincronizarán al volver.
    </div>
  );
}
