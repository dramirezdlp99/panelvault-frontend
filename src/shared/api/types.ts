/** Página de resultados del backend (PageResult en Spring). */
export type Page<T> = {
  items: T[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
};
