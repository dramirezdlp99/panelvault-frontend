/*
 * Service worker de PanelVault: permite abrir la app sin conexión.
 * - Archivos de /_next/static/: primero la caché (tienen hash en el nombre, nunca cambian).
 * - Páginas: primero la red; sin red, la copia guardada de esa página (sin importar la query,
 *   porque el lector y el detalle leen el id en el navegador).
 * - /api/: nunca se guarda (datos privados y siempre frescos).
 */
const VERSION = "pv-v1";
const STATIC_CACHE = `${VERSION}-static`;
const PAGES_CACHE = `${VERSION}-pages`;
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(PAGES_CACHE).then((cache) => cache.add(OFFLINE_URL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => !key.startsWith(VERSION)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

function pageKey(url) {
  const u = new URL(url);
  return u.origin + u.pathname;
}

async function cachePage(request, response) {
  const type = response.headers.get("content-type") || "";
  if (response.ok && !response.redirected && type.includes("text/html")) {
    const cache = await caches.open(PAGES_CACHE);
    await cache.put(pageKey(request.url), response.clone());
  }
  return response;
}

async function handleNavigation(request) {
  try {
    const response = await cachePage(request, await fetch(request));
    if (response.ok) cacheAssetsOf(response).catch(() => undefined);
    return response;
  } catch {
    const cache = await caches.open(PAGES_CACHE);
    return (await cache.match(pageKey(request.url))) || (await cache.match(OFFLINE_URL)) || Response.error();
  }
}

async function handleStatic(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) await cache.put(request, response.clone());
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(request));
  } else if (url.pathname.startsWith("/_next/static/") || url.pathname === "/icon.svg") {
    event.respondWith(handleStatic(request));
  }
});

/** Guarda también los JS/CSS que usa una página: sin ellos la cáscara no arranca sin conexión. */
async function cacheAssetsOf(response) {
  const html = await response.clone().text();
  const assets = new Set(html.match(/\/_next\/static\/[^"'\s)\\]+/g) || []);
  const cache = await caches.open(STATIC_CACHE);
  await Promise.all(
    [...assets].map(async (path) => {
      if (await cache.match(path)) return;
      const asset = await fetch(path).catch(() => null);
      if (asset && asset.ok) await cache.put(path, asset);
    }),
  );
}

self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "WARM" && Array.isArray(data.urls)) {
    // Guarda de antemano las "cáscaras" de las pantallas principales para abrirlas sin conexión.
    event.waitUntil(
      Promise.all(
        data.urls.map((path) =>
          fetch(path, { credentials: "same-origin" })
            .then((response) => cachePage(new Request(new URL(path, self.location.origin)), response))
            .then((response) => (response.ok ? cacheAssetsOf(response) : undefined))
            .catch(() => undefined),
        ),
      ),
    );
  } else if (data.type === "CLEAR_PAGES") {
    // Al cerrar sesión no deben quedar páginas privadas guardadas.
    event.waitUntil(caches.delete(PAGES_CACHE).then(() => caches.open(PAGES_CACHE)).then((cache) => cache.add(OFFLINE_URL)));
  }
});
