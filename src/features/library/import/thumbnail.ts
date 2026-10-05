const THUMB_WIDTH = 360;

/** Miniatura de la portada para las tarjetas de la biblioteca (pesa mucho menos que la página). */
export async function makeThumbnail(page: Blob): Promise<Blob | null> {
  try {
    const bitmap = await createImageBitmap(page);
    const scale = Math.min(1, THUMB_WIDTH / bitmap.width);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return await new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), "image/webp", 0.85));
  } catch {
    // Si el navegador no puede decodificar la imagen, la tarjeta usa la página original.
    return null;
  }
}
