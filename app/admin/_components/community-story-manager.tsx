"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";

import type { CommunityStoryDraft, CommunityStoryViewModel } from "@/lib/admin/models";
import {
  validateCommunityStoryDraft,
  type CommunityStoryDraftErrors,
} from "@/lib/admin/validation";

import styles from "../admin.module.css";
import { AdminFeedbackRegion, AdminTextAreaField, AdminTextField, MoveIcon, Spinner, VisibilityField } from "./form-controls";
import { useSiteContentMutations } from "./use-site-content-mutations";

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
  const { announcement, dismissFeedback, feedback, notify, pendingAction, reorder, save, saving, setAnnouncement } = useSiteContentMutations("stories");
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

  async function moveStory(id: string, direction: -1 | 1) {
    const ordered = sortStories(stories);
    const currentIndex = ordered.findIndex((item) => item.id === id);
    const targetIndex = currentIndex + direction;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= ordered.length) return;
    [ordered[currentIndex], ordered[targetIndex]] = [ordered[targetIndex], ordered[currentIndex]];
    const nextStories = ordered.map((item, index) => ({ ...item, order: index + 1 }));
    if (await reorder(nextStories)) setStories(nextStories);
  }

  async function toggleVisibility(item: CommunityStoryViewModel) {
    const visible = !item.visible;
    const { id: _id, order: _order, ...values } = item;
    const result = await save(item.id, { ...values, visible }, {
      action: `visibility:${item.id}`,
      successMessage: visible ? `«${item.song}» ahora es visible en el muro.` : `«${item.song}» quedó oculta del muro.`,
    });
    if (!result.success) return;
    setStories((current) => current.map((entry) => entry.id === item.id ? { ...entry, visible } : entry));
    if (selectedId === item.id) setDraft((current) => ({ ...current, visible }));
  }

  async function submitDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const nextErrors = validateCommunityStoryDraft(draft);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      notify("error", "Revisa los campos marcados antes de continuar.");
      requestAnimationFrame(() => form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }

    const values = { song: draft.song, artist: draft.artist, story: draft.story, feeling: draft.feeling, visible: draft.visible };
    const result = await save(selectedId, values, {
      successMessage: selectedId ? "Historia guardada. Ya se ve en el muro." : "Historia agregada al final del muro.",
    });
    if (!result.success) return;
    if (selectedId) {
      setStories((current) => current.map((item) => item.id === selectedId ? { ...item, ...values } : item));
      return;
    }
    if (!result.id) return;
    const id = result.id;
    setStories((current) => [...current, { ...values, id, order: Math.max(0, ...current.map((item) => item.order)) + 1 }]);
    setSelectedId(id);
  }

  return (
    <div className={styles.managerGrid}>
      <section aria-labelledby="stories-list-title" className={styles.managerListPanel}>
        <div className={styles.panelHeading}>
          <div><p className={styles.sectionLabel}>Orden del muro</p><h2 id="stories-list-title">Historias</h2></div>
          <button className={styles.secondaryButton} disabled={saving} onClick={startCreating} type="button">Nueva historia</button>
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
                <button aria-label={`Subir ${item.song}`} disabled={index === 0 || saving} onClick={() => moveStory(item.id, -1)} type="button"><MoveIcon direction="up" /></button>
                <button aria-label={`Bajar ${item.song}`} disabled={index === sortedStories.length - 1 || saving} onClick={() => moveStory(item.id, 1)} type="button"><MoveIcon direction="down" /></button>
                <button aria-busy={pendingAction === `visibility:${item.id}`} disabled={saving} onClick={() => toggleVisibility(item)} type="button">{pendingAction === `visibility:${item.id}` ? <Spinner /> : null}{item.visible ? "Ocultar" : "Mostrar"}</button>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="story-editor-title" className={styles.editorPanel}>
        <div className={styles.panelHeading}>
          <div><p className={styles.sectionLabel}>{isCreating ? "Nuevo elemento" : "Edición guardada"}</p><h2 id="story-editor-title">{isCreating ? "Crear historia" : "Editar historia"}</h2></div>
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
            <button aria-busy={pendingAction === "save"} className={styles.primaryButton} disabled={saving} type="submit">{pendingAction === "save" ? <><Spinner />Guardando…</> : "Guardar historia"}</button>
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
      <AdminFeedbackRegion announcement={announcement} feedback={feedback} onDismiss={dismissFeedback} />
    </div>
  );
}
