# PanelVault Frontend

Interfaz web de **PanelVault**, una biblioteca de cómics *offline-first* con lectura guiada
viñeta por viñeta. Habla con el backend de Spring Boot (`panelvault-backend`), que a su vez
usa el motor de visión por computador (`panelvault-ai-engine`).

```
Navegador ──► Next.js (este repo) ──HMAC──► Backend Spring Boot ──HMAC──► Motor de IA
   │            │  BFF: cookies httpOnly         │  PostgreSQL
   │            └─ renderizado SSG / ISR / SSR    └─ cola de análisis
   └─ IndexedDB (cómics, progreso, marcadores) + service worker (sin conexión)
```

## Tecnologías

- **Next.js 16** (App Router) + **React 19** + **TypeScript** estricto
- **Tailwind CSS 4** con un sistema de diseño propio ("cómic editorial")
- **IndexedDB** (`idb`) para la biblioteca local, **fflate** para CBZ y **pdf.js** para PDF
- **Vitest** + **Testing Library** + `fake-indexeddb` para pruebas
- Fuentes autoalojadas e íconos `lucide-react`

Todo es gratuito y de código abierto.

## Funcionalidades

| Pantalla | Qué hace |
|---|---|
| Portada | Presentación del proyecto y clásicos de dominio público |
| Catálogo | Obras públicas con búsqueda y paginación; ficha de cada obra |
| Ingreso / registro | Cuenta nueva, inicio de sesión y verificación en dos pasos (TOTP o código de recuperación) |
| Biblioteca | Importa CBZ, PDF o imágenes; todo se guarda en el dispositivo; filtros, búsqueda y estadísticas |
| Detalle del cómic | Datos, edición, marcadores y borrado |
| Lector | Página completa o viñeta por viñeta (con el mapa de viñetas del motor de IA), occidental o manga, teclado y gestos, marcadores |
| Leyendo | Lecturas recientes, con el progreso de todos tus dispositivos |
| Marcadores | Todas las páginas marcadas, con notas editables |
| Análisis | Sube una página y ve las viñetas detectadas, su confianza y el tiempo por etapa |
| Curaduría | (rol CURADOR) Crear, editar, publicar y borrar obras del catálogo |
| Seguridad | Activar la verificación en dos pasos con QR y códigos de recuperación |

## Patrones de renderizado

| Patrón | Dónde | Por qué |
|---|---|---|
| **SSG** (estático) | Portada, 404, sin permiso | No dependen de datos ni del usuario |
| **ISR** (regeneración incremental) | `/catalogo/[slug]` | Se generan al compilar y se regeneran cada 60 s o al instante tras un cambio de curaduría (`revalidateTag`) |
| **SSR + streaming** | `/catalogo` | Depende de la búsqueda; el encabezado sale de inmediato y los resultados llegan con `Suspense` |
| **SSR dinámico** | Ingreso, registro, layout privado | Leen las cookies de sesión en cada petición |
| **CSR** (cliente) | Biblioteca, lector, Leyendo, Marcadores, Análisis | Los datos viven en IndexedDB del dispositivo; funcionan sin conexión |

## Arquitectura

```
src/
├── app/                      Rutas (delgadas: solo componen pantallas)
│   ├── (public)/             Portada, catálogo, ingreso, registro
│   ├── (app)/                Pantallas privadas con barra lateral
│   ├── (reader)/lector/      Lector a pantalla completa
│   └── api/                  BFF: /api/auth/* y /api/pv/[...path]
├── features/                 Un módulo por funcionalidad
│   ├── auth, security        Ingreso, registro, 2FA
│   ├── catalog, curation     Catálogo público y curaduría
│   ├── library               Biblioteca local, importación, sincronización
│   ├── reader                Lector, mapas de viñetas, progreso, marcadores
│   ├── reading, bookmarks    Leyendo y Marcadores
│   └── analysis              Análisis de páginas
├── server/                   Código que SOLO corre en el servidor de Next
│   ├── backend/              Cliente firmado (HMAC) y reenvío del BFF
│   ├── auth/                 Cookies, renovación de tokens, proxy de rutas
│   └── catalog/              Lecturas cacheadas del catálogo
├── shared/                   Piezas reutilizables (ui, layout, offline, api, theme)
└── proxy.ts                  Proxy de Next (antes "middleware"): protege las rutas privadas
```

Las pruebas viven junto al código que prueban (`*.test.ts(x)`).

## Seguridad

- **Backend-for-Frontend:** el navegador nunca habla con el backend ni ve los tokens. Next guarda
  el token de acceso y el de renovación en **cookies httpOnly, SameSite=Lax** (Secure en producción)
  y reenvía las peticiones por `/api/pv/*` solo hacia áreas permitidas.
- **Firma del gateway:** cada petición al backend lleva `X-PanelVault-Timestamp` y
  `X-PanelVault-Signature` (HMAC-SHA256 de `timestamp\nMÉTODO\nruta?query\nsha256(cuerpo)`), con el
  secreto `PANELVAULT_GATEWAY_SECRET` que solo conocen los dos servidores.
- **Renovación coordinada:** si varias peticiones llegan con el token vencido, se renueva una sola
  vez; el backend rota el token y revoca la sesión si detecta reutilización.
- **CSRF:** además de SameSite, las rutas que cambian datos rechazan peticiones de otro sitio
  (`Sec-Fetch-Site` / `Origin`).
- **Roles:** la interfaz oculta lo que no corresponde, pero **el backend valida el rol** en cada
  petición. Un lector que entra a `/curaduria` ve la página "sin permiso".
- **Redirecciones:** el destino tras el ingreso solo puede ser una ruta interna.
- **Cabeceras:** `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`,
  `Permissions-Policy`; sin `X-Powered-By`.
- Los archivos de los cómics **nunca se suben**: solo viajan sus metadatos.

## Offline-first

1. **IndexedDB por usuario** (`panelvault-<id>`): cómics, páginas, progreso, marcadores y mapas
   de viñetas.
2. **Bandeja de salida:** cada cambio se guarda primero en el dispositivo y se encola. Se envía al
   recuperar la red, al encolar y cada minuto. Las operaciones son idempotentes (PUT con UUID del
   cliente, DELETE que tolera 404) y el progreso se resuelve con "gana el último" (misma regla que
   el backend).
3. **Service worker** (`public/sw.js`): guarda las pantallas principales y sus archivos para
   abrirlas sin conexión. El detalle y el lector reciben el id por la query (`?id=`), así una sola
   copia sirve para cualquier cómic.

## Requisitos

- Node.js 22.12 o superior
- Para usarlo completo: el backend en `http://localhost:9096` y el motor de IA encendidos

## Puesta en marcha (PowerShell)

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Abre <http://localhost:3000>. Si el backend tiene el gateway activado, pon el mismo
`PANELVAULT_GATEWAY_SECRET` en `.env.local`.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo en el puerto 3000 |
| `npm test` | Ejecuta todas las pruebas una vez |
| `npm run lint` | Revisa el código con ESLint |
| `npm run typecheck` | Verifica los tipos de TypeScript |
| `npm run build` | Compilación de producción (funciona aunque el backend esté apagado) |
| `npm start` | Sirve la compilación de producción |

## Variables de entorno

| Variable | Obligatoria | Descripción |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | No | URL pública del frontend (metadatos) |
| `PANELVAULT_API_URL` | Sí | URL del backend; solo la usa el servidor de Next |
| `PANELVAULT_GATEWAY_SECRET` | Si el gateway está activo | Mismo valor que en el backend (mínimo 32 caracteres) |
| `PANELVAULT_SECURE_COOKIES` | No | Fuerza cookies Secure (`true`/`false`); por defecto solo en producción |

Ver `.env.example`. Los archivos `.env*` reales nunca se suben a Git.

## Docker

```powershell
docker build -t panelvault-frontend .
docker run --rm -p 3000:3000 -e PANELVAULT_API_URL=http://host.docker.internal:9096 panelvault-frontend
```

La imagen usa el modo `standalone` de Next (solo el servidor compilado) y corre sin root.

## Despliegue

Todo en planes gratuitos:

| Pieza | Plataforma | Notas |
|---|---|---|
| Frontend | **Vercel** | Detecta Next.js solo; región `iad1` (Washington) |
| Backend | **Render** (Docker) | Región Virginia; se duerme tras 15 min sin uso |
| Motor de IA | **Render** (Docker) | El backend lo despierta con `/health` antes de analizar |
| Base de datos | **Neon** (PostgreSQL) | Región AWS us-east-1, cerca de Render y Vercel |

Adaptaciones para los planes gratuitos:

- **Arranque en frío:** el servidor de Next espera hasta 2 minutos al backend, la portada lo
  "despierta" en segundo plano (`/api/health`) y los formularios de ingreso avisan si tarda.
- **Límite de 4,5 MB por petición de Vercel:** una página más pesada se reduce en el navegador
  (lado mayor de 2400 px, JPEG) antes de enviarla a analizar. Las viñetas vuelven en coordenadas
  relativas, así que valen igual para la imagen original.

Variables en Vercel: `PANELVAULT_API_URL` (URL del backend en Render), `PANELVAULT_GATEWAY_SECRET`
(el mismo del backend) y `NEXT_PUBLIC_SITE_URL` (la URL de Vercel). Ningún secreto va en el repositorio.

## Integración continua

`.github/workflows/ci.yml` corre lint, verificación de tipos, pruebas y compilación en cada
push a `main`.
