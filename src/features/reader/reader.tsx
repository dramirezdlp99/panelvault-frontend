"use client";

import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  Expand,
  Keyboard,
  Layers,
  ScanSearch,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

import { getPageBlobs, getComic, getProgress } from "@/features/library/repository";
import { DIRECTION_LABELS } from "@/features/library/types";
import { api } from "@/shared/api/http";
import { routes } from "@/shared/config/routes";
import { useOnlineStatus } from "@/shared/hooks/use-online-status";
import { cn } from "@/shared/lib/cn";
import { getDeviceId } from "@/shared/offline/device";
import { useLocalStore } from "@/shared/offline/local-store";
import type { LocalBookmark, LocalComic, LocalProgress } from "@/shared/offline/types";
import { useBlobUrl } from "@/shared/offline/use-blob-url";
import { useDbQuery } from "@/shared/offline/use-db-query";
import { Badge } from "@/shared/ui/badge";
import { ButtonLink } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { Spinner } from "@/shared/ui/spinner";

import { listBookmarks, mergeRemoteBookmarks, removeBookmark, saveBookmark, type RemoteBookmark } from "./bookmarks";
import { presetFor } from "./panel-maps";
import { PanelNumbers, PanelOverlay, PanelSpotlight } from "./panel-overlay";
import { fitContain, pageTransform, panelTransform, toCss, type Size } from "./panel-viewport";
import { mergeRemoteProgress, saveProgress, progressPath, type RemoteProgress } from "./progress";
import { initialReaderState, keyToAction, readerReducer, resolvedPanel } from "./reader-state";
import { useElementSize } from "./use-element-size";
import { usePanelMap } from "./use-panel-map";

/** Página del lector: lee ?id= y ?pagina= en el navegador (la misma cáscara sirve sin conexión). */
export function ReaderPage() {
  const params = useSearchParams();
  const id = params.get("id") ?? "";
  const startPage = Number(params.get("pagina")) || undefined;
  const { db } = useLocalStore();

  const { data, loading } = useDbQuery(
    db,
    async (d) => {
      const comic = await getComic(d, id);
      if (!comic) return null;
      return { comic, pages: await getPageBlobs(d, id), progress: await getProgress(d, id) };
    },
    [id],
  );

  if (loading) return <ReaderMessage><Spinner label="Abriendo cómic" className="size-8" /></ReaderMessage>;
  if (!data || !data.comic.hasFiles || data.pages.length === 0) {
    return (
      <ReaderMessage>
        <EmptyState icon={Layers} title="No se puede abrir este cómic" action={<ButtonLink href={routes.library}>Volver a la biblioteca</ButtonLink>}>
          Sus páginas no están guardadas en este dispositivo.
        </EmptyState>
      </ReaderMessage>
    );
  }
  return <Reader key={data.comic.id} comic={data.comic} pages={data.pages} savedProgress={data.progress} startPage={startPage} />;
}

function ReaderMessage({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-dvh items-center justify-center bg-[#1c1c20] p-6">{children}</div>;
}

type ReaderProps = { comic: LocalComic; pages: Blob[]; savedProgress?: LocalProgress; startPage?: number };

export function Reader({ comic, pages, savedProgress, startPage }: ReaderProps) {
  const { db, sync } = useLocalStore();
  const online = useOnlineStatus();
  const rtl = comic.readingDirection === "RIGHT_TO_LEFT";
  const preset = presetFor(comic.readingDirection);
  const [state, dispatch] = useReducer(
    readerReducer,
    undefined,
    () =>
      initialReaderState(
        pages.length,
        startPage ?? savedProgress?.currentPage ?? 1,
        startPage ? 0 : (savedProgress?.currentPanel ?? 0),
        savedProgress?.guidedMode ? "guided" : "page",
      ),
  );
  const [toast, setToast] = useState<{ text: string; page?: number } | null>(null);
  const [imageSize, setImageSize] = useState<Size | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const viewport = useElementSize(stageRef);

  const blob = pages[state.page - 1];
  const url = useBlobUrl(blob);
  const wantsPanels = state.mode === "guided" || state.showPanels;
  const panelMap = usePanelMap(db, blob, preset, wantsPanels);
  const nextMap = usePanelMap(db, pages[state.page], preset, state.mode === "guided" && state.page < pages.length);
  const panels = useMemo(() => (panelMap.status === "ready" ? panelMap.panels : []), [panelMap]);
  const panelIndex = resolvedPanel(state);

  useEffect(() => {
    if (panelMap.status === "ready") dispatch({ type: "panelsLoaded", page: state.page, count: panelMap.panels.length });
  }, [panelMap, state.page]);
  useEffect(() => {
    if (nextMap.status === "ready") dispatch({ type: "panelsLoaded", page: state.page + 1, count: nextMap.panels.length });
  }, [nextMap, state.page]);

  // Bookmarks de esta página y lista completa.
  const { data: bookmarks } = useDbQuery(db, (d) => listBookmarks(d, comic.id), [comic.id]);
  const pageBookmark = bookmarks?.find((b) => b.page === state.page);

  // Guarda el progreso (con una pequeña espera para no escribir en cada clic).
  useEffect(() => {
    if (!db) return;
    const timer = window.setTimeout(() => {
      void saveProgress(db, {
        comicId: comic.id,
        currentPage: state.page,
        currentPanel: state.mode === "guided" ? panelIndex : 0,
        guidedMode: state.mode === "guided",
        totalPages: pages.length,
        clientUpdatedAt: new Date().toISOString(),
        deviceId: getDeviceId(),
      });
    }, 600);
    return () => window.clearTimeout(timer);
  }, [db, comic.id, state.page, state.mode, panelIndex, pages.length]);

  // Con conexión: trae progreso y marcadores de otros dispositivos.
  useEffect(() => {
    if (!db || !online) return;
    let active = true;
    api<RemoteProgress>(progressPath(comic.id))
      .then((remote) => mergeRemoteProgress(db, remote))
      .then((adopted) => {
        if (active && adopted && adopted.currentPage !== state.page && adopted.deviceId !== getDeviceId()) {
          setToast({ text: `En otro dispositivo ibas en la página ${adopted.currentPage}.`, page: adopted.currentPage });
        }
      })
      // 404 = aún no hay progreso en el servidor; cualquier otro error se ignora (se reintenta al volver).
      .catch(() => undefined);
    api<RemoteBookmark[]>(`/reading/comics/${encodeURIComponent(comic.id)}/bookmarks`)
      .then((remote) => mergeRemoteBookmarks(db, remote))
      .catch(() => undefined);
    return () => {
      active = false;
    };
    // Solo al abrir el cómic (o al recuperar la conexión).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, online, comic.id]);

  // Teclado.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      const action = keyToAction(event.key, rtl);
      if (action) {
        event.preventDefault();
        dispatch(action);
      } else if (event.key === "g" || event.key === "G") {
        dispatch({ type: "setMode", mode: state.mode === "guided" ? "page" : "guided" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [rtl, state.mode]);

  // Gestos: deslizar o tocar los bordes.
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  function onPointerDown(event: ReactPointerEvent) {
    pointerStart.current = { x: event.clientX, y: event.clientY };
  }
  function onPointerUp(event: ReactPointerEvent) {
    const start = pointerStart.current;
    pointerStart.current = null;
    if (!start || !stageRef.current) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    let forward: boolean | null = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) forward = dx < 0;
    else if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
      const rect = stageRef.current.getBoundingClientRect();
      const relative = (event.clientX - rect.left) / rect.width;
      if (relative > 0.7) forward = true;
      else if (relative < 0.3) forward = false;
    }
    if (forward === null) return;
    if (rtl) forward = !forward;
    dispatch({ type: forward ? "next" : "prev" });
  }

  const base = useMemo(() => (imageSize ? fitContain(imageSize, viewport) : null), [imageSize, viewport]);
  const transform = useMemo(() => {
    if (!base) return null;
    const panel = panels[panelIndex];
    return state.mode === "guided" && panel ? panelTransform(panel.bbox, base, viewport) : pageTransform(base, viewport);
  }, [base, panels, panelIndex, state.mode, viewport]);

  const toggleBookmark = useCallback(async () => {
    if (!db) return;
    if (pageBookmark) {
      await removeBookmark(db, pageBookmark.id);
      setToast({ text: `Marcador de la página ${state.page} eliminado.` });
    } else {
      const bookmark: LocalBookmark = { id: crypto.randomUUID(), comicId: comic.id, page: state.page, note: null, createdAt: new Date().toISOString() };
      await saveBookmark(db, bookmark);
      setToast({ text: `Página ${state.page} guardada en tus marcadores. Puedes añadirle una nota desde Marcadores.` });
    }
  }, [db, pageBookmark, comic.id, state.page]);

  useEffect(() => {
    if (!toast || toast.page) return;
    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const PrevIcon = rtl ? ChevronRight : ChevronLeft;
  const NextIcon = rtl ? ChevronLeft : ChevronRight;
  const guided = state.mode === "guided";

  return (
    <div className="flex h-dvh flex-col bg-[#1c1c20] text-[#efeae0]">
      <header className="flex items-center gap-3 border-b-2 border-black bg-surface px-3 py-2 text-ink sm:px-5">
        <Link href={routes.comic(comic.id)} aria-label="Salir del lector" className="inline-flex size-10 items-center justify-center rounded-[var(--radius-panel)] border-2 border-line bg-surface shadow-hard-sm press">
          <ArrowLeft aria-hidden className="size-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="hidden font-mono text-[10px] font-bold uppercase text-ink-muted sm:block">Leyendo</p>
          <h1 className="truncate font-display text-lg font-extrabold uppercase leading-tight">{comic.title}</h1>
        </div>
        <div role="group" aria-label="Modo de lectura" className="inline-flex rounded-[var(--radius-chip)] border-2 border-line bg-surface p-0.5">
          {(
            [
              ["page", "Página completa"],
              ["guided", "Viñeta por viñeta"],
            ] as const
          ).map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              aria-pressed={state.mode === mode}
              onClick={() => dispatch({ type: "setMode", mode })}
              className={cn("rounded-[4px] px-2 py-1 font-mono text-[11px] font-bold uppercase sm:px-3", state.mode === mode ? "bg-accent text-on-accent" : "hover:bg-surface-muted")}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          aria-pressed={state.showPanels}
          onClick={() => dispatch({ type: "toggleOverlay" })}
          className={cn("hidden h-10 items-center gap-2 rounded-[var(--radius-panel)] border-2 border-line px-3 font-mono text-[11px] font-bold uppercase sm:inline-flex", state.showPanels ? "bg-ai text-[#16161a]" : "bg-surface")}
        >
          <ScanSearch aria-hidden className="size-4" />
          Mostrar viñetas
        </button>
        <button
          type="button"
          aria-label="Pantalla completa"
          onClick={() => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.())}
          className="hidden size-10 items-center justify-center rounded-[var(--radius-panel)] border-2 border-line bg-surface md:inline-flex"
        >
          <Expand aria-hidden className="size-4" />
        </button>
      </header>

      <div className="flex min-h-0 flex-1">
        <div
          ref={stageRef}
          role="region"
          aria-label={`Página ${state.page} de ${pages.length}`}
          className="relative min-w-0 flex-1 touch-none select-none overflow-hidden [background-image:radial-gradient(rgb(239_234_224/0.06)_1px,transparent_1px)] [background-size:16px_16px]"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
        >
          {url ? (
            <div
              className="absolute left-0 top-0 origin-top-left transition-transform duration-300 ease-out motion-reduce:transition-none"
              style={{ width: base?.width ?? "100%", height: base?.height ?? "100%", transform: transform ? toCss(transform) : undefined, visibility: base ? "visible" : "hidden" }}
            >
              {/* La página es un Blob local; next/image no aplica. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Página ${state.page} de ${comic.title}`}
                draggable={false}
                onLoad={(e) => setImageSize({ width: e.currentTarget.naturalWidth, height: e.currentTarget.naturalHeight })}
                className="h-full w-full bg-white shadow-[6px_6px_0_0_#000]"
              />
              {guided && panels[panelIndex] ? <PanelSpotlight panel={panels[panelIndex]} /> : null}
              {state.showPanels && panels.length > 0 ? (
                <>
                  <PanelOverlay panels={panels} current={guided ? panelIndex : undefined} />
                  <PanelNumbers panels={panels} current={guided ? panelIndex : undefined} />
                </>
              ) : null}
            </div>
          ) : null}

          {wantsPanels && panelMap.status === "loading" ? (
            <p role="status" className="absolute left-1/2 top-4 -translate-x-1/2 rounded-[var(--radius-chip)] border-2 border-black bg-ai px-3 py-1 font-mono text-xs font-bold text-[#16161a]">
              {panelMap.detail ?? "Buscando las viñetas…"}
            </p>
          ) : null}
          {wantsPanels && panelMap.status === "unavailable" ? (
            <p role="status" className="absolute left-1/2 top-4 max-w-[90%] -translate-x-1/2 rounded-[var(--radius-chip)] border-2 border-black bg-highlight px-3 py-1 text-center font-mono text-xs font-bold text-[#16161a]">
              {panelMap.reason} Se muestra la página completa.
            </p>
          ) : null}
        </div>

        {guided ? (
          <aside aria-label="Viñeta por viñeta" className="hidden w-80 shrink-0 flex-col gap-4 overflow-y-auto border-l-2 border-black bg-surface p-5 text-ink lg:flex">
            <div className="flex flex-wrap gap-2">
              <Badge tone="ai">Modo viñeta dirigida</Badge>
              {panels.length > 0 ? <Badge>{`Viñeta ${panelIndex + 1} de ${panels.length}`}</Badge> : null}
            </div>
            {url ? (
              <div className="relative overflow-hidden rounded-[var(--radius-chip)] border-2 border-line">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="block w-full" />
                {panels.length > 0 ? <PanelOverlay panels={panels} current={panelIndex} /> : null}
              </div>
            ) : null}
            {panels.length > 0 ? (
              <ol className="flex gap-1" aria-label="Recorrido de lectura">
                {panels.map((_, i) => (
                  <li key={i} className={cn("h-2 flex-1 rounded-full border border-line", i < panelIndex ? "bg-ai" : i === panelIndex ? "bg-accent" : "bg-surface-muted")}>
                    <span className="sr-only">{`Viñeta ${i + 1}${i === panelIndex ? " (actual)" : ""}`}</span>
                  </li>
                ))}
              </ol>
            ) : null}
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => dispatch({ type: "prev" })} className="rounded-[var(--radius-panel)] border-2 border-line bg-surface px-3 py-2 font-display font-bold uppercase shadow-hard-sm press">
                Anterior
              </button>
              <button type="button" onClick={() => dispatch({ type: "next" })} className="rounded-[var(--radius-panel)] border-2 border-line bg-accent px-3 py-2 font-display font-bold uppercase text-on-accent shadow-hard-sm press">
                Siguiente
              </button>
            </div>
            <div className="mt-auto flex gap-3 rounded-[var(--radius-panel)] border-2 border-line bg-surface-muted p-3 text-sm">
              <Keyboard aria-hidden className="size-5 shrink-0" />
              <p>
                Flechas, <kbd className="font-mono font-bold">A</kbd>/<kbd className="font-mono font-bold">D</kbd> o espacio para avanzar.{" "}
                <kbd className="font-mono font-bold">G</kbd> cambia de modo y <kbd className="font-mono font-bold">V</kbd> muestra las viñetas.
              </p>
            </div>
          </aside>
        ) : null}
      </div>

      <footer className="flex flex-wrap items-center gap-3 border-t-2 border-black bg-surface px-3 py-2 text-ink sm:px-5">
        <button type="button" aria-label={guided ? "Viñeta anterior" : "Página anterior"} onClick={() => dispatch({ type: "prev" })} className="inline-flex size-10 items-center justify-center rounded-[var(--radius-panel)] border-2 border-line bg-surface shadow-hard-sm press">
          <PrevIcon aria-hidden className="size-5" />
        </button>
        <button type="button" aria-label={guided ? "Siguiente viñeta" : "Página siguiente"} onClick={() => dispatch({ type: "next" })} className="inline-flex size-10 items-center justify-center rounded-[var(--radius-panel)] border-2 border-line bg-accent text-on-accent shadow-hard-sm press">
          <NextIcon aria-hidden className="size-5" />
        </button>
        <span className="font-mono text-sm font-bold" aria-live="polite">
          {state.page} / {pages.length}
          {guided && panels.length > 0 ? <span className="ml-2 text-ai-ink lg:hidden">{`· V${panelIndex + 1}/${panels.length}`}</span> : null}
        </span>
        <input
          type="range"
          min={1}
          max={pages.length}
          value={state.page}
          onChange={(e) => dispatch({ type: "goToPage", page: Number(e.target.value) })}
          aria-label="Ir a la página"
          dir={rtl ? "rtl" : "ltr"}
          className="min-w-24 flex-1 accent-[var(--pv-accent)]"
        />
        <button
          type="button"
          onClick={() => void toggleBookmark()}
          disabled={!db}
          aria-pressed={Boolean(pageBookmark)}
          aria-label={pageBookmark ? "Quitar marcador de esta página" : "Marcar esta página"}
          className={cn("inline-flex size-10 items-center justify-center rounded-[var(--radius-panel)] border-2 border-line shadow-hard-sm press", pageBookmark ? "bg-highlight text-on-highlight" : "bg-surface")}
        >
          {pageBookmark ? <BookmarkCheck aria-hidden className="size-5" /> : <Bookmark aria-hidden className="size-5" />}
        </button>
        <Badge tone="neutral" className="hidden sm:inline-flex">{DIRECTION_LABELS[comic.readingDirection]}</Badge>
        <span className="hidden font-mono text-[11px] uppercase text-ink-muted md:inline">
          {sync.pending > 0 ? (online ? "Sincronizando…" : "Guardado en el dispositivo") : "Progreso sincronizado"}
        </span>
      </footer>

      {toast ? (
        <div role="status" className="fixed bottom-20 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-[var(--radius-panel)] border-2 border-black bg-surface px-4 py-2 text-sm font-semibold text-ink shadow-hard">
          {toast.text}
          {toast.page ? (
            <>
              <button type="button" className="font-bold text-accent underline" onClick={() => { dispatch({ type: "goToPage", page: toast.page! }); setToast(null); }}>
                Ir allí
              </button>
              <button type="button" className="text-ink-muted underline" onClick={() => setToast(null)}>
                Seguir aquí
              </button>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
