/// <reference lib="webworker" />
/**
 * Worker del laboratorio. Hace tres cosas que muestran el paralelismo real del navegador:
 * 1. primes: un cálculo pesado (contar primos) que NO congela la interfaz y se puede detener.
 * 2. wait:   se duerme con Atomics.wait hasta que el hilo principal lo despierte (Atomics.notify).
 * 3. guard:  mientras el hilo principal está BLOQUEADO, escucha a otras pestañas y un temporizador
 *            para liberarlo escribiendo en memoria compartida.
 */
import { SLOT_CANCEL, SLOT_UNBLOCK, SLOT_WAKE, type LabMessage, type LabRequest } from "./lab-protocol";

const scope = self as unknown as DedicatedWorkerGlobalScope;
const post = (message: LabMessage) => scope.postMessage(message);

function isPrime(n: number): boolean {
  if (n < 2) return false;
  if (n % 2 === 0) return n === 2;
  for (let d = 3; d * d <= n; d += 2) if (n % d === 0) return false;
  return true;
}

scope.onmessage = (event: MessageEvent<LabRequest>) => {
  const request = event.data;

  if (request.type === "primes") {
    const state = request.shared ? new Int32Array(request.shared) : null;
    const started = performance.now();
    let count = 0;
    for (let n = 2; n <= request.limit; n++) {
      if (isPrime(n)) count++;
      if (n % 200_000 === 0) {
        post({ type: "primes-progress", checked: n });
        if (state && Atomics.load(state, SLOT_CANCEL) === 1) {
          return post({ type: "primes-done", count, ms: performance.now() - started, cancelled: true });
        }
      }
    }
    return post({ type: "primes-done", count, ms: performance.now() - started, cancelled: false });
  }

  if (request.type === "wait") {
    const state = new Int32Array(request.shared);
    post({ type: "waiting" });
    const started = performance.now();
    // El worker queda BLOQUEADO aquí (sin consumir CPU) hasta que alguien haga Atomics.notify.
    Atomics.wait(state, SLOT_WAKE, 0);
    return post({ type: "woke", ms: performance.now() - started });
  }

  // guard: libera al hilo principal desde otro hilo.
  const state = new Int32Array(request.shared);
  const release = () => Atomics.store(state, SLOT_UNBLOCK, 1);
  const channel = new BroadcastChannel(request.channel);
  channel.onmessage = (message: MessageEvent) => {
    if (message.data?.type === "lab-unblock") release();
  };
  setTimeout(release, request.timeoutMs);
  post({ type: "guard-ready" });
};
