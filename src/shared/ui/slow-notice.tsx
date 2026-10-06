"use client";

import { useEffect, useMemo, useState } from "react";

/**
 * Si una acción tarda más de lo normal, explica por qué: en el plan gratuito el
 * servidor se duerme y su primer arranque toma cerca de un minuto.
 */
export function SlowNotice({ active, afterMs = 5000 }: { active: boolean; afterMs?: number }) {
  // Cada vez que la acción empieza nace una "ficha" nueva; el aviso solo se muestra si el
  // temporizador de ESA ficha alcanzó a cumplirse (así no hace falta reiniciar estado a mano).
  const run = useMemo(() => (active ? {} : null), [active]);
  const [expiredRun, setExpiredRun] = useState<object | null>(null);

  useEffect(() => {
    if (!run) return;
    const timer = window.setTimeout(() => setExpiredRun(run), afterMs);
    return () => window.clearTimeout(timer);
  }, [run, afterMs]);

  const visible = run !== null && expiredRun === run;
  if (!visible) return null;
  return (
    <p role="status" className="rounded-[var(--radius-chip)] border-2 border-dashed border-line/40 px-3 py-2 text-center text-sm text-ink-muted">
      El servidor se está despertando (plan gratuito). La primera vez puede tardar hasta un minuto.
    </p>
  );
}
