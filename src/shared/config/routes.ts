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
  register: "/registro",
  library: "/biblioteca",
} as const;
