import type { NextConfig } from "next";

/**
 * Cabeceras de seguridad comunes a todas las respuestas.
 * La politica de contenido (CSP) se agrega cuando exista la capa de autenticacion,
 * porque depende de los origenes que el frontend necesite contactar.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // En Docker (NEXT_OUTPUT=standalone) se genera un servidor autónomo y liviano;
  // en local se usa el modo normal para que "npm start" funcione sin avisos.
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  // No anunciar la tecnologia del servidor en cada respuesta.
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // El service worker siempre se revalida, para que una nueva versión llegue de inmediato.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
