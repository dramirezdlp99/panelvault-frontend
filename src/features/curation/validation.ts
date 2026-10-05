import type { License, Work } from "@/features/catalog/types";

import type { WorkInput } from "./api";

/** Valores crudos del formulario (todo texto, como lo escribe el usuario). */
export type WorkFormValues = {
  title: string;
  author: string;
  year: string;
  publisher: string;
  description: string;
  sourceUrl: string;
  coverUrl: string;
  license: License;
  pageCount: string;
  tags: string[];
};

export type WorkFormErrors = Partial<Record<keyof WorkFormValues, string>>;

export const MAX_TAGS = 10;
export const MAX_TAG_LENGTH = 30;

export const emptyWorkForm: WorkFormValues = {
  title: "",
  author: "",
  year: "",
  publisher: "",
  description: "",
  sourceUrl: "",
  coverUrl: "",
  license: "PUBLIC_DOMAIN",
  pageCount: "",
  tags: [],
};

export function formFromWork(work: Work): WorkFormValues {
  return {
    title: work.title,
    author: work.author,
    year: work.year ? String(work.year) : "",
    publisher: work.publisher ?? "",
    description: work.description ?? "",
    sourceUrl: work.sourceUrl,
    coverUrl: work.coverUrl ?? "",
    license: work.license,
    pageCount: work.pageCount ? String(work.pageCount) : "",
    tags: [...work.tags],
  };
}

/** Igual que el backend: URL absoluta, HTTPS y con dominio (evita javascript: y contenido mixto). */
export function isHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.includes(".");
  } catch {
    return false;
  }
}

/** Limpia una etiqueta; devuelve null si no es válida. */
export function normalizeTag(raw: string): string | null {
  const tag = raw.trim().replace(/\s+/g, " ").toLowerCase();
  if (!tag || tag.length > MAX_TAG_LENGTH || tag.includes(",")) return null;
  return tag;
}

function optionalInt(value: string): number | null | "invalid" {
  if (!value.trim()) return null;
  const n = Number(value);
  return Number.isInteger(n) ? n : "invalid";
}

export function validateWork(values: WorkFormValues, currentYear = new Date().getFullYear()): WorkFormErrors {
  const errors: WorkFormErrors = {};
  if (!values.title.trim()) errors.title = "El título es obligatorio.";
  else if (values.title.trim().length > 200) errors.title = "Máximo 200 caracteres.";
  if (!values.author.trim()) errors.author = "El autor es obligatorio.";
  else if (values.author.trim().length > 120) errors.author = "Máximo 120 caracteres.";
  if (values.publisher.trim().length > 120) errors.publisher = "Máximo 120 caracteres.";
  if (values.description.trim().length > 2000) errors.description = "Máximo 2000 caracteres.";

  const year = optionalInt(values.year);
  if (year === "invalid" || (year !== null && (year < 1800 || year > currentYear))) {
    errors.year = `El año debe estar entre 1800 y ${currentYear}.`;
  }
  const pages = optionalInt(values.pageCount);
  if (pages === "invalid" || (pages !== null && (pages < 1 || pages > 5000))) {
    errors.pageCount = "Las páginas deben estar entre 1 y 5000.";
  }

  if (!values.sourceUrl.trim()) errors.sourceUrl = "La fuente es obligatoria.";
  else if (!isHttpsUrl(values.sourceUrl.trim())) errors.sourceUrl = "Debe empezar por https:// y tener un dominio.";
  if (values.coverUrl.trim() && !isHttpsUrl(values.coverUrl.trim())) errors.coverUrl = "Debe empezar por https://.";
  if (values.tags.length > MAX_TAGS) errors.tags = `Máximo ${MAX_TAGS} etiquetas.`;
  return errors;
}

export function toWorkInput(values: WorkFormValues): WorkInput {
  const text = (v: string) => (v.trim() ? v.trim() : null);
  const int = (v: string) => (v.trim() ? Number(v) : null);
  return {
    title: values.title.trim(),
    author: values.author.trim(),
    year: int(values.year),
    publisher: text(values.publisher),
    description: text(values.description),
    sourceUrl: values.sourceUrl.trim(),
    coverUrl: text(values.coverUrl),
    license: values.license,
    pageCount: int(values.pageCount),
    tags: values.tags,
  };
}
