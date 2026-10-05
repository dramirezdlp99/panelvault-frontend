/**
 * Rutas de la aplicación en un solo lugar: si una cambia, se corrige aquí
 * y no en cada enlace repartido por las pantallas.
 */
export const routes = {
  home: "/",
  howItWorks: "/#como-funciona",
  catalog: "/catalogo",
  catalogWork: (slug: string) => `/catalogo/${encodeURIComponent(slug)}`,
  login: "/ingresar",
  twoFactor: "/ingresar/verificacion",
  register: "/registro",
  library: "/biblioteca",
  comic: (id: string) => `/biblioteca/${encodeURIComponent(id)}`,
  reader: (id: string) => `/lector/${encodeURIComponent(id)}`,
  reading: "/leyendo",
  bookmarks: "/marcadores",
  analysis: "/analisis",
  curation: "/curaduria",
  curationNew: "/curaduria/nueva",
  curationEdit: (id: string) => `/curaduria/${encodeURIComponent(id)}`,
  security: "/seguridad",
} as const;
