import { ImportError, MAX_PAGES } from "./detect";

/** Ancho al que se dibujan las páginas del PDF: nítido en pantallas grandes sin pesar demasiado. */
const TARGET_WIDTH = 1600;

/**
 * Convierte cada página del PDF en una imagen usando pdf.js (de Mozilla, gratuito).
 * La librería se carga solo cuando hace falta para no hacer pesada la aplicación.
 * Se usa la versión "legacy", que trae compatibilidad para navegadores que aún no tienen
 * las funciones más nuevas de JavaScript (por ejemplo Safari o Chrome de hace unos meses).
 */
export async function renderPdf(data: Uint8Array, onPage?: (done: number, total: number) => void): Promise<Blob[]> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url).toString();

  const task = pdfjs.getDocument({ data });
  let document;
  try {
    document = await task.promise;
  } catch {
    throw new ImportError("No se pudo abrir el PDF. Puede estar dañado o protegido con contraseña.");
  }
  if (document.numPages > MAX_PAGES) {
    await task.destroy();
    throw new ImportError(`El PDF supera el máximo de ${MAX_PAGES} páginas.`);
  }

  const pages: Blob[] = [];
  for (let n = 1; n <= document.numPages; n++) {
    const page = await document.getPage(n);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: TARGET_WIDTH / base.width });
    const canvas = window.document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    await page.render({ canvas, viewport }).promise;
    pages.push(await canvasToBlob(canvas));
    page.cleanup();
    onPage?.(n, document.numPages);
  }
  await task.destroy();
  return pages;
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new ImportError("No se pudo convertir una página."))), "image/webp", 0.9);
  });
}
