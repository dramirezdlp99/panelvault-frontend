import type { License, Work } from "@/features/catalog/types";
import { api } from "@/shared/api/http";
import type { Page } from "@/shared/api/types";

/** Datos que envía el formulario de curaduría (WorkRequest en Spring). */
export type WorkInput = {
  title: string;
  author: string;
  year: number | null;
  publisher: string | null;
  description: string | null;
  sourceUrl: string;
  coverUrl: string | null;
  license: License;
  pageCount: number | null;
  tags: string[];
};

export function listWorks(query: string, page: number): Promise<Page<Work>> {
  const params = new URLSearchParams({ page: String(page), size: "20" });
  if (query) params.set("q", query);
  return api<Page<Work>>(`/curation/works?${params}`);
}

export const getWork = (id: string) => api<Work>(`/curation/works/${encodeURIComponent(id)}`);
export const createWork = (input: WorkInput) => api<Work>("/curation/works", { method: "POST", json: input });
export const updateWork = (id: string, input: WorkInput) =>
  api<Work>(`/curation/works/${encodeURIComponent(id)}`, { method: "PUT", json: input });
export const publishWork = (id: string) => api<Work>(`/curation/works/${encodeURIComponent(id)}/publish`, { method: "POST" });
export const unpublishWork = (id: string) =>
  api<Work>(`/curation/works/${encodeURIComponent(id)}/unpublish`, { method: "POST" });
export const deleteWork = (id: string) => api<null>(`/curation/works/${encodeURIComponent(id)}`, { method: "DELETE" });
