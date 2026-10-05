import type { ComicFormat } from "@/shared/offline/types";

export const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif", "avif"] as const;
export const MAX_PAGES = 2000;
/** Límite práctico del navegador para calcular la huella de un archivo de una sola vez. */
export const MAX_FILE_BYTES = 500 * 1024 * 1024;

export class ImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImportError";
  }
}

export function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot + 1).toLowerCase();
}

export function isImageName(name: string): boolean {
  return (IMAGE_EXTENSIONS as readonly string[]).includes(extensionOf(name));
}

export function mimeFor(name: string): string {
  const ext = extensionOf(name);
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  return ext ? `image/${ext}` : "application/octet-stream";
}

/** Decide el formato a partir de lo que eligió el usuario: un archivo CBZ/PDF o varias imágenes. */
export function detectFormat(files: Array<{ name: string }>): ComicFormat {
  if (files.length === 0) throw new ImportError("Elige un archivo para importar.");
  if (files.length === 1) {
    const ext = extensionOf(files[0].name);
    if (ext === "cbz" || ext === "zip") return "CBZ";
    if (ext === "pdf") return "PDF";
    if (ext === "cbr" || ext === "rar") {
      throw new ImportError("Los archivos CBR (RAR) no se pueden abrir en el navegador. Conviértelo a CBZ e inténtalo de nuevo.");
    }
  }
  if (files.every((f) => isImageName(f.name))) return "IMAGES";
  throw new ImportError("Formato no compatible. Usa CBZ, PDF o imágenes (JPG, PNG, WebP).");
}

/** Orden natural: "pagina2" va antes que "pagina10". */
export function naturalCompare(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

/** Título legible a partir del nombre del archivo. */
export function titleFromFileName(name: string): string {
  const base = name.replace(/\.[^.]+$/, "").replace(/[_]+/g, " ").replace(/\s+/g, " ").trim();
  return (base || "Cómic sin título").slice(0, 200);
}
