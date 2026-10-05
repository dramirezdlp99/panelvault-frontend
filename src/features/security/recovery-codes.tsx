"use client";

import { Download } from "lucide-react";

import { Alert } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";

import { CopyButton } from "./copy-button";
import { recoveryCodesFile } from "./format";

function download(codes: string[]) {
  const url = URL.createObjectURL(new Blob([recoveryCodesFile(codes)], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "panelvault-codigos-recuperacion.txt";
  link.click();
  URL.revokeObjectURL(url);
}

/** Muestra los códigos de recuperación (el backend solo los entrega una vez). */
export function RecoveryCodes({ codes }: { codes: string[] }) {
  return (
    <div className="flex flex-col gap-4">
      <Alert tone="warning" title="Solo se muestran una vez">
        Si pierdes el celular, estos códigos son la única forma de entrar. Guárdalos fuera de este dispositivo.
      </Alert>
      <ol className="grid grid-cols-2 gap-2 rounded-[var(--radius-panel)] border-2 border-line bg-surface-muted p-4 sm:grid-cols-2">
        {codes.map((code) => (
          <li key={code} className="rounded-[var(--radius-chip)] border border-line/30 bg-surface px-3 py-2 text-center font-mono text-sm font-bold tracking-wider">
            {code}
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap gap-3">
        <CopyButton text={codes.join("\n")} label="Copiar códigos" />
        <Button variant="secondary" size="sm" onClick={() => download(codes)}>
          <Download aria-hidden className="size-4" />
          Descargar .txt
        </Button>
      </div>
    </div>
  );
}
