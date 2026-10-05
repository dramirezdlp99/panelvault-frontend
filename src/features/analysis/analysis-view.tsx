"use client";

import { CheckCircle2, Clock, FileImage, LoaderCircle, RotateCcw, ScanSearch, XCircle } from "lucide-react";
import { useId, useState, type DragEvent } from "react";

import { panelsFromPayload, type AnalysisPayload, type Preset } from "@/features/reader/panel-maps";
import { PanelNumbers, PanelOverlay } from "@/features/reader/panel-overlay";
import { CopyButton } from "@/features/security/copy-button";
import { errorMessage } from "@/shared/api/http";
import { cn } from "@/shared/lib/cn";
import { useBlobUrl } from "@/shared/offline/use-blob-url";
import { Alert } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";

import { InvalidImageError, runAnalysis, validateImage, type AnalysisOutcome, type AnalysisUpdate } from "./analysis-flow";

const STAGE_NAMES: Record<string, string> = {
  normalize: "Normalización",
  gutter: "Color del medianil",
  binarize: "Separación de viñetas",
  xycut: "Cortes XY",
  refine: "Refinamiento",
  order: "Orden de lectura",
  ordering: "Orden de lectura",
  assemble: "Ensamblado",
};

const TIMELINE: Array<{ key: "PENDING" | "RUNNING" | "SUCCEEDED"; label: string }> = [
  { key: "PENDING", label: "En cola" },
  { key: "RUNNING", label: "Procesando" },
  { key: "SUCCEEDED", label: "Completado" },
];

function timelineIndex(update: AnalysisUpdate | null): number {
  if (!update) return -1;
  if (update.step === "uploading") return 0;
  if (update.step === "FAILED") return -1;
  return TIMELINE.findIndex((t) => t.key === update.step);
}

export function AnalysisView() {
  const inputId = useId();
  const [file, setFile] = useState<File | null>(null);
  const [preset, setPreset] = useState<Preset>("western");
  const [update, setUpdate] = useState<AnalysisUpdate | null>(null);
  const [outcome, setOutcome] = useState<AnalysisOutcome | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const url = useBlobUrl(file);
  const running = update !== null && outcome === null && error === null;

  function choose(selected: File | undefined) {
    setOutcome(null);
    setUpdate(null);
    setError(null);
    if (!selected) return;
    try {
      validateImage(selected);
      setFile(selected);
    } catch (caught) {
      setFile(null);
      setError(caught instanceof InvalidImageError ? caught.message : "Archivo no válido.");
    }
  }

  async function analyze() {
    if (!file) return;
    setOutcome(null);
    setError(null);
    setUpdate({ step: "uploading" });
    try {
      setOutcome(await runAnalysis(file, preset, setUpdate));
    } catch (caught) {
      setError(errorMessage(caught));
      setUpdate(null);
    }
  }

  const payload: AnalysisPayload | null = outcome?.kind === "done" ? outcome.payload : null;
  const panels = panelsFromPayload(payload);
  const stepIndex = timelineIndex(update);

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card className="flex flex-col gap-5 p-6">
          <h2 className="font-display text-xl font-extrabold uppercase">Cargar página</h2>
          <label
            htmlFor={inputId}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e: DragEvent<HTMLLabelElement>) => {
              e.preventDefault();
              setDragging(false);
              choose(e.dataTransfer.files[0]);
            }}
            className={cn(
              "flex cursor-pointer flex-col items-center gap-3 rounded-[var(--radius-panel)] border-2 border-dashed p-8 text-center",
              dragging ? "border-accent bg-highlight/30" : "border-line bg-paper",
            )}
          >
            <FileImage aria-hidden className="size-8" />
            <span className="font-semibold">{file ? file.name : "Arrastra una página (JPEG, PNG o WebP, máx. 10 MB)"}</span>
            <span className="text-sm text-ink-muted">o haz clic para elegirla</span>
          </label>
          <input id={inputId} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="Elegir imagen de la página" onChange={(e) => choose(e.target.files?.[0])} />

          <fieldset>
            <legend className="mb-2 font-mono text-[11px] font-bold uppercase text-ink-muted">Dirección de lectura</legend>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ["western", "Occidental (izq. → der.)"],
                  ["manga", "Manga (der. → izq.)"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={preset === value}
                  onClick={() => setPreset(value)}
                  className={cn("rounded-[var(--radius-chip)] border-2 border-line px-3 py-2 font-mono text-xs font-bold uppercase", preset === value ? "bg-accent text-on-accent" : "bg-surface")}
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>

          <Button size="lg" onClick={() => void analyze()} disabled={!file || running}>
            {running ? <LoaderCircle aria-hidden className="size-5 animate-spin" /> : <ScanSearch aria-hidden className="size-5" />}
            Analizar página
          </Button>
          {error ? <Alert tone="error">{error}</Alert> : null}
        </Card>

        <Card tone="ai" className="flex flex-col gap-5 p-6">
          <h2 className="font-display text-xl font-extrabold uppercase">Estado del trabajo</h2>
          <ol className="grid grid-cols-3 gap-2" aria-label="Avance del análisis">
            {TIMELINE.map((item, index) => {
              const done = stepIndex > index || (index === 2 && outcome?.kind === "done");
              const current = stepIndex === index && !done;
              return (
                <li key={item.key} className="flex flex-col items-center gap-2 text-center" aria-current={current ? "step" : undefined}>
                  <span
                    className={cn(
                      "inline-flex size-10 items-center justify-center rounded-full border-2",
                      done ? "border-line bg-ai text-[#16161a]" : current ? "border-ai bg-paper text-ai-ink" : "border-line/30 bg-surface-muted text-ink-muted",
                    )}
                  >
                    {done ? <CheckCircle2 aria-hidden className="size-5" /> : current ? <LoaderCircle aria-hidden className="size-5 animate-spin" /> : <Clock aria-hidden className="size-5" />}
                  </span>
                  <span className="font-mono text-[11px] font-bold uppercase">{item.label}</span>
                </li>
              );
            })}
          </ol>
          <div className="flex flex-wrap gap-2" role="status">
            {!update && !outcome ? <p className="text-sm text-ink-muted">Elige una página y presiona “Analizar página”.</p> : null}
            {update?.attempts && update.attempts > 1 && update.step !== "FAILED" ? (
              <Badge>
                <RotateCcw aria-hidden className="size-3" />
                {`Reintentando (intento ${update.attempts} de 5)`}
              </Badge>
            ) : null}
            {outcome?.kind === "done" && outcome.cached ? <Badge>Resultado de la caché</Badge> : null}
            {outcome?.kind === "done" ? <Badge tone="success">{`${panels.length} viñetas detectadas`}</Badge> : null}
            {outcome?.kind === "failed" ? (
              <Badge tone="accent">
                <XCircle aria-hidden className="size-3" />
                Fallido
              </Badge>
            ) : null}
            {outcome?.kind === "timeout" ? <Badge tone="neutral">Sigue en proceso; vuelve a intentarlo en un momento.</Badge> : null}
          </div>
          {outcome?.kind === "failed" ? <Alert tone="error">{outcome.reason}</Alert> : null}
          {outcome ? (
            <dl className="grid gap-2 rounded-[var(--radius-chip)] border-2 border-line bg-surface-muted p-3 font-mono text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <dt className="font-bold uppercase">SHA-256</dt>
                <dd className="flex items-center gap-2 break-all">
                  {`${outcome.sha256.slice(0, 12)}…${outcome.sha256.slice(-8)}`}
                  <CopyButton text={outcome.sha256} label="Copiar" />
                </dd>
              </div>
              {payload?.engineVersion ? (
                <div className="flex justify-between">
                  <dt className="font-bold uppercase">Motor</dt>
                  <dd>v{payload.engineVersion}</dd>
                </div>
              ) : null}
              {payload?.imageWidth ? (
                <div className="flex justify-between">
                  <dt className="font-bold uppercase">Resolución</dt>
                  <dd>
                    {payload.imageWidth} × {payload.imageHeight} px
                  </dd>
                </div>
              ) : null}
            </dl>
          ) : null}
        </Card>
      </div>

      {payload && url ? (
        <Card className="grid gap-8 p-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div>
            <h2 className="mb-4 font-display text-xl font-extrabold uppercase">Viñetas detectadas</h2>
            <div className="relative mx-auto max-w-xl overflow-hidden rounded-[var(--radius-chip)] border-2 border-line">
              {/* La imagen es un archivo local del usuario. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="Página analizada con sus viñetas marcadas" className="block w-full" />
              <PanelOverlay panels={panels} />
              <PanelNumbers panels={panels} />
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <section aria-labelledby="lista-vinetas">
              <h3 id="lista-vinetas" className="mb-3 font-mono text-xs font-bold uppercase text-ink-muted">
                Orden de lectura · confianza
              </h3>
              <ol className="flex flex-col gap-2">
                {panels.map((panel, i) => (
                  <li key={i} className="flex items-center gap-3 rounded-[var(--radius-chip)] border-2 border-ai bg-paper px-3 py-2">
                    <span className="inline-flex size-7 items-center justify-center rounded-full border-2 border-line bg-ai font-mono text-xs font-bold text-[#16161a]">{i + 1}</span>
                    <span className="flex-1 font-semibold">Viñeta {i + 1}</span>
                    <span className="font-mono text-xs">{Math.round(panel.confidence * 100)}%</span>
                  </li>
                ))}
              </ol>
            </section>
            {payload.stages ? (
              <section aria-labelledby="tiempos">
                <h3 id="tiempos" className="mb-3 font-mono text-xs font-bold uppercase text-ink-muted">
                  Tiempo por etapa
                </h3>
                <table className="w-full border-collapse font-mono text-xs">
                  <tbody>
                    {Object.entries(payload.stages).map(([stage, ms]) => (
                      <tr key={stage} className="border-b border-line/20">
                        <th scope="row" className="py-1.5 text-left font-normal">{STAGE_NAMES[stage] ?? stage}</th>
                        <td className="py-1.5 text-right">{ms.toFixed(1)} ms</td>
                      </tr>
                    ))}
                    {payload.elapsedMs !== undefined ? (
                      <tr className="bg-highlight text-on-highlight">
                        <th scope="row" className="px-1 py-1.5 text-left font-bold">Total</th>
                        <td className="px-1 py-1.5 text-right font-bold">{payload.elapsedMs.toFixed(1)} ms</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </section>
            ) : null}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
