"use client";

import { useEffect, useState } from "react";

import { DB_CHANGED_EVENT, type LocalDb } from "./db";

export type DbQuery<T> = { data: T | undefined; loading: boolean; error: unknown };

/**
 * Lee de la base local y vuelve a leer cuando algo cambia (importar, borrar, sincronizar).
 * Es una "consulta viva" sencilla: las escrituras disparan DB_CHANGED_EVENT.
 */
export function useDbQuery<T>(db: LocalDb | null, load: (db: LocalDb) => Promise<T>, deps: unknown[]): DbQuery<T> {
  const [state, setState] = useState<DbQuery<T>>({ data: undefined, loading: true, error: null });

  useEffect(() => {
    if (!db) return;
    let active = true;
    const run = () =>
      load(db).then(
        (data) => active && setState({ data, loading: false, error: null }),
        (error: unknown) => active && setState((s) => ({ ...s, loading: false, error })),
      );
    void run();
    window.addEventListener(DB_CHANGED_EVENT, run);
    return () => {
      active = false;
      window.removeEventListener(DB_CHANGED_EVENT, run);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, ...deps]);

  return state;
}
