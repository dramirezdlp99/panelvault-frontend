import localFont from "next/font/local";

/*
 * Fuentes autoalojadas desde paquetes npm (@fontsource-variable): no dependen de
 * Google Fonts en tiempo de compilación ni hacen peticiones externas en el navegador.
 * Cada una expone una variable CSS que globals.css convierte en font-display/sans/mono.
 */
export const bricolage = localFont({
  src: "../../../node_modules/@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2",
  weight: "200 800",
  variable: "--font-bricolage",
  display: "swap",
});

export const inter = localFont({
  src: "../../../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
  weight: "100 900",
  variable: "--font-inter",
  display: "swap",
});

export const jetbrainsMono = localFont({
  src: "../../../node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2",
  weight: "100 800",
  variable: "--font-jetbrains",
  display: "swap",
});

export const fontVariables = [bricolage.variable, inter.variable, jetbrainsMono.variable].join(" ");
