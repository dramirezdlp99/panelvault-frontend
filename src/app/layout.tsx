import type { Metadata, Viewport } from "next";

import { site } from "@/shared/config/site";
import { fontVariables } from "@/shared/fonts/fonts";
import { ThemeScript } from "@/shared/theme/theme-script";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} · ${site.tagline}`, template: `%s · ${site.name}` },
  description: site.description,
  applicationName: site.name,
  openGraph: { type: "website", siteName: site.name, title: site.name, description: site.description, locale: "es_CO" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf6ee" },
    { media: "(prefers-color-scheme: dark)", color: "#141417" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" data-theme="light" className={fontVariables} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-dvh">
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-[var(--radius-panel)] focus:border-2 focus:border-line focus:bg-surface focus:px-4 focus:py-2"
        >
          Saltar al contenido
        </a>
        {children}
      </body>
    </html>
  );
}
