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
  // No anunciar la tecnologia del servidor en cada respuesta.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
