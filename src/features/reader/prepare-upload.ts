/**
 * Prepara una página antes de enviarla a analizar.
 *
 * Las peticiones pasan por el servidor de Next, que en Vercel acepta como máximo 4,5 MB
 * por petición. Una página más pesada se reduce (lado mayor de 2400 px, JPEG) antes de
 * subirla. Para la IA no cambia nada: las viñetas se devuelven en coordenadas relativas
 * (0 a 1), así que sirven igual sobre la imagen original.
 */

/** Por debajo del límite de 4,5 MB de Vercel, con margen para las cabeceras. */
export const MAX_UPLOAD_BYTES = 4_000_000;
export const MAX_SIDE_PX = 2400;

export type Encoder = (image: Blob, maxSide: number, quality: number) => Promise<Blob>;

export class UploadTooLargeError extends Error {
  constructor() {
    super("La página es demasiado pesada incluso después de reducirla.");
    this.name = "UploadTooLargeError";
  }
}

/** Codificador del navegador: dibuja la imagen reducida en un canvas y la exporta como JPEG. */
export const browserEncoder: Encoder = async (image, maxSide, quality) => {
  const bitmap = await createImageBitmap(image);
  try {
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new UploadTooLargeError();
    // Fondo blanco: un PNG con transparencia no debe quedar con zonas negras en el JPEG.
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(bitmap, 0, 0, width, height);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new UploadTooLargeError())), "image/jpeg", quality),
    );
  } finally {
    bitmap.close();
  }
};

/** Devuelve la misma imagen si ya cabe; si no, la reduce en pasos hasta que quepa. */
export async function prepareForUpload(
  image: Blob,
  options: { maxBytes?: number; encode?: Encoder } = {},
): Promise<Blob> {
  const maxBytes = options.maxBytes ?? MAX_UPLOAD_BYTES;
  if (image.size <= maxBytes) return image;

  const encode = options.encode ?? browserEncoder;
  const attempts: Array<[number, number]> = [
    [MAX_SIDE_PX, 0.9],
    [MAX_SIDE_PX, 0.8],
    [2000, 0.8],
    [1600, 0.75],
  ];
  for (const [side, quality] of attempts) {
    const reduced = await encode(image, side, quality);
    if (reduced.size <= maxBytes) return reduced;
  }
  throw new UploadTooLargeError();
}
