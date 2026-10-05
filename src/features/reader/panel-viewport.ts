/** Rectángulo normalizado (0 a 1) como lo entrega el motor de IA: [x, y, ancho, alto]. */
export type NormalizedBox = [number, number, number, number];
export type Size = { width: number; height: number };
export type Transform = { scale: number; x: number; y: number };

/** Tamaño de la página ajustada al visor sin deformarla (como object-fit: contain). */
export function fitContain(image: Size, viewport: Size): Size {
  if (image.width <= 0 || image.height <= 0) return { width: 0, height: 0 };
  const scale = Math.min(viewport.width / image.width, viewport.height / image.height);
  return { width: image.width * scale, height: image.height * scale };
}

/** Página completa centrada en el visor. */
export function pageTransform(base: Size, viewport: Size): Transform {
  return { scale: 1, x: (viewport.width - base.width) / 2, y: (viewport.height - base.height) / 2 };
}

/**
 * Transformación (origen arriba a la izquierda) que acerca una viñeta hasta llenar el visor
 * dejando un margen, centrada. `base` es el tamaño de la página ya ajustada al visor.
 */
export function panelTransform(box: NormalizedBox, base: Size, viewport: Size, padding = 24, maxScale = 4): Transform {
  const [bx, by, bw, bh] = box;
  const panelWidth = Math.max(1, bw * base.width);
  const panelHeight = Math.max(1, bh * base.height);
  const availableWidth = Math.max(1, viewport.width - padding * 2);
  const availableHeight = Math.max(1, viewport.height - padding * 2);
  const scale = Math.min(maxScale, availableWidth / panelWidth, availableHeight / panelHeight);
  const centerX = (bx + bw / 2) * base.width;
  const centerY = (by + bh / 2) * base.height;
  return { scale, x: viewport.width / 2 - centerX * scale, y: viewport.height / 2 - centerY * scale };
}

export function toCss(t: Transform): string {
  return `translate(${t.x.toFixed(2)}px, ${t.y.toFixed(2)}px) scale(${t.scale.toFixed(4)})`;
}
