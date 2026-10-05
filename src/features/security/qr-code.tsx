"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";

import { Spinner } from "@/shared/ui/spinner";

/** QR generado en el navegador: la clave nunca se envía a un servicio externo de QR. */
export function QrCode({ value, label }: { value: string; label: string }) {
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    QRCode.toString(value, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#16161a", light: "#ffffff" } })
      .then((markup) => active && setSvg(markup))
      .catch(() => active && setSvg(null));
    return () => {
      active = false;
    };
  }, [value]);

  return (
    <div
      role="img"
      aria-label={label}
      className="flex size-52 items-center justify-center rounded-[var(--radius-panel)] border-2 border-line bg-white p-2 shadow-hard [&>svg]:h-full [&>svg]:w-full"
      // El SVG lo produce la librería a partir de nuestro propio enlace otpauth.
      dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
    >
      {svg ? undefined : <Spinner label="Generando código QR" />}
    </div>
  );
}
