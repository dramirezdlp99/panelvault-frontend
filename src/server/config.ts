import "server-only";

/**
 * Configuración del servidor de Next leída de variables de entorno.
 * Nada de esto llega al navegador: los secretos solo existen en el servidor.
 */
export type ServerConfig = {
  /** URL base del backend de Spring Boot, sin barra final. */
  apiUrl: string;
  /** Secreto HMAC compartido con el backend; vacío si la firma del gateway está desactivada. */
  gatewaySecret: string | null;
  /** Cookies con el atributo Secure (solo viajan por HTTPS). */
  secureCookies: boolean;
};

export const MIN_GATEWAY_SECRET_LENGTH = 32;

export function readServerConfig(env: Record<string, string | undefined> = process.env): ServerConfig {
  const apiUrl = (env.PANELVAULT_API_URL ?? "http://localhost:9096").trim().replace(/\/+$/, "");
  if (!/^https?:\/\//.test(apiUrl)) {
    throw new Error("PANELVAULT_API_URL debe empezar por http:// o https://");
  }

  const secret = env.PANELVAULT_GATEWAY_SECRET?.trim() ?? "";
  if (secret && secret.length < MIN_GATEWAY_SECRET_LENGTH) {
    throw new Error(`PANELVAULT_GATEWAY_SECRET debe tener al menos ${MIN_GATEWAY_SECRET_LENGTH} caracteres`);
  }

  const secureOverride = env.PANELVAULT_SECURE_COOKIES?.trim().toLowerCase();
  const secureCookies =
    secureOverride === "true" ? true : secureOverride === "false" ? false : env.NODE_ENV === "production";

  return { apiUrl, gatewaySecret: secret || null, secureCookies };
}

let cached: ServerConfig | null = null;

/** Configuración del proceso actual (se lee una sola vez). */
export function serverConfig(): ServerConfig {
  cached ??= readServerConfig();
  return cached;
}

/** Solo para pruebas: vuelve a leer las variables de entorno en la próxima llamada. */
export function resetServerConfig(): void {
  cached = null;
}
