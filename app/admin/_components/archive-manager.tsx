"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";

import type { ArchiveItemDraft, ArchiveItemViewModel } from "@/lib/admin/models";
import {
  validateArchiveItemDraft,
  type ArchiveItemDraftErrors,
} from "@/lib/admin/validation";

import styles from "../admin.module.css";
import { AdminFeedbackRegion, AdminTextField, MoveIcon, Spinner, VisibilityField } from "./form-controls";
import { MediaPicker } from "./media-picker";
import { useSiteContentMutations } from "./use-site-content-mutations";

type ArchiveManagerProps = {
  initialItems: ArchiveItemViewModel[];
};

const emptyArchiveItem: ArchiveItemDraft = {
  title: "",
  subtitle: "",
  metric: "",
  destinationUrl: "",
  imagePath: "",
  imageAlt: "",
  visible: true,
};

function sortItems(items: ArchiveItemViewModel[]) {
  return [...items].sort((first, second) => first.order - second.order);
}

type LookupStatus = { tone: "error" | "loading" | "success"; message: string };

function isVideoThumbnail(url: string) {
  try {
    const host = new URL(url).hostname;
    return host === "i.ytimg.com" || host.endsWith(".cdninstagram.com") || host.endsWith(".tiktokcdn.com");
  } catch {
    return false;
  }
}

export function ArchiveManager({ initialItems }: ArchiveManagerProps) {
  const firstItem = sortItems(initialItems)[0];
  const [items, setItems] = useState(initialItems);
  const [selectedId, setSelectedId] = useState<string | null>(firstItem?.id ?? null);
  const [draft, setDraft] = useState<ArchiveItemDraft>(firstItem ? { ...firstItem } : emptyArchiveItem);
  const [errors, setErrors] = useState<ArchiveItemDraftErrors>({});
  const [thumbnailStatus, setThumbnailStatus] = useState<LookupStatus | null>(null);
  const lastAutoTitle = useRef("");
  const previousDestinationUrl = useRef(draft.destinationUrl);
  const lookupRequested = useRef(false);
  const [lookupAttempt, setLookupAttempt] = useState(0);
  const manualImageOverride = useRef(Boolean(firstItem?.imagePath && !isVideoThumbnail(firstItem.imagePath)));
  const { announcement, dismissFeedback, feedback, notify, pendingAction, reorder, save, saving, setAnnouncement } = useSiteContentMutations("archive");
  const sortedItems = useMemo(() => sortItems(items), [items]);
  const isCreating = selectedId === null;

  useEffect(() => {
    if (previousDestinationUrl.current !== draft.destinationUrl) {
      previousDestinationUrl.current = draft.destinationUrl;
      manualImageOverride.current = false;
      setDraft((current) => current.destinationUrl === draft.destinationUrl && current.imagePath
        ? { ...current, imagePath: "", imageAlt: "" }
        : current);
    }
  }, [draft.destinationUrl]);

  useEffect(() => {
    const destinationUrl = draft.destinationUrl.trim();
    if (!destinationUrl || !lookupRequested.current) return;
    lookupRequested.current = false;

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setThumbnailStatus({ tone: "loading", message: "Buscando el video…" });
      try {
        const response = await fetch("/api/admin/archive/thumbnail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ destinationUrl }),
          signal: controller.signal,
        });
        const payload = await response.json() as { imageUrl?: string; provider?: string; title?: string; error?: string };
        if (!response.ok || !payload.imageUrl) throw new Error(payload.error ?? "No encontramos la miniatura.");

        const provider = payload.provider ?? "video";
        const previousTitle = lastAutoTitle.current;
        const keepImage = manualImageOverride.current;
        setDraft((current) => {
          if (current.destinationUrl.trim() !== destinationUrl) return current;
          const title = payload.title && (!current.title.trim() || current.title === previousTitle) ? payload.title : current.title;
          if (keepImage) return { ...current, title };
          return { ...current, title, imagePath: payload.imageUrl!, imageAlt: `Miniatura de ${title || "video"}` };
        });
        lastAutoTitle.current = payload.title ?? "";
        const parts = [keepImage ? null : "la miniatura", payload.title ? "el título" : null].filter(Boolean).join(" y ");
        setThumbnailStatus({
          tone: "success",
          message: `${parts ? `Completamos ${parts} desde ${provider}` : `${provider} respondió`}. Sólo cambiamos campos vacíos o que no habías editado.${payload.title ? "" : ` ${provider} no comparte el título: escríbelo a mano.`}`,
        });
      } catch (cause) {
        if (controller.signal.aborted) return;
        setThumbnailStatus({
          tone: "error",
          message: `${cause instanceof Error ? cause.message : "No encontramos la miniatura."} Puedes completar el título y elegir una imagen a mano.`,
        });
      }
    }, 450);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [draft.destinationUrl, lookupAttempt]);

  function updateDraft<Key extends keyof ArchiveItemDraft>(field: Key, value: ArchiveItemDraft[Key]) {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    if (field === "destinationUrl") {
      lookupRequested.current = Boolean(String(value).trim());
      setThumbnailStatus(null);
    }
  }

  function selectItem(item: ArchiveItemViewModel) {
    setSelectedId(item.id);
    setDraft({ ...item });
    setErrors({});
    setThumbnailStatus(null);
    lookupRequested.current = false;
    lastAutoTitle.current = "";
    previousDestinationUrl.current = item.destinationUrl;
    manualImageOverride.current = Boolean(item.imagePath && !isVideoThumbnail(item.imagePath));
    setAnnouncement(`${item.title} listo para editar.`);
  }

  function startCreating() {
    setSelectedId(null);
    setDraft(emptyArchiveItem);
    setErrors({});
    setThumbnailStatus(null);
    lookupRequested.current = false;
    lastAutoTitle.current = "";
    previousDestinationUrl.current = "";
    manualImageOverride.current = false;
    setAnnouncement("Formulario para una nueva pieza del archivo.");
  }

  async function moveItem(id: string, direction: -1 | 1) {
    const ordered = sortItems(items);
    const currentIndex = ordered.findIndex((item) => item.id === id);
    const targetIndex = currentIndex + direction;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= ordered.length) return;
    const reordered = [...ordered];
    [reordered[currentIndex], reordered[targetIndex]] = [reordered[targetIndex], reordered[currentIndex]];
    const nextItems = reordered.map((item, index) => ({ ...item, order: index + 1 }));
    if (await reorder(nextItems)) setItems(nextItems);
  }

  async function toggleVisibility(item: ArchiveItemViewModel) {
    const visible = !item.visible;
    const updated = { ...item, visible };
    const result = await save(item.id, updated, {
      action: `visibility:${item.id}`,
      successMessage: visible ? `«${item.title}» ahora es visible en el sitio.` : `«${item.title}» quedó oculto del sitio.`,
    });
    if (!result.success) return;
    setItems((current) => current.map((entry) => entry.id === item.id ? updated : entry));
    if (selectedId === item.id) setDraft((current) => ({ ...current, visible }));
  }

  async function submitDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const nextErrors = validateArchiveItemDraft(draft);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      notify("error", "Revisa los campos marcados antes de continuar.");
      requestAnimationFrame(() => form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }

    const result = await save(selectedId, draft);
    if (!result.success || !result.id) return;
    if (selectedId) {
      setItems((current) => current.map((item) => item.id === selectedId ? { ...item, ...draft } : item));
      return;
    }
    const item = { ...draft, id: result.id, order: items.length + 1 };
    setItems((current) => [...current, item]);
    setSelectedId(result.id);
    setDraft({ ...draft });
  }

  return (
    <div className={styles.managerGrid}>
      <section aria-labelledby="archive-list-title" className={styles.managerListPanel}>
        <div className={styles.panelHeading}>
          <div>
            <p className={styles.sectionLabel}>Orden del carrusel</p>
            <h2 id="archive-list-title">Piezas</h2>
          </div>
          <button className={styles.secondaryButton} onClick={startCreating} type="button">Nueva pieza</button>
        </div>
        <ol className={styles.managerList}>
          {sortedItems.map((item, index) => (
            <li className={styles.managerListItem} key={item.id}>
              <button
                aria-current={selectedId === item.id ? "true" : undefined}
                className={styles.managerSelectButton}
                onClick={() => selectItem(item)}
                type="button"
              >
                <span className={styles.orderNumber}>{String(index + 1).padStart(2, "0")}</span>
                <span><strong>{item.title}</strong><small>{item.subtitle} · {item.metric}</small></span>
                <em>{item.visible ? "Visible" : "Oculto"}</em>
              </button>
              <div aria-label={`Acciones para ${item.title}`} className={styles.rowActions}>
                <button aria-label={`Subir ${item.title}`} disabled={index === 0 || saving} onClick={() => moveItem(item.id, -1)} type="button"><MoveIcon direction="up" /></button>
                <button aria-label={`Bajar ${item.title}`} disabled={index === sortedItems.length - 1 || saving} onClick={() => moveItem(item.id, 1)} type="button"><MoveIcon direction="down" /></button>
                <button aria-busy={pendingAction === `visibility:${item.id}`} disabled={saving} onClick={() => toggleVisibility(item)} type="button">{pendingAction === `visibility:${item.id}` ? <Spinner /> : null}{item.visible ? "Ocultar" : "Mostrar"}</button>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="archive-editor-title" className={styles.editorPanel}>
        <div className={styles.panelHeading}>
          <div>
            <p className={styles.sectionLabel}>{isCreating ? "Nuevo elemento" : "Edición guardada"}</p>
            <h2 id="archive-editor-title">{isCreating ? "Crear pieza" : "Editar pieza"}</h2>
          </div>
        </div>
        <form className={styles.editorForm} noValidate onSubmit={submitDraft}>
          <AdminTextField error={errors.destinationUrl} help="Con YouTube completamos miniatura y título. Con TikTok e Instagram intentamos traer la miniatura, pero a veces la plataforma no la comparte. Todo sigue siendo editable." id="archive-url" label="Primero, pega la URL del video" onChange={(value) => updateDraft("destinationUrl", value)} required type="url" value={draft.destinationUrl} />
          {draft.destinationUrl ? <button className={styles.textButton} onClick={() => updateDraft("destinationUrl", "")} type="button">Borrar enlace</button> : null}
          {thumbnailStatus ? (
            <div aria-live="polite" className={styles.inlineStatus} data-tone={thumbnailStatus.tone}>
              {thumbnailStatus.tone === "loading" ? <Spinner /> : null}
              <span>{thumbnailStatus.message}</span>
              {thumbnailStatus.tone === "error" ? (
                <button className={styles.textButton} onClick={() => { lookupRequested.current = true; setLookupAttempt((attempt) => attempt + 1); }} type="button">Reintentar</button>
              ) : null}
            </div>
          ) : null}
          <AdminTextField error={errors.title} id="archive-title" label="Título" onChange={(value) => updateDraft("title", value)} required value={draft.title} />
          <div className={styles.twoColumnFields}>
            <AdminTextField error={errors.subtitle} id="archive-subtitle" label="Artista o contexto" onChange={(value) => updateDraft("subtitle", value)} required value={draft.subtitle} />
            <AdminTextField error={errors.metric} id="archive-metric" label="Cifra o llamada" onChange={(value) => updateDraft("metric", value)} required value={draft.metric} />
          </div>
          <MediaPicker error={errors.imagePath} help="Al pegar una URL nueva intentaremos cargar la miniatura pública del video. Puedes reemplazarla por cualquier foto de la biblioteca o subir otra en alta resolución." id="archive-image" label="Imagen de la pieza" onChange={(value) => { manualImageOverride.current = true; updateDraft("imagePath", value); }} value={draft.imagePath} />
          <AdminTextField error={errors.imageAlt} id="archive-image-alt" label="Descripción de la imagen" onChange={(value) => updateDraft("imageAlt", value)} value={draft.imageAlt} />
          <VisibilityField checked={draft.visible} id="archive-visible" onChange={(checked) => updateDraft("visible", checked)} />
          <div className={styles.formActions}>
            <button aria-busy={pendingAction === "save"} className={styles.primaryButton} disabled={saving} type="submit">{pendingAction === "save" ? <><Spinner />Guardando…</> : "Guardar pieza"}</button>
            <button
              className={styles.textButton}
              onClick={() => {
                const original = items.find((item) => item.id === selectedId);
                setDraft(original ? { ...original } : emptyArchiveItem);
                setErrors({});
                setThumbnailStatus(null);
                lookupRequested.current = false;
                lastAutoTitle.current = "";
                previousDestinationUrl.current = original?.destinationUrl ?? "";
                manualImageOverride.current = Boolean(original?.imagePath && !isVideoThumbnail(original.imagePath));
                setAnnouncement(original
                  ? "Cambios descartados. Se restauraron los últimos valores guardados. Usa Borrar enlace si quieres quitar una URL guardada."
                  : "Cambios descartados. El formulario quedó vacío.");
              }}
              type="button"
            >
              Descartar cambios
            </button>
          </div>
        </form>
        <div aria-label="Vista previa de la pieza" className={styles.previewSection}>
          <p className={styles.sectionLabel}>Vista previa</p>
          <article className={styles.archivePreview}>
            <div className={styles.archivePreviewMedia}>
              {draft.imagePath ? (
                <Image alt={draft.imageAlt} fill sizes="220px" src={draft.imagePath} unoptimized={!draft.imagePath.startsWith("/images/")} />
              ) : (
                <svg aria-hidden="true" fill="none" height="34" viewBox="0 0 24 24" width="34"><path d="m8 5 11 7-11 7V5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" /></svg>
              )}
            </div>
            <div><strong>“{draft.title || "Título"}”</strong><p>{draft.subtitle || "Artista o contexto"}</p><small>{draft.metric || "Cifra"} · {draft.visible ? "Visible" : "Oculto"}</small></div>
          </article>
        </div>
      </section>
      <AdminFeedbackRegion announcement={announcement} feedback={feedback} onDismiss={dismissFeedback} />
    </div>
  );
}
