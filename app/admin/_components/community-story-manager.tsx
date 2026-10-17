"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";

import type { CommunityStoryDraft, CommunityStoryViewModel } from "@/lib/admin/models";
import {
  validateCommunityStoryDraft,
  type CommunityStoryDraftErrors,
} from "@/lib/admin/validation";

import styles from "../admin.module.css";
import { AdminTextAreaField, AdminTextField, MoveIcon, VisibilityField } from "./form-controls";

type CommunityStoryManagerProps = {
  initialStories: CommunityStoryViewModel[];
};

const emptyStory: CommunityStoryDraft = {
  song: "",
  artist: "",
  story: "",
  feeling: "",
  visible: true,
};

function sortStories(items: CommunityStoryViewModel[]) {
  return [...items].sort((first, second) => first.order - second.order);
}

export function CommunityStoryManager({ initialStories }: CommunityStoryManagerProps) {
  const firstStory = sortStories(initialStories)[0];
  const [stories, setStories] = useState(initialStories);
  const [selectedId, setSelectedId] = useState<string | null>(firstStory?.id ?? null);
  const [draft, setDraft] = useState<CommunityStoryDraft>(firstStory ? { ...firstStory } : emptyStory);
  const [errors, setErrors] = useState<CommunityStoryDraftErrors>({});
  const [announcement, setAnnouncement] = useState("");
  const sortedStories = useMemo(() => sortStories(stories), [stories]);
  const isCreating = selectedId === null;

  function updateDraft<Key extends keyof CommunityStoryDraft>(field: Key, value: CommunityStoryDraft[Key]) {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function selectStory(item: CommunityStoryViewModel) {
    setSelectedId(item.id);
    setDraft({ ...item });
    setErrors({});
    setAnnouncement(`${item.song} lista para editar.`);
  }

  function startCreating() {
    setSelectedId(null);
    setDraft(emptyStory);
    setErrors({});
    setAnnouncement("Formulario para una nueva historia de la comunidad.");
  }

  function moveStory(id: string, direction: -1 | 1) {
    setStories((current) => {
      const ordered = sortStories(current);
      const currentIndex = ordered.findIndex((item) => item.id === id);
      const targetIndex = currentIndex + direction;
      if (currentIndex < 0 || targetIndex < 0 || targetIndex >= ordered.length) return current;

      const reordered = [...ordered];
      [reordered[currentIndex], reordered[targetIndex]] = [reordered[targetIndex], reordered[currentIndex]];
      return reordered.map((item, index) => ({ ...item, order: index + 1 }));
    });
    setAnnouncement("Orden actualizado sólo en esta demostración.");
  }

  function toggleVisibility(item: CommunityStoryViewModel) {
    const visible = !item.visible;
    setStories((current) => current.map((entry) => entry.id === item.id ? { ...entry, visible } : entry));
    if (selectedId === item.id) setDraft((current) => ({ ...current, visible }));
    setAnnouncement(`${item.song} ahora está ${visible ? "visible" : "oculta"} en esta demostración.`);
  }

  function submitDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const nextErrors = validateCommunityStoryDraft(draft);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setAnnouncement("Revisa los campos marcados antes de continuar.");
      requestAnimationFrame(() => form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }

    if (selectedId) {
      setStories((current) => current.map((item) => item.id === selectedId ? { ...item, ...draft } : item));
      setAnnouncement("Cambios aplicados sólo en esta demostración.");
      return;
    }

    const id = `community-story-demo-${stories.length + 1}`;
    setStories((current) => [...current, { ...draft, id, order: current.length + 1 }]);
    setSelectedId(id);
    setAnnouncement("Historia creada sólo en esta demostración.");
  }

  return (
    <div className={styles.managerGrid}>
      <section aria-labelledby="stories-list-title" className={styles.managerListPanel}>
        <div className={styles.panelHeading}>
          <div><p className={styles.sectionLabel}>Orden del muro</p><h2 id="stories-list-title">Historias</h2></div>
          <button className={styles.secondaryButton} onClick={startCreating} type="button">Nueva historia</button>
        </div>
        <ol className={styles.managerList}>
          {sortedStories.map((item, index) => (
            <li className={styles.managerListItem} key={item.id}>
              <button aria-current={selectedId === item.id ? "true" : undefined} className={styles.managerSelectButton} onClick={() => selectStory(item)} type="button">
                <span className={styles.orderNumber}>{String(index + 1).padStart(2, "0")}</span>
                <span><strong>{item.song}</strong><small>{item.artist} · {item.feeling}</small></span>
                <em>{item.visible ? "Visible" : "Oculta"}</em>
              </button>
              <div aria-label={`Acciones para ${item.song}`} className={styles.rowActions}>
                <button aria-label={`Subir ${item.song}`} disabled={index === 0} onClick={() => moveStory(item.id, -1)} type="button"><MoveIcon direction="up" /></button>
                <button aria-label={`Bajar ${item.song}`} disabled={index === sortedStories.length - 1} onClick={() => moveStory(item.id, 1)} type="button"><MoveIcon direction="down" /></button>
                <button onClick={() => toggleVisibility(item)} type="button">{item.visible ? "Ocultar" : "Mostrar"}</button>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="story-editor-title" className={styles.editorPanel}>
        <div className={styles.panelHeading}>
          <div><p className={styles.sectionLabel}>{isCreating ? "Nuevo elemento" : "Edición local"}</p><h2 id="story-editor-title">{isCreating ? "Crear historia" : "Editar historia"}</h2></div>
        </div>
        <form className={styles.editorForm} noValidate onSubmit={submitDraft}>
          <div className={styles.twoColumnFields}>
            <AdminTextField error={errors.song} id="story-song" label="Canción" onChange={(value) => updateDraft("song", value)} required value={draft.song} />
            <AdminTextField error={errors.artist} id="story-artist" label="Artista" onChange={(value) => updateDraft("artist", value)} required value={draft.artist} />
          </div>
          <AdminTextAreaField error={errors.story} help="Mantén la voz original y una extensión breve para el muro." id="story-copy" label="Historia" onChange={(value) => updateDraft("story", value)} required value={draft.story} />
          <AdminTextField error={errors.feeling} id="story-feeling" label="Sentimiento" onChange={(value) => updateDraft("feeling", value)} required value={draft.feeling} />
          <VisibilityField checked={draft.visible} id="story-visible" onChange={(checked) => updateDraft("visible", checked)} />
          <div className={styles.formActions}>
            <button className={styles.primaryButton} type="submit">Aplicar en demo</button>
            <button
              className={styles.textButton}
              onClick={() => {
                const original = stories.find((item) => item.id === selectedId);
                setDraft(original ? { ...original } : emptyStory);
                setErrors({});
                setAnnouncement("Cambios del formulario descartados.");
              }}
              type="button"
            >
              Descartar cambios
            </button>
          </div>
        </form>
        <div aria-label="Vista previa de la historia" className={styles.previewSection}>
          <p className={styles.sectionLabel}>Vista previa</p>
          <article className={styles.storyPreview}>
            <strong>“{draft.song || "Canción"}”</strong>
            <small>{draft.artist || "Artista"}</small>
            <p>{draft.story || "La historia aparecerá aquí."}</p>
            <em>{draft.feeling || "Sentimiento"}</em>
            <span>{draft.visible ? "Visible" : "Oculta"}</span>
          </article>
        </div>
      </section>
      <p aria-live="polite" className={styles.srOnly}>{announcement}</p>
    </div>
  );
}
