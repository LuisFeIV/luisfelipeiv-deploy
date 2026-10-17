"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { FormEvent } from "react";

import type { ArchiveItemDraft, ArchiveItemViewModel } from "@/lib/admin/models";
import {
  validateArchiveItemDraft,
  type ArchiveItemDraftErrors,
} from "@/lib/admin/validation";

import styles from "../admin.module.css";
import { AdminTextField, MoveIcon, VisibilityField } from "./form-controls";

type ArchiveManagerProps = {
  initialItems: ArchiveItemViewModel[];
};

const emptyArchiveItem: ArchiveItemDraft = {
  title: "",
  subtitle: "",
  metric: "",
  destinationUrl: "",
  imagePath: "",
  visible: true,
};

function sortItems(items: ArchiveItemViewModel[]) {
  return [...items].sort((first, second) => first.order - second.order);
}

export function ArchiveManager({ initialItems }: ArchiveManagerProps) {
  const firstItem = sortItems(initialItems)[0];
  const [items, setItems] = useState(initialItems);
  const [selectedId, setSelectedId] = useState<string | null>(firstItem?.id ?? null);
  const [draft, setDraft] = useState<ArchiveItemDraft>(firstItem ? { ...firstItem } : emptyArchiveItem);
  const [errors, setErrors] = useState<ArchiveItemDraftErrors>({});
  const [announcement, setAnnouncement] = useState("");
  const sortedItems = useMemo(() => sortItems(items), [items]);
  const isCreating = selectedId === null;

  function updateDraft<Key extends keyof ArchiveItemDraft>(field: Key, value: ArchiveItemDraft[Key]) {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function selectItem(item: ArchiveItemViewModel) {
    setSelectedId(item.id);
    setDraft({ ...item });
    setErrors({});
    setAnnouncement(`${item.title} listo para editar.`);
  }

  function startCreating() {
    setSelectedId(null);
    setDraft(emptyArchiveItem);
    setErrors({});
    setAnnouncement("Formulario para una nueva pieza del archivo.");
  }

  function moveItem(id: string, direction: -1 | 1) {
    setItems((current) => {
      const ordered = sortItems(current);
      const currentIndex = ordered.findIndex((item) => item.id === id);
      const targetIndex = currentIndex + direction;
      if (currentIndex < 0 || targetIndex < 0 || targetIndex >= ordered.length) return current;

      const reordered = [...ordered];
      [reordered[currentIndex], reordered[targetIndex]] = [reordered[targetIndex], reordered[currentIndex]];
      return reordered.map((item, index) => ({ ...item, order: index + 1 }));
    });
    setAnnouncement("Orden actualizado sólo en esta demostración.");
  }

  function toggleVisibility(item: ArchiveItemViewModel) {
    const visible = !item.visible;
    setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, visible } : entry));
    if (selectedId === item.id) setDraft((current) => ({ ...current, visible }));
    setAnnouncement(`${item.title} ahora está ${visible ? "visible" : "oculto"} en esta demostración.`);
  }

  function submitDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const nextErrors = validateArchiveItemDraft(draft);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setAnnouncement("Revisa los campos marcados antes de continuar.");
      requestAnimationFrame(() => form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }

    if (selectedId) {
      setItems((current) => current.map((item) => item.id === selectedId ? { ...item, ...draft } : item));
      setAnnouncement("Cambios aplicados sólo en esta demostración.");
      return;
    }

    const id = `archive-demo-${items.length + 1}`;
    setItems((current) => [...current, { ...draft, id, order: current.length + 1 }]);
    setSelectedId(id);
    setAnnouncement("Pieza creada sólo en esta demostración.");
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
                <button aria-label={`Subir ${item.title}`} disabled={index === 0} onClick={() => moveItem(item.id, -1)} type="button"><MoveIcon direction="up" /></button>
                <button aria-label={`Bajar ${item.title}`} disabled={index === sortedItems.length - 1} onClick={() => moveItem(item.id, 1)} type="button"><MoveIcon direction="down" /></button>
                <button onClick={() => toggleVisibility(item)} type="button">{item.visible ? "Ocultar" : "Mostrar"}</button>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="archive-editor-title" className={styles.editorPanel}>
        <div className={styles.panelHeading}>
          <div>
            <p className={styles.sectionLabel}>{isCreating ? "Nuevo elemento" : "Edición local"}</p>
            <h2 id="archive-editor-title">{isCreating ? "Crear pieza" : "Editar pieza"}</h2>
          </div>
        </div>
        <form className={styles.editorForm} noValidate onSubmit={submitDraft}>
          <AdminTextField error={errors.title} id="archive-title" label="Título" onChange={(value) => updateDraft("title", value)} required value={draft.title} />
          <div className={styles.twoColumnFields}>
            <AdminTextField error={errors.subtitle} id="archive-subtitle" label="Artista o contexto" onChange={(value) => updateDraft("subtitle", value)} required value={draft.subtitle} />
            <AdminTextField error={errors.metric} id="archive-metric" label="Cifra o llamada" onChange={(value) => updateDraft("metric", value)} required value={draft.metric} />
          </div>
          <AdminTextField error={errors.destinationUrl} id="archive-url" label="URL de destino" onChange={(value) => updateDraft("destinationUrl", value)} required type="url" value={draft.destinationUrl} />
          <AdminTextField error={errors.imagePath} help="Opcional. Usa una imagen existente, por ejemplo /images/site-5.jpg." id="archive-image" label="Ruta de imagen" onChange={(value) => updateDraft("imagePath", value)} value={draft.imagePath} />
          <VisibilityField checked={draft.visible} id="archive-visible" onChange={(checked) => updateDraft("visible", checked)} />
          <div className={styles.formActions}>
            <button className={styles.primaryButton} type="submit">Aplicar en demo</button>
            <button
              className={styles.textButton}
              onClick={() => {
                const original = items.find((item) => item.id === selectedId);
                setDraft(original ? { ...original } : emptyArchiveItem);
                setErrors({});
                setAnnouncement("Cambios del formulario descartados.");
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
              {draft.imagePath.startsWith("/images/") ? (
                <Image alt="" fill sizes="220px" src={draft.imagePath} />
              ) : (
                <svg aria-hidden="true" fill="none" height="34" viewBox="0 0 24 24" width="34"><path d="m8 5 11 7-11 7V5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" /></svg>
              )}
            </div>
            <div><strong>“{draft.title || "Título"}”</strong><p>{draft.subtitle || "Artista o contexto"}</p><small>{draft.metric || "Cifra"} · {draft.visible ? "Visible" : "Oculto"}</small></div>
          </article>
        </div>
      </section>
      <p aria-live="polite" className={styles.srOnly}>{announcement}</p>
    </div>
  );
}
