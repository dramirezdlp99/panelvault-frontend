"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

import { api } from "@/shared/api/http";
import { TabHub } from "@/shared/browser/tab-hub";

import { DB_CHANGED_EVENT, notifyDbChanged, openLocalDb, setDbChangeRelay, type LocalDb } from "./db";
import { countPending, OUTBOX_EVENT } from "./outbox";
import { flushOutbox, type FlushResult } from "./sync-engine";
import type { OutboxOp } from "./types";

export type SyncState = {
  pending: number;
  syncing: boolean;
  lastResult: FlushResult | null;
  /** El navegador no permite IndexedDB (modo privado estricto, almacenamiento bloqueado...). */
  unsupported: boolean;
};

type LocalStoreValue = {
  db: LocalDb | null;
  sync: SyncState;
  flush: () => Promise<void>;
  /** Canal con las demás pestañas del usuario (null hasta montar en el navegador). */
  hub: TabHub | null;
  /** Pestañas de PanelVault abiertas con esta cuenta. */
  tabs: number;
};

const LocalStoreContext = createContext<LocalStoreValue | null>(null);

/** Cada 60 s se reintenta lo pendiente aunque no haya eventos de red. */
const RETRY_INTERVAL_MS = 60_000;

export const sendOp = (op: OutboxOp) => api(op.path, { method: op.method, json: op.body ?? undefined });

/**
 * Abre la base local del usuario y mantiene sincronizada la bandeja de salida:
 * al montar, al volver la conexión, al encolar algo nuevo y cada minuto.
 */
export function LocalStoreProvider({ userId, children }: { userId: string; children: ReactNode }) {
  const [db, setDb] = useState<LocalDb | null>(null);
  const [sync, setSync] = useState<SyncState>({ pending: 0, syncing: false, lastResult: null, unsupported: false });
  const running = useRef(false);
  const [hub, setHub] = useState<TabHub | null>(null);
  const [tabs, setTabs] = useState(1);

  // Sincronización multi-pestaña: lo que cambia aquí se avisa a las demás pestañas y viceversa.
  useEffect(() => {
    let created: TabHub;
    try {
      created = new TabHub(`panelvault-${userId}`);
    } catch {
      return;
    }
    setDbChangeRelay(() => created.publish({ type: "db-changed" }));
    const offMessages = created.subscribe((message) => {
      if (message.type === "db-changed") notifyDbChanged({ remote: true });
    });
    const offCount = created.onTabCount(setTabs);
    // El canal es un sistema externo (Shared Worker / BroadcastChannel) que solo existe en el navegador.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHub(created);
    return () => {
      offMessages();
      offCount();
      setDbChangeRelay(null);
      created.close();
    };
  }, [userId]);

  useEffect(() => {
    let active = true;
    let opened: LocalDb | null = null;
    openLocalDb(userId)
      .then((database) => {
        opened = database;
        if (active) setDb(database);
        else database.close();
      })
      .catch(() => active && setSync((s) => ({ ...s, unsupported: true })));
    return () => {
      active = false;
      opened?.close();
    };
  }, [userId]);

  const flush = useCallback(async () => {
    if (!db || running.current) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setSync((s) => ({ ...s, syncing: false }));
      return;
    }
    running.current = true;
    setSync((s) => ({ ...s, syncing: true }));
    const run = async () => {
      const result = await flushOutbox(db, sendOp);
      setSync((s) => ({ ...s, syncing: false, pending: result.remaining, lastResult: result }));
    };
    try {
      // Web Locks: si otra pestaña ya está enviando la bandeja de salida, esta no la repite
      // (evita peticiones duplicadas entre pestañas).
      const locks = typeof navigator !== "undefined" ? navigator.locks : undefined;
      if (locks) {
        await locks.request(`panelvault-outbox-${userId}`, { ifAvailable: true }, async (lock) => {
          if (lock) await run();
          else setSync((s) => ({ ...s, syncing: false }));
        });
      } else {
        await run();
      }
    } catch {
      setSync((s) => ({ ...s, syncing: false }));
    } finally {
      running.current = false;
    }
  }, [db, userId]);

  useEffect(() => {
    if (!db) return;
    const refreshCount = () => void countPending(db).then((pending) => setSync((s) => ({ ...s, pending })));
    const onOutbox = () => {
      refreshCount();
      void flush();
    };
    onOutbox();
    window.addEventListener("online", onOutbox);
    window.addEventListener(OUTBOX_EVENT, onOutbox);
    window.addEventListener(DB_CHANGED_EVENT, refreshCount);
    const timer = window.setInterval(() => void flush(), RETRY_INTERVAL_MS);
    return () => {
      window.removeEventListener("online", onOutbox);
      window.removeEventListener(OUTBOX_EVENT, onOutbox);
      window.removeEventListener(DB_CHANGED_EVENT, refreshCount);
      window.clearInterval(timer);
    };
  }, [db, flush]);

  return <LocalStoreContext.Provider value={{ db, sync, flush, hub, tabs }}>{children}</LocalStoreContext.Provider>;
}

export function useLocalStore(): LocalStoreValue {
  const value = useContext(LocalStoreContext);
  if (!value) throw new Error("useLocalStore debe usarse dentro de LocalStoreProvider");
  return value;
}
