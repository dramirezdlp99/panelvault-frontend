import type { MetadataRoute } from "next";

/** Manifiesto de la aplicación web: permite instalar PanelVault como app en el celular o el computador. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PanelVault",
    short_name: "PanelVault",
    description: "Tu biblioteca de cómics, viñeta por viñeta. Funciona sin conexión.",
    start_url: "/biblioteca",
    display: "standalone",
    background_color: "#faf6ee",
    theme_color: "#c7321f",
    lang: "es",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
