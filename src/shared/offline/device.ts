const DEVICE_KEY = "panelvault-device-id";

/**
 * Identificador de este dispositivo. El backend lo usa para desempatar cuando dos
 * dispositivos guardan el progreso en el mismo instante.
 */
export function getDeviceId(): string {
  try {
    const existing = window.localStorage.getItem(DEVICE_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    window.localStorage.setItem(DEVICE_KEY, id);
    return id;
  } catch {
    return "dispositivo-sin-almacenamiento";
  }
}
