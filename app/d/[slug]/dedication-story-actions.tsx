"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

import styles from "./page.module.css";

type StoryData = {
  artist: string;
  message: string;
  recipientName: string;
  senderName: string;
  song: string;
};

type StoryRenderer = {
  render: (data: StoryData, style: string) => Promise<Blob>;
};

declare global {
  interface Window {
    LuisFelipeDedicationStory?: StoryRenderer;
  }
}

type DedicationStoryActionsProps = StoryData & { storyStyle: string };
type Status = { tone: "error" | "info" | "success"; message: string } | null;

const fileName = "dedicatoria-luis-felipe-iv.png";

function saveBlob(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function DedicationStoryActions({ storyStyle, ...data }: DedicationStoryActionsProps) {
  const [scriptReady, setScriptReady] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [preparing, setPreparing] = useState(true);
  const [busy, setBusy] = useState<"download" | "share" | null>(null);
  const [status, setStatus] = useState<Status>(null);
  const blobRef = useRef<Blob | null>(null);
  const dataRef = useRef(data);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!scriptReady) return;
    let active = true;
    let url = "";

    window.LuisFelipeDedicationStory?.render(dataRef.current, storyStyle)
      .then((blob) => {
        if (!active) return;
        blobRef.current = blob;
        url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      })
      .catch(() => {
        if (active) setStatus({ tone: "error", message: "No pudimos preparar la imagen. Recarga la página para intentarlo de nuevo." });
      })
      .finally(() => {
        if (active) setPreparing(false);
      });

    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [scriptReady, storyStyle]);

  async function getBlob() {
    if (blobRef.current) return blobRef.current;
    const renderer = window.LuisFelipeDedicationStory;
    if (!renderer) throw new Error("La imagen todavía se está preparando. Inténtalo en un momento.");
    blobRef.current = await renderer.render(dataRef.current, storyStyle);
    return blobRef.current;
  }

  async function download() {
    setBusy("download");
    setStatus(null);
    try {
      saveBlob(await getBlob());
      setStatus({ tone: "success", message: "Imagen guardada. Súbela a tus historias desde tu galería." });
    } catch (error) {
      setStatus({ tone: "error", message: error instanceof Error ? error.message : "No pudimos descargar la imagen." });
    } finally {
      setBusy(null);
    }
  }

  async function share() {
    setBusy("share");
    setStatus(null);
    try {
      const blob = await getBlob();
      const file = new File([blob], fileName, { type: "image/png" });
      if (!navigator.share || !navigator.canShare?.({ files: [file] })) {
        saveBlob(blob);
        setStatus({ tone: "info", message: "Tu navegador no permite compartir imágenes directamente, así que la descargamos. Súbela desde tu galería a Instagram." });
        return;
      }
      await navigator.share({ files: [file], title: "Mi dedicatoria musical", text: "Una canción puede decirlo todo." });
      setStatus({ tone: "success", message: "Imagen lista para compartir." });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setStatus({ tone: "info", message: "No se compartió la imagen. Puedes intentarlo de nuevo." });
        return;
      }
      setStatus({ tone: "error", message: error instanceof Error ? error.message : "No pudimos compartir la imagen." });
    } finally {
      setBusy(null);
    }
  }

  const disabled = preparing || busy !== null || !previewUrl;
  const previewAlt = `Imagen para historias de la dedicatoria para ${data.recipientName}`;

  function openPreview() {
    if (previewUrl) dialogRef.current?.showModal();
  }

  const actions = (
    <div className={styles.storyActions}>
      <button aria-busy={busy === "share"} className={styles.storyPrimary} disabled={disabled} onClick={share} type="button">
        {busy === "share" ? <><span aria-hidden="true" className={styles.spinner} />Preparando…</> : <><ShareIcon />Compartir</>}
      </button>
      <button aria-busy={busy === "download"} className={styles.storySecondary} disabled={disabled} onClick={download} type="button">
        {busy === "download" ? <><span aria-hidden="true" className={styles.spinner} />Descargando…</> : <><DownloadIcon />Descargar</>}
      </button>
    </div>
  );

  return (
    <section aria-labelledby="story-actions-title" className={styles.storyPanel}>
      <Script
        onError={() => {
          setPreparing(false);
          setStatus({ tone: "error", message: "No pudimos cargar el generador de la imagen. Revisa tu conexión y recarga la página." });
        }}
        onReady={() => setScriptReady(true)}
        src="/dedication-story.js"
        strategy="afterInteractive"
      />
      <button
        aria-busy={preparing}
        aria-label={previewUrl ? "Ver la imagen en grande" : "La imagen se está preparando"}
        className={styles.storyThumb}
        disabled={!previewUrl}
        onClick={openPreview}
        type="button"
      >
        {previewUrl ? (
          // Blob URLs from the canvas renderer cannot go through next/image.
          // eslint-disable-next-line @next/next/no-img-element
          <img alt="" height={480} src={previewUrl} width={270} />
        ) : (
          <span className={styles.storyThumbPlaceholder}>
            {preparing ? <span aria-hidden="true" className={styles.spinner} /> : "Sin vista previa"}
          </span>
        )}
        {previewUrl ? <span aria-hidden="true" className={styles.storyThumbZoom}><ZoomIcon /></span> : null}
      </button>
      <div className={styles.storyCopy}>
        <p className={styles.storyKicker}>Para historias</p>
        <h3 className={styles.storyTitle} id="story-actions-title">Llévala a Instagram</h3>
        <p className={styles.storyText}>{preparing ? "Preparando tu imagen vertical…" : "Imagen vertical lista para tus historias."}</p>
      </div>
      {actions}
      <p aria-live="polite" className={styles.storyStatus} data-tone={status?.tone} hidden={!status}>{status?.message}</p>

      <dialog aria-label={previewAlt} className={styles.storyDialog} onClick={(event) => { if (event.target === event.currentTarget) event.currentTarget.close(); }} ref={dialogRef}>
        <div className={styles.storyDialogInner}>
          <button aria-label="Cerrar vista previa" className={styles.storyDialogClose} onClick={() => dialogRef.current?.close()} type="button">×</button>
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt={previewAlt} className={styles.storyDialogImage} height={1920} src={previewUrl} width={1080} />
          ) : null}
          {actions}
        </div>
      </dialog>
    </section>
  );
}

function ShareIcon() {
  return <svg aria-hidden="true" fill="none" height="15" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="15"><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" /><polyline points="16 6 12 2 8 6" /><line x1="12" x2="12" y1="2" y2="15" /></svg>;
}

function DownloadIcon() {
  return <svg aria-hidden="true" fill="none" height="15" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="15"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>;
}

function ZoomIcon() {
  return <svg aria-hidden="true" fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="14"><polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" x2="14" y1="3" y2="10" /><line x1="3" x2="10" y1="21" y2="14" /></svg>;
}
