"use client";

import { useState } from "react";
import type { AboutImageViewModel } from "@/lib/admin/models";
import styles from "../admin.module.css";
import { AdminFeedbackRegion, AdminTextField, MoveIcon, Spinner, VisibilityField } from "./form-controls";
import { MediaPicker } from "./media-picker";
import { useSiteContentMutations } from "./use-site-content-mutations";

type AboutImagesManagerProps = { initialImages: AboutImageViewModel[] };
type AboutImageDraft = Omit<AboutImageViewModel, "id" | "order">;
const emptyImage: AboutImageDraft = { imageUrl: "", altText: "", objectPosition: "center center", visible: true };

export function AboutImagesManager({ initialImages }: AboutImagesManagerProps) {
  const [images, setImages] = useState(initialImages);
  const [selectedId, setSelectedId] = useState<string | null>(initialImages[0]?.id ?? null);
  const [draft, setDraft] = useState<AboutImageDraft>(initialImages[0] ?? emptyImage);
  const { announcement, dismissFeedback, feedback, pendingAction, reorder, save, saving } = useSiteContentMutations("about-images");

  async function move(id: string, direction: -1 | 1) {
    const ordered = [...images].sort((a, b) => a.order - b.order);
    const index = ordered.findIndex((image) => image.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= ordered.length) return;
    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
    const next = ordered.map((image, order) => ({ ...image, order: order + 1 }));
    if (await reorder(next)) setImages(next);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await save(selectedId, draft);
    if (!result.success) return;
    if (selectedId) setImages((current) => current.map((image) => image.id === selectedId ? { ...image, ...draft } : image));
    else if (result.id) {
      const created = { ...draft, id: result.id, order: images.length + 1 };
      setImages((current) => [...current, created]);
      setSelectedId(created.id);
    }
  }

  return <div className={styles.managerGrid}>
    <section className={styles.managerListPanel} aria-labelledby="about-images-title">
      <div className={styles.panelHeading}><div><p className={styles.sectionLabel}>Carrusel público</p><h2 id="about-images-title">Fotos de «Quién soy»</h2></div><button className={styles.secondaryButton} type="button" onClick={() => { setSelectedId(null); setDraft(emptyImage); }}>Agregar foto</button></div>
      <ol className={styles.managerList}>{[...images].sort((a, b) => a.order - b.order).map((image, index) => <li className={styles.managerListItem} key={image.id}>
        <button className={styles.managerSelectButton} aria-current={selectedId === image.id ? "true" : undefined} onClick={() => { setSelectedId(image.id); setDraft({ imageUrl: image.imageUrl, altText: image.altText, objectPosition: image.objectPosition, visible: image.visible }); }} type="button"><span className={styles.orderNumber}>{String(index + 1).padStart(2, "0")}</span><span><strong>{image.altText}</strong><small>{image.visible ? "Visible en el carrusel" : "Oculta"}</small></span></button>
        <div className={styles.rowActions}><button aria-label={`Subir foto ${index + 1}`} disabled={index === 0 || saving} onClick={() => void move(image.id, -1)} type="button"><MoveIcon direction="up" /></button><button aria-label={`Bajar foto ${index + 1}`} disabled={index === images.length - 1 || saving} onClick={() => void move(image.id, 1)} type="button"><MoveIcon direction="down" /></button></div>
      </li>)}</ol>
    </section>
    <section className={styles.editorPanel} aria-labelledby="about-image-editor-title"><div className={styles.panelHeading}><div><p className={styles.sectionLabel}>{selectedId ? "Edición" : "Nueva foto"}</p><h2 id="about-image-editor-title">Imagen y orden</h2></div></div>
      <form className={styles.editorForm} onSubmit={submit}><MediaPicker id="about-image" label="Fotografía" help="Sube una imagen grande; el sitio la entrega optimizada para conservar nitidez en pantallas de alta densidad." onChange={(imageUrl) => setDraft((current) => ({ ...current, imageUrl }))} value={draft.imageUrl} /><AdminTextField id="about-image-alt" label="Descripción accesible" required value={draft.altText} onChange={(altText) => setDraft((current) => ({ ...current, altText }))} /><AdminTextField id="about-image-position" label="Encuadre (CSS object-position)" help="Ejemplo: center 20%." required value={draft.objectPosition} onChange={(objectPosition) => setDraft((current) => ({ ...current, objectPosition }))} /><VisibilityField id="about-image-visible" checked={draft.visible} onChange={(visible) => setDraft((current) => ({ ...current, visible }))} /><button aria-busy={pendingAction === "save"} className={styles.primaryButton} disabled={saving} type="submit">{pendingAction === "save" ? <><Spinner />Guardando…</> : "Guardar fotografía"}</button></form>
    </section><AdminFeedbackRegion announcement={announcement} feedback={feedback} onDismiss={dismissFeedback} />
  </div>;
}
