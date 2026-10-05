"use client";

import { Save, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { LICENSE_LABELS, LICENSES, type License, type Work } from "@/features/catalog/types";
import { ApiRequestError, errorMessage } from "@/shared/api/http";
import { routes } from "@/shared/config/routes";
import { Alert } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Field } from "@/shared/ui/field";
import { Input, Textarea } from "@/shared/ui/input";
import { Spinner } from "@/shared/ui/spinner";
import { TagInput } from "@/shared/ui/tag-input";

import { createWork, publishWork, updateWork } from "./api";
import {
  emptyWorkForm,
  formFromWork,
  MAX_TAGS,
  normalizeTag,
  toWorkInput,
  validateWork,
  type WorkFormErrors,
  type WorkFormValues,
} from "./validation";

/** Códigos de error del backend que corresponden a un campo del formulario. */
const FIELD_BY_CODE: Record<string, keyof WorkFormValues> = {
  "catalog.invalid_title": "title",
  "catalog.invalid_author": "author",
  "catalog.invalid_publisher": "publisher",
  "catalog.invalid_description": "description",
  "catalog.invalid_source_url": "sourceUrl",
  "catalog.invalid_cover_url": "coverUrl",
  "catalog.invalid_year": "year",
  "catalog.invalid_page_count": "pageCount",
  "catalog.invalid_tag": "tags",
  "catalog.too_many_tags": "tags",
};

export function WorkForm({ work }: { work?: Work }) {
  const router = useRouter();
  const [values, setValues] = useState<WorkFormValues>(work ? formFromWork(work) : emptyWorkForm);
  const [errors, setErrors] = useState<WorkFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState<"draft" | "publish" | null>(null);

  const set = <K extends keyof WorkFormValues>(name: K, value: WorkFormValues[K]) => setValues((v) => ({ ...v, [name]: value }));
  const text = (name: keyof WorkFormValues) => ({
    value: values[name] as string,
    onChange: (e: { target: { value: string } }) => set(name, e.target.value as never),
  });

  async function save(publish: boolean) {
    const found = validateWork(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setPending(publish ? "publish" : "draft");
    setFormError(null);
    try {
      const input = toWorkInput(values);
      const saved = work ? await updateWork(work.id, input) : await createWork(input);
      if (publish && !saved.published) await publishWork(saved.id);
      router.push(routes.curation);
      router.refresh();
    } catch (caught) {
      const field = caught instanceof ApiRequestError ? FIELD_BY_CODE[caught.code] : undefined;
      if (field) setErrors({ [field]: caught instanceof Error ? caught.message : "Valor no válido." });
      else setFormError(errorMessage(caught));
      setPending(null);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void save(false);
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <Card className="flex flex-col gap-6 p-6 sm:p-8">
        {formError ? <Alert tone="error" title="No se pudo guardar">{formError}</Alert> : null}

        <div className="grid gap-6 md:grid-cols-2">
          <Field label="Título" error={errors.title}>
            <Input {...text("title")} maxLength={200} />
          </Field>
          <Field label="Autor" error={errors.author}>
            <Input {...text("author")} maxLength={120} />
          </Field>
          <Field label="Año" error={errors.year} hint="Opcional. Desde 1800.">
            <Input {...text("year")} inputMode="numeric" maxLength={4} />
          </Field>
          <Field label="Editorial o periódico" error={errors.publisher}>
            <Input {...text("publisher")} maxLength={120} />
          </Field>
        </div>

        <Field label="Descripción" error={errors.description} hint={`${values.description.length}/2000`}>
          <Textarea {...text("description")} maxLength={2000} rows={5} />
        </Field>

        <div className="grid gap-6 md:grid-cols-2">
          <Field label="URL de la fuente" error={errors.sourceUrl} hint="Debe empezar por https://">
            <Input {...text("sourceUrl")} type="url" placeholder="https://" />
          </Field>
          <Field label="URL de la portada" error={errors.coverUrl} hint="Opcional, https://">
            <Input {...text("coverUrl")} type="url" placeholder="https://" />
          </Field>
          <Field label="Licencia">
            <select
              value={values.license}
              onChange={(e) => set("license", e.target.value as License)}
              className="h-12 w-full rounded-[var(--radius-panel)] border-2 border-line bg-surface px-3 focus:shadow-[3px_3px_0_0_var(--pv-accent)] focus:outline-none"
            >
              {LICENSES.map((license) => (
                <option key={license} value={license}>
                  {LICENSE_LABELS[license]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Páginas" error={errors.pageCount} hint="Opcional.">
            <Input {...text("pageCount")} inputMode="numeric" maxLength={4} />
          </Field>
        </div>

        <Field label="Etiquetas" error={errors.tags} hint={`Hasta ${MAX_TAGS}. Enter para agregar.`}>
          <TagInput value={values.tags} onChange={(tags) => set("tags", tags)} normalize={normalizeTag} max={MAX_TAGS} />
        </Field>

        <div className="flex flex-col-reverse gap-3 border-t-2 border-dashed border-line/20 pt-6 sm:flex-row sm:justify-end">
          <Button type="submit" variant="secondary" disabled={pending !== null}>
            {pending === "draft" ? <Spinner label="Guardando" /> : <Save aria-hidden className="size-4" />}
            {work?.published ? "Guardar cambios" : "Guardar borrador"}
          </Button>
          {work?.published ? null : (
            <Button onClick={() => void save(true)} disabled={pending !== null}>
              {pending === "publish" ? <Spinner label="Publicando" /> : <Send aria-hidden className="size-4" />}
              Publicar
            </Button>
          )}
        </div>
      </Card>
    </form>
  );
}
