import { errorResponse } from "./responses";

/**
 * Defensa CSRF para rutas que cambian datos: el navegador indica de dónde viene la petición
 * (Sec-Fetch-Site u Origin). Si viene de otro sitio, se rechaza aunque traiga las cookies.
 * Las cookies además son SameSite=Lax, así que esta es una segunda barrera.
 */
export function isCrossSiteRequest(request: Request): boolean {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite) {
    return fetchSite !== "same-origin" && fetchSite !== "none";
  }

  const origin = request.headers.get("origin");
  if (!origin) {
    // Sin cabeceras de navegador: no es un navegador, así que no puede llevar cookies ajenas.
    return false;
  }

  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try {
    return new URL(origin).host !== host;
  } catch {
    return true;
  }
}

export function rejectCrossSite(request: Request) {
  if (!isCrossSiteRequest(request)) return null;
  return errorResponse({ status: 403, code: "request.cross_site", message: "Petición de otro sitio rechazada." });
}
