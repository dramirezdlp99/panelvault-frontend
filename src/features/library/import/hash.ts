/** SHA-256 en hexadecimal usando la Web Crypto API del navegador. */
export async function sha256Hex(data: ArrayBuffer | Uint8Array): Promise<string> {
  const buffer = data instanceof Uint8Array ? data : new Uint8Array(data);
  const digest = await crypto.subtle.digest("SHA-256", buffer as BufferSource);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Huella de un cómic hecho de imágenes sueltas: el hash de los hashes de cada imagen en orden.
 * Así, elegir las mismas imágenes otra vez da la misma huella.
 */
export async function fingerprintOfParts(parts: ArrayBuffer[]): Promise<string> {
  const hashes = await Promise.all(parts.map((p) => sha256Hex(p)));
  return sha256Hex(new TextEncoder().encode(hashes.join("\n")));
}
