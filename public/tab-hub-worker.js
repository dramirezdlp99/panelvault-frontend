/*
 * Shared Worker de PanelVault: un solo proceso para TODAS las pestañas del mismo usuario.
 * - Cada pestaña se conecta por un puerto (MessagePort).
 * - Reenvía cada mensaje a las demás pestañas (no a la que lo envió).
 * - Lleva la cuenta de pestañas abiertas y la avisa cuando cambia.
 * No toca el DOM ni guarda datos: solo coordina.
 */
const ports = new Set();

function broadcastCount() {
  for (const port of ports) port.postMessage({ type: "tabs", count: ports.size });
}

self.onconnect = (event) => {
  const port = event.ports[0];
  ports.add(port);
  port.onmessage = (message) => {
    const data = message.data;
    if (data && data.type === "bye") {
      ports.delete(port);
      broadcastCount();
      return;
    }
    for (const other of ports) if (other !== port) other.postMessage(data);
  };
  port.start();
  broadcastCount();
};
