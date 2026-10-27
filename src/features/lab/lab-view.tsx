"use client";

import { Activity, Cpu, Gauge, Lock, LockOpen, Play, Square, Timer, Unplug } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";

import { cn } from "@/shared/lib/cn";
import { useLocalStore } from "@/shared/offline/local-store";
import { getInpMonitor, GOOD_MS, rate, type Interaction } from "@/shared/performance/inp";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";

import { busyBlock, runEventLoopDemo, type LoopStep } from "./event-loop";
import { LAB_CHANNEL, SLOT_CANCEL, SLOT_UNBLOCK, SLOT_WAKE, type LabMessage } from "./lab-protocol";

const newWorker = () => new Worker(new URL("./lab.worker.ts", import.meta.url), { type: "module" });
const canShare = () => typeof SharedArrayBuffer !== "undefined" && globalThis.crossOriginIsolated === true;
const noopSubscribe = () => () => {};
/** En el servidor siempre es false; en el navegador se lee sin provocar diferencias de hidratación. */
const useCanShare = () => useSyncExternalStore(noopSubscribe, canShare, () => false);
const sharedState = () => new Int32Array(new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * 3));

function Section({ icon: Icon, title, children }: { icon: typeof Cpu; title: string; children: ReactNode }) {
  return (
    <Card className="flex flex-col gap-4 p-6">
      <h2 className="flex items-center gap-2 font-display text-xl font-extrabold uppercase">
        <Icon aria-hidden className="size-5" />
        {title}
      </h2>
      {children}
    </Card>
  );
}

/* ---------- 1. Estado del navegador ---------- */

function BrowserStatus() {
  const { hub, tabs } = useLocalStore();
  const [info, setInfo] = useState<Array<[string, boolean | string]>>([]);

  useEffect(() => {
    const id = window.setTimeout(() =>
      setInfo([
        ["crossOriginIsolated", globalThis.crossOriginIsolated === true],
        ["SharedArrayBuffer", typeof SharedArrayBuffer !== "undefined"],
        ["Web Worker", typeof Worker !== "undefined"],
        ["Shared Worker", typeof SharedWorker !== "undefined"],
        ["BroadcastChannel", typeof BroadcastChannel !== "undefined"],
        ["Service Worker activo", Boolean(navigator.serviceWorker?.controller)],
        ["Web Locks", Boolean(navigator.locks)],
      ]),
    );
    return () => window.clearTimeout(id);
  }, []);

  return (
    <Section icon={Cpu} title="Estado del navegador">
      <ul className="grid gap-2 sm:grid-cols-2">
        {info.map(([name, value]) => (
          <li key={name} className="flex items-center justify-between rounded-[var(--radius-chip)] border-2 border-line bg-paper px-3 py-2 font-mono text-xs">
            <span>{name}</span>
            <Badge tone={value === true ? "success" : value === false ? "accent" : "neutral"}>{value === true ? "sí" : value === false ? "no" : value}</Badge>
          </li>
        ))}
      </ul>
      <p className="text-sm text-ink-muted">
        Pestañas abiertas con tu cuenta: <strong className="text-ink">{tabs}</strong> · canal entre pestañas:{" "}
        <strong className="text-ink">{hub?.transport === "shared-worker" ? "Shared Worker" : hub?.transport === "broadcast-channel" ? "BroadcastChannel" : "—"}</strong>. Abre esta
        página en otra pestaña y el número cambia en vivo.
      </p>
    </Section>
  );
}

/* ---------- 2. Event Loop ---------- */

const kindTone: Record<LoopStep["kind"], "neutral" | "ai" | "highlight" | "accent"> = { sync: "neutral", microtask: "ai", task: "highlight", frame: "accent" };

function EventLoopDemo() {
  const [steps, setSteps] = useState<LoopStep[] | null>(null);
  return (
    <Section icon={Activity} title="Event Loop: tasks y microtasks">
      <p className="text-sm text-ink-muted">
        Se programa una task (setTimeout), dos microtasks (Promise y queueMicrotask) y un frame. El orden real muestra la regla: las microtasks siempre van antes que la
        siguiente task.
      </p>
      <Button onClick={() => void runEventLoopDemo().then(setSteps)} className="self-start">
        <Play aria-hidden className="size-4" /> Ejecutar
      </Button>
      {steps ? (
        <ol className="flex flex-col gap-2" aria-label="Orden de ejecución">
          {steps.map((step, i) => (
            <li key={i} className="flex items-center gap-3 font-mono text-xs">
              <span className="w-5 text-right font-bold">{i + 1}.</span>
              <Badge tone={kindTone[step.kind]}>{step.kind}</Badge>
              <span className="flex-1">{step.label}</span>
              <span className="text-ink-muted">{step.at.toFixed(1)} ms</span>
            </li>
          ))}
        </ol>
      ) : null}
    </Section>
  );
}

/* ---------- 3. Hilo principal bloqueado vs worker ---------- */

/** Contador movido por JavaScript (hilo principal): se congela cuando el hilo está ocupado. */
function MainThreadCounter() {
  const [frames, setFrames] = useState(0);
  useEffect(() => {
    let id = 0;
    const tick = () => {
      setFrames((f) => f + 1);
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, []);
  return <span className="font-mono text-2xl font-bold tabular-nums">{frames}</span>;
}

function BlockingDemo() {
  const [status, setStatus] = useState("Listo.");
  const [busy, setBusy] = useState(false);
  const shared = useCanShare();

  function blockFixed() {
    setStatus("Bloqueando el hilo principal 3 s…");
    requestAnimationFrame(() =>
      setTimeout(() => {
        const ms = busyBlock(3000);
        setStatus(`El hilo principal estuvo bloqueado ${Math.round(ms)} ms: el contador se detuvo, pero la barra (compositor) siguió.`);
      }, 50),
    );
  }

  function blockUntilReleased() {
    if (!shared) return;
    const state = sharedState();
    const worker = newWorker();
    setBusy(true);
    setStatus("Bloqueado. Desbloquéalo desde OTRA pestaña con el botón de abajo, o espera 15 s.");
    worker.onmessage = (event: MessageEvent<LabMessage>) => {
      if (event.data.type !== "guard-ready") return;
      // Se suelta el control un frame para que el aviso se pinte antes de bloquear.
      requestAnimationFrame(() =>
        setTimeout(() => {
          const ms = busyBlock(20_000, () => Atomics.load(state, SLOT_UNBLOCK) === 1);
          worker.terminate();
          setBusy(false);
          setStatus(`Desbloqueado tras ${(ms / 1000).toFixed(1)} s. Lo liberó otro hilo escribiendo en memoria compartida, sin cerrar la pestaña.`);
        }, 50),
      );
    };
    worker.postMessage({ type: "guard", shared: state.buffer as SharedArrayBuffer, channel: LAB_CHANNEL, timeoutMs: 15_000 });
  }

  function unblockOthers() {
    const channel = new BroadcastChannel(LAB_CHANNEL);
    channel.postMessage({ type: "lab-unblock" });
    channel.close();
    setStatus("Señal enviada a las otras pestañas.");
  }

  return (
    <Section icon={Lock} title="Bloquear y desbloquear el hilo principal">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-[var(--radius-panel)] border-2 border-line bg-paper p-4">
          <p className="font-mono text-xs uppercase text-ink-muted">Contador en JavaScript (hilo principal)</p>
          <MainThreadCounter />
        </div>
        <div className="rounded-[var(--radius-panel)] border-2 border-line bg-paper p-4">
          <p className="font-mono text-xs uppercase text-ink-muted">Animación CSS (hilo compositor)</p>
          <div className="mt-3 h-3 overflow-hidden rounded-full border-2 border-line">
            <div className="h-full w-1/3 animate-[pv-slide_1.2s_ease-in-out_infinite_alternate] bg-ai" />
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" onClick={blockFixed} disabled={busy}>
          <Timer aria-hidden className="size-4" /> Bloquear 3 s
        </Button>
        <Button onClick={blockUntilReleased} disabled={busy || !shared} title={shared ? undefined : "Requiere crossOriginIsolated"}>
          <Lock aria-hidden className="size-4" /> Bloquear hasta que otra pestaña lo libere
        </Button>
        <Button variant="secondary" onClick={unblockOthers}>
          <LockOpen aria-hidden className="size-4" /> Desbloquear las otras pestañas
        </Button>
      </div>
      <p role="status" className="font-mono text-sm">
        {status}
      </p>
      {!shared ? <p className="text-sm text-ink-muted">El desbloqueo externo necesita SharedArrayBuffer, disponible solo con crossOriginIsolated.</p> : null}
    </Section>
  );
}

function WorkerDemo() {
  const [status, setStatus] = useState("Cuenta los números primos hasta 30 millones en un Web Worker: la interfaz sigue fluida.");
  const [running, setRunning] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const stateRef = useRef<Int32Array | null>(null);
  const waitRef = useRef<{ worker: Worker; state: Int32Array } | null>(null);
  const shared = useCanShare();

  useEffect(
    () => () => {
      workerRef.current?.terminate();
      waitRef.current?.worker.terminate();
    },
    [],
  );

  function startPrimes() {
    const worker = newWorker();
    const state = shared ? sharedState() : null;
    workerRef.current = worker;
    stateRef.current = state;
    setRunning(true);
    worker.onmessage = (event: MessageEvent<LabMessage>) => {
      const message = event.data;
      if (message.type === "primes-progress") setStatus(`Revisados ${message.checked.toLocaleString("es-CO")} números…`);
      if (message.type === "primes-done") {
        setStatus(`${message.cancelled ? "Detenido" : "Listo"}: ${message.count.toLocaleString("es-CO")} primos en ${(message.ms / 1000).toFixed(1)} s, sin congelar la página.`);
        setRunning(false);
        worker.terminate();
      }
    };
    worker.onerror = () => {
      setRunning(false);
      setStatus("No se pudo iniciar el worker en este navegador.");
    };
    worker.postMessage({ type: "primes", limit: 30_000_000, shared: state?.buffer as SharedArrayBuffer | undefined });
  }

  function stopPrimes() {
    if (stateRef.current) Atomics.store(stateRef.current, SLOT_CANCEL, 1);
    else {
      workerRef.current?.terminate();
      setRunning(false);
      setStatus("Detenido (sin memoria compartida, el worker se terminó a la fuerza).");
    }
  }

  function sleepWorker() {
    if (!shared) return;
    const worker = newWorker();
    const state = sharedState();
    waitRef.current = { worker, state };
    worker.onmessage = (event: MessageEvent<LabMessage>) => {
      if (event.data.type === "waiting") setWaiting(true);
      if (event.data.type === "woke") {
        setWaiting(false);
        setStatus(`El worker estuvo bloqueado con Atomics.wait ${(event.data.ms / 1000).toFixed(1)} s y lo despertó el hilo principal.`);
        worker.terminate();
      }
    };
    worker.postMessage({ type: "wait", shared: state.buffer as SharedArrayBuffer });
  }

  function wakeWorker() {
    const current = waitRef.current;
    if (!current) return;
    Atomics.store(current.state, SLOT_WAKE, 1);
    Atomics.notify(current.state, SLOT_WAKE);
  }

  return (
    <Section icon={Unplug} title="Web Worker y memoria compartida">
      <div className="flex flex-wrap gap-3">
        <Button onClick={startPrimes} disabled={running}>
          <Play aria-hidden className="size-4" /> Calcular en un worker
        </Button>
        <Button variant="secondary" onClick={stopPrimes} disabled={!running}>
          <Square aria-hidden className="size-4" /> Detener
        </Button>
        <Button variant="secondary" onClick={sleepWorker} disabled={!shared || waiting}>
          <Lock aria-hidden className="size-4" /> Dormir un worker (Atomics.wait)
        </Button>
        <Button variant="secondary" onClick={wakeWorker} disabled={!waiting}>
          <LockOpen aria-hidden className="size-4" /> Despertarlo (Atomics.notify)
        </Button>
      </div>
      <p role="status" className="font-mono text-sm">
        {status}
      </p>
    </Section>
  );
}

/* ---------- 4. INP ---------- */

const ratingLabel = { good: "Bueno", "needs-improvement": "Necesita mejora", poor: "Pobre" } as const;
const ratingTone = { good: "success", "needs-improvement": "highlight", poor: "accent" } as const;

function InpPanel() {
  const [state, setState] = useState<{ inp: number | null; interactions: Interaction[] }>({ inp: null, interactions: [] });
  useEffect(() => getInpMonitor().subscribe(setState), []);
  const rating = state.inp === null ? null : rate(state.inp);

  return (
    <Section icon={Gauge} title="INP en vivo (Interaction to Next Paint)">
      <div className="flex flex-wrap items-end gap-4">
        <p className="font-display text-5xl font-extrabold tabular-nums">{state.inp === null ? "—" : `${Math.round(state.inp)} ms`}</p>
        {rating ? <Badge tone={ratingTone[rating]}>{ratingLabel[rating]}</Badge> : <Badge tone="neutral">Interactúa con la página</Badge>}
        <span className="font-mono text-xs text-ink-muted">Meta: menos de {GOOD_MS} ms</span>
      </div>
      <p className="text-sm text-ink-muted">INP = espera en cola + procesamiento del JavaScript + presentación (estilo, layout, paint y composición).</p>
      <div className="flex flex-wrap gap-3">
        <Button
          variant="secondary"
          onClick={() => {
            busyBlock(320);
          }}
        >
          <Timer aria-hidden className="size-4" /> Probar una interacción lenta (320 ms)
        </Button>
        <Button variant="ghost" onClick={() => getInpMonitor().reset()}>
          Reiniciar medición
        </Button>
      </div>
      {state.interactions.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse font-mono text-xs">
            <thead>
              <tr className="border-b-2 border-line text-left">
                <th className="py-2">Evento</th>
                <th>Espera</th>
                <th>Procesamiento</th>
                <th>Presentación</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {state.interactions.slice(0, 8).map((item) => (
                <tr key={item.id} className="border-b border-line/20">
                  <td className="py-1.5">{item.name}</td>
                  <td>{Math.round(item.inputDelay)} ms</td>
                  <td>{Math.round(item.processing)} ms</td>
                  <td>{Math.round(item.presentation)} ms</td>
                  <td className={cn("font-bold", rate(item.duration) === "good" ? "text-success" : "text-accent")}>{Math.round(item.duration)} ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </Section>
  );
}

/** Laboratorio del navegador: hace visibles el Event Loop, los workers, la memoria compartida y el INP. */
export function LabView() {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <BrowserStatus />
      <InpPanel />
      <EventLoopDemo />
      <WorkerDemo />
      <div className="xl:col-span-2">
        <BlockingDemo />
      </div>
    </div>
  );
}
