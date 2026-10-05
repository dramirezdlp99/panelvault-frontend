"use client";

import { useEffect, useState } from "react";

/** URL temporal para mostrar un Blob en <img>; se libera al cambiar o desmontar para no gastar memoria. */
export function useBlobUrl(blob: Blob | null | undefined): string | null {
  const [entry, setEntry] = useState<{ blob: Blob; url: string } | null>(null);

  useEffect(() => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    // La URL se crea fuera de React (API del navegador) y se guarda para pintarla.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEntry({ blob, url });
    return () => URL.revokeObjectURL(url);
  }, [blob]);

  // Solo se usa la URL si corresponde al Blob actual (evita mostrar una revocada).
  return blob && entry?.blob === blob ? entry.url : null;
}
