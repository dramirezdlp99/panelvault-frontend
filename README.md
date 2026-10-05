# PanelVault Frontend

Interfaz web de **PanelVault**, una biblioteca de cómics *offline-first* con lectura guiada
viñeta por viñeta. Habla con el backend de Spring Boot (`panelvault-backend`), que a su vez
usa el motor de visión por computador (`panelvault-ai-engine`).

## Tecnologías

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 4** con un sistema de diseño propio ("cómic editorial")
- **Vitest** + **Testing Library** para pruebas
- Fuentes autoalojadas (Bricolage Grotesque, Inter, JetBrains Mono) e íconos `lucide-react`

Todo es gratuito y de código abierto.

## Estructura

```
src/
├── app/                 Rutas de Next (delgadas: solo componen pantallas)
│   ├── (public)/        Páginas públicas con barra superior y pie
│   ├── layout.tsx       HTML raíz, fuentes, tema y metadatos
│   └── not-found.tsx    Página 404
├── features/            Un módulo por funcionalidad (landing, ...)
└── shared/              Piezas reutilizables
    ├── config/          Rutas y datos del sitio
    ├── fonts/           Fuentes locales
    ├── layout/          Encabezado y pie públicos
    ├── lib/             Utilidades
    ├── theme/           Modo claro/oscuro sin parpadeo
    └── ui/              Botón, tarjeta, badge, logo...
```

Las pruebas viven junto al código que prueban (`*.test.ts(x)`).

## Sistema de diseño

| Token | Claro | Uso |
|---|---|---|
| `paper` | `#FAF6EE` | Fondo tipo papel |
| `ink` / `line` | `#16161A` | Texto, bordes de 2 px y sombras sólidas |
| `accent` | `#C7321F` | Acciones principales (contraste AA con texto blanco) |
| `highlight` | `#FFD23F` | Etiquetas y resaltados |
| `ai` | `#12A4A0` | Solo para lo que produce la IA (viñetas detectadas) |

Los colores son variables CSS que cambian con `data-theme` en `<html>`, así cada componente
funciona en modo claro (predeterminado) y oscuro.

## Requisitos

- Node.js 22.12 o superior

## Puesta en marcha (Windows, CMD)

```bat
npm ci
copy .env.example .env.local
npm run dev
```

Abre <http://localhost:3000>.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo en el puerto 3000 |
| `npm test` | Ejecuta todas las pruebas una vez |
| `npm run lint` | Revisa el código con ESLint |
| `npm run typecheck` | Verifica los tipos de TypeScript |
| `npm run build` | Compilación de producción |
| `npm start` | Sirve la compilación de producción |

## Variables de entorno

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | URL pública del frontend |
| `PANELVAULT_API_URL` | URL del backend; solo la usa el servidor de Next |

Ver `.env.example`. Los archivos `.env*` reales nunca se suben a Git.
