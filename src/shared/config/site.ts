/** Datos generales del sitio usados en metadatos, encabezado y pie de página. */
export const site = {
  name: "PanelVault",
  tagline: "Tu biblioteca de cómics, viñeta por viñeta",
  description:
    "Importa tus cómics, léelos en cualquier dispositivo y deja que la IA te guíe viñeta por viñeta. Funciona sin conexión.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  repositoryUrl: "https://github.com/dramirezdlp99/panelvault-frontend",
} as const;
