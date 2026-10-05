export type License = "PUBLIC_DOMAIN" | "CC0" | "CC_BY" | "CC_BY_SA";

/** Obra del catálogo (WorkResponse en Spring). */
export type Work = {
  id: string;
  slug: string;
  title: string;
  author: string;
  year?: number | null;
  publisher?: string | null;
  description?: string | null;
  sourceUrl: string;
  coverUrl?: string | null;
  license: License;
  pageCount?: number | null;
  tags: string[];
  published: boolean;
  publishedAt?: string | null;
  updatedAt: string;
};

export const LICENSE_LABELS: Record<License, string> = {
  PUBLIC_DOMAIN: "Dominio público",
  CC0: "CC0",
  CC_BY: "CC BY",
  CC_BY_SA: "CC BY-SA",
};

export const LICENSES = Object.keys(LICENSE_LABELS) as License[];
