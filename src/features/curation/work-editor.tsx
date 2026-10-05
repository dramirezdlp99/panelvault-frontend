"use client";

import { useEffect, useState } from "react";

import type { Work } from "@/features/catalog/types";
import { errorMessage } from "@/shared/api/http";
import { Alert } from "@/shared/ui/alert";
import { Spinner } from "@/shared/ui/spinner";

import { getWork } from "./api";
import { WorkForm } from "./work-form";

/** Carga la obra por id y muestra el formulario de edición. */
export function WorkEditor({ id }: { id: string }) {
  const [work, setWork] = useState<Work | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getWork(id)
      .then((w) => active && setWork(w))
      .catch((e: unknown) => active && setError(errorMessage(e)));
    return () => {
      active = false;
    };
  }, [id]);

  if (error) return <Alert tone="error" title="No se pudo cargar la obra">{error}</Alert>;
  if (!work) return <Spinner label="Cargando obra" />;
  return <WorkForm work={work} />;
}
