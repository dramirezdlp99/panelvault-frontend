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
  // Detalle y lector llevan el id en la query: la página es una sola "cáscara" que funciona sin conexión.
  comic: (id: string) => `/biblioteca/detalle?id=${encodeURIComponent(id)}`,
  reader: (id: string, page?: number) => `/lector?id=${encodeURIComponent(id)}${page ? `&pagina=${page}` : ""}`,
  reading: "/leyendo",
  bookmarks: "/marcadores",
  analysis: "/analisis",
  curation: "/curaduria",
  curationNew: "/curaduria/nueva",
  curationEdit: (id: string) => `/curaduria/${encodeURIComponent(id)}`,
  security: "/seguridad",
} as const;
