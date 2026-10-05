"use client";

import { CloudCheck, CloudOff, RefreshCw } from "lucide-react";

import { useOnlineStatus } from "@/shared/hooks/use-online-status";
import { useLocalStore } from "@/shared/offline/local-store";
import { Badge } from "@/shared/ui/badge";

/** Estado de la sincronización: al día, pendientes o sin conexión. */
export function SyncStatus() {
  const { sync } = useLocalStore();
  const online = useOnlineStatus();
  if (sync.unsupported) return <Badge tone="accent">Este navegador no permite guardar cómics</Badge>;
  if (!online && sync.pending > 0) {
    return (
      <Badge tone="highlight">
        <CloudOff aria-hidden className="size-3" />
        {sync.pending} {sync.pending === 1 ? "cambio pendiente" : "cambios pendientes"}
      </Badge>
    );
  }
  if (sync.syncing || sync.pending > 0) {
    return (
      <Badge tone="ai">
        <RefreshCw aria-hidden className="size-3 animate-spin" />
        Sincronizando
      </Badge>
    );
  }
  return (
    <Badge tone="success">
      <CloudCheck aria-hidden className="size-3" />
      Sincronizado
    </Badge>
  );
}
