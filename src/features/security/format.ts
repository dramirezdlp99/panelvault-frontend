/** Agrupa la clave en bloques de 4 para dictarla o copiarla a mano sin errores. */
export function groupSecret(secret: string): string {
  return secret.replace(/\s+/g, "").replace(/(.{4})(?=.)/g, "$1 ");
}

/** Texto del archivo .txt con los códigos de recuperación. */
export function recoveryCodesFile(codes: string[], generatedAt: Date = new Date()): string {
  return [
    "PanelVault - Códigos de recuperación",
    `Generados: ${generatedAt.toISOString()}`,
    "",
    "Cada código sirve una sola vez. Guárdalos en un lugar seguro.",
    "",
    ...codes.map((code, i) => `${String(i + 1).padStart(2, "0")}. ${code}`),
    "",
  ].join("\n");
}
