import type { NextRequest } from "next/server";

import { runProxy } from "@/server/auth/proxy-flow";

export function proxy(request: NextRequest) {
  return runProxy(request);
}

/** Solo corre en rutas privadas; la portada y el catálogo público no pasan por aquí. */
export const config = {
  matcher: [
    "/biblioteca/:path*",
    "/lector/:path*",
    "/leyendo/:path*",
    "/marcadores/:path*",
    "/analisis/:path*",
    "/seguridad/:path*",
    "/curaduria/:path*",
    "/api/pv/:path*",
    "/api/auth/session",
  ],
};
