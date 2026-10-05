import { unzip, type Unzipped } from "fflate";

import { ImportError, isImageName, MAX_PAGES, mimeFor, naturalCompare } from "./detect";

function unzipAsync(data: Uint8Array): Promise<Unzipped> {
  return new Promise((resolve, reject) => {
    unzip(data, (error, files) => (error ? reject(error) : resolve(files)));
  });
}

/** Ignora carpetas de sistema (__MACOSX) y archivos ocultos que algunos compresores agregan. */
export function isComicPage(path: string): boolean {
  const parts = path.split("/");
  const name = parts[parts.length - 1];
  return !parts.includes("__MACOSX") && !name.startsWith(".") && isImageName(name);
}

/** Extrae las páginas de un CBZ (un ZIP de imágenes), en orden natural de nombre. */
export async function extractCbz(data: Uint8Array): Promise<Blob[]> {
  let files: Unzipped;
  try {
    files = await unzipAsync(data);
  } catch {
    throw new ImportError("El archivo CBZ está dañado o no es un ZIP válido.");
  }
  const names = Object.keys(files).filter(isComicPage).sort(naturalCompare);
  if (names.length === 0) throw new ImportError("El CBZ no contiene imágenes.");
  if (names.length > MAX_PAGES) throw new ImportError(`El cómic supera el máximo de ${MAX_PAGES} páginas.`);
  return names.map((name) => new Blob([files[name] as BlobPart], { type: mimeFor(name) }));
}
