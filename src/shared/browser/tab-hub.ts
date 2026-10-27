/**
 * Canal entre pestañas del mismo usuario.
 *
 * - Si el navegador tiene **Shared Worker**, todas las pestañas hablan con un único proceso
 *   compartido (public/tab-hub-worker.js) que reenvía los mensajes y cuenta las pestañas.
 * - Si no (por ejemplo Chrome en Android), se usa **BroadcastChannel**, que también llega a
 *   todas las pestañas del mismo origen.
 *
 * Así el progreso, los marcadores y la biblioteca se actualizan EN VIVO en todas las pestañas.
 */

export type TabMessage =
  | { type: "db-changed" }
  | { type: "reader-page"; comicId: string; page: number }
  | { type: "lab-unblock" };

type Listener = (message: TabMessage) => void;
type CountListener = (count: number) => void;

export type TabTransport = "shared-worker" | "broadcast-channel" | "none";

export class TabHub {
  readonly transport: TabTransport;
  private readonly listeners = new Set<Listener>();
  private readonly countListeners = new Set<CountListener>();
  private port: MessagePort | null = null;
  private channel: BroadcastChannel | null = null;
  private count = 1;

  constructor(name: string, env: { SharedWorker?: typeof SharedWorker; BroadcastChannel?: typeof BroadcastChannel } = globalThis) {
    if (env.SharedWorker) {
      const worker = new env.SharedWorker("/tab-hub-worker.js", { name });
      this.port = worker.port;
      this.port.onmessage = (event: MessageEvent) => this.receive(event.data);
      this.port.start();
      this.transport = "shared-worker";
    } else if (env.BroadcastChannel) {
      this.channel = new env.BroadcastChannel(name);
      this.channel.onmessage = (event: MessageEvent) => this.receive(event.data);
      this.transport = "broadcast-channel";
    } else {
      this.transport = "none";
    }
    // Al recargar o cerrar la pestaña se despide del Shared Worker, para que el conteo sea exacto.
    if (typeof window !== "undefined" && this.port) window.addEventListener("pagehide", this.onPageHide);
  }

  private readonly onPageHide = () => this.port?.postMessage({ type: "bye" });

  /** Envía un mensaje a las DEMÁS pestañas (nunca vuelve a la que lo envió). */
  publish(message: TabMessage): void {
    this.port?.postMessage(message);
    this.channel?.postMessage(message);
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Pestañas abiertas (solo se conoce con Shared Worker; con BroadcastChannel queda en 1). */
  onTabCount(listener: CountListener): () => void {
    this.countListeners.add(listener);
    listener(this.count);
    return () => this.countListeners.delete(listener);
  }

  close(): void {
    if (typeof window !== "undefined") window.removeEventListener("pagehide", this.onPageHide);
    this.port?.postMessage({ type: "bye" });
    this.port?.close();
    this.channel?.close();
    this.listeners.clear();
    this.countListeners.clear();
  }

  private receive(data: unknown): void {
    if (!data || typeof data !== "object" || !("type" in data)) return;
    const message = data as { type: string; count?: number };
    if (message.type === "tabs" && typeof message.count === "number") {
      this.count = message.count;
      this.countListeners.forEach((l) => l(this.count));
      return;
    }
    this.listeners.forEach((l) => l(data as TabMessage));
  }
}
