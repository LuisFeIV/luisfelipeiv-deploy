"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";

import type {
  AdminPlaylistDraft,
  AdminPlaylistViewModel,
  PlaylistCardTone,
} from "@/lib/admin/models";
import {
  validatePlaylistDraft,
  type PlaylistDraftErrors,
} from "@/lib/admin/validation";

import styles from "../admin.module.css";
import {
  AdminTextAreaField,
  AdminTextField,
  MoveIcon,
  VisibilityField,
} from "./form-controls";

type PlaylistManagerProps = {
  initialPlaylists: AdminPlaylistViewModel[];
};

const emptyPlaylist: AdminPlaylistDraft = {
  title: "",
  description: "",
  spotifyUrl: "",
  label: "",
  visible: true,
  tone: "dedication",
};

const toneLabels: Record<PlaylistCardTone, string> = {
  bolero: "Bolero",
  dedication: "Dedicatoria",
  stories: "Historias",
};

function sortPlaylists(items: AdminPlaylistViewModel[]) {
  return [...items].sort((first, second) => first.order - second.order);
}

export function PlaylistManager({ initialPlaylists }: PlaylistManagerProps) {
  const firstPlaylist = sortPlaylists(initialPlaylists)[0];
  const [playlists, setPlaylists] = useState(initialPlaylists);
  const [selectedId, setSelectedId] = useState<string | null>(firstPlaylist?.id ?? null);
  const [draft, setDraft] = useState<AdminPlaylistDraft>(
    firstPlaylist ? { ...firstPlaylist } : emptyPlaylist,
  );
  const [errors, setErrors] = useState<PlaylistDraftErrors>({});
  const [announcement, setAnnouncement] = useState("");
  const sortedPlaylists = useMemo(() => sortPlaylists(playlists), [playlists]);
  const isCreating = selectedId === null;

  function updateDraft<Key extends keyof AdminPlaylistDraft>(
    field: Key,
    value: AdminPlaylistDraft[Key],
  ) {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function selectPlaylist(playlist: AdminPlaylistViewModel) {
    setSelectedId(playlist.id);
    setDraft({ ...playlist });
    setErrors({});
    setAnnouncement(`${playlist.title} lista para editar.`);
  }

  function startCreating() {
    setSelectedId(null);
    setDraft(emptyPlaylist);
    setErrors({});
    setAnnouncement("Formulario para una nueva playlist.");
  }

  function movePlaylist(id: string, direction: -1 | 1) {
    setPlaylists((current) => {
      const ordered = sortPlaylists(current);
      const currentIndex = ordered.findIndex((item) => item.id === id);
      const targetIndex = currentIndex + direction;

      if (currentIndex < 0 || targetIndex < 0 || targetIndex >= ordered.length) {
        return current;
      }

      const reordered = [...ordered];
      [reordered[currentIndex], reordered[targetIndex]] = [
        reordered[targetIndex],
        reordered[currentIndex],
      ];

      return reordered.map((item, index) => ({ ...item, order: index + 1 }));
    });
    setAnnouncement("Orden actualizado sólo en esta demostración.");
  }

  function togglePlaylistVisibility(playlist: AdminPlaylistViewModel) {
    const visible = !playlist.visible;
    setPlaylists((current) =>
      current.map((item) => item.id === playlist.id ? { ...item, visible } : item),
    );
    if (selectedId === playlist.id) {
      setDraft((current) => ({ ...current, visible }));
    }
    setAnnouncement(`${playlist.title} ahora está ${visible ? "visible" : "oculta"} en esta demostración.`);
  }

  function submitDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const nextErrors = validatePlaylistDraft(draft);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setAnnouncement("Revisa los campos marcados antes de continuar.");
      requestAnimationFrame(() => {
        form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      });
      return;
    }

    if (selectedId) {
      setPlaylists((current) =>
        current.map((item) => item.id === selectedId ? { ...item, ...draft } : item),
      );
      setAnnouncement("Cambios aplicados sólo en esta demostración.");
      return;
    }

    const id = `playlist-demo-${playlists.length + 1}`;
    const playlist: AdminPlaylistViewModel = {
      ...draft,
      id,
      order: playlists.length + 1,
    };
    setPlaylists((current) => [...current, playlist]);
    setSelectedId(id);
    setAnnouncement("Playlist creada sólo en esta demostración.");
  }

  return (
    <div className={styles.managerGrid}>
      <section aria-labelledby="playlist-list-title" className={styles.managerListPanel}>
        <div className={styles.panelHeading}>
          <div>
            <p className={styles.sectionLabel}>Orden del sitio</p>
            <h2 id="playlist-list-title">Playlists</h2>
          </div>
          <button className={styles.secondaryButton} onClick={startCreating} type="button">
            Nueva playlist
          </button>
        </div>
        <ol className={styles.managerList}>
          {sortedPlaylists.map((playlist, index) => (
            <li className={styles.managerListItem} key={playlist.id}>
              <button
                aria-current={selectedId === playlist.id ? "true" : undefined}
                className={styles.managerSelectButton}
                onClick={() => selectPlaylist(playlist)}
                type="button"
              >
                <span className={styles.orderNumber}>{String(index + 1).padStart(2, "0")}</span>
                <span>
                  <strong>{playlist.title}</strong>
                  <small>{playlist.label}</small>
                </span>
                <em>{playlist.visible ? "Visible" : "Oculta"}</em>
              </button>
              <div aria-label={`Acciones para ${playlist.title}`} className={styles.rowActions}>
                <button
                  aria-label={`Subir ${playlist.title}`}
                  disabled={index === 0}
                  onClick={() => movePlaylist(playlist.id, -1)}
                  type="button"
                >
                  <MoveIcon direction="up" />
                </button>
                <button
                  aria-label={`Bajar ${playlist.title}`}
                  disabled={index === sortedPlaylists.length - 1}
                  onClick={() => movePlaylist(playlist.id, 1)}
                  type="button"
                >
                  <MoveIcon direction="down" />
                </button>
                <button onClick={() => togglePlaylistVisibility(playlist)} type="button">
                  {playlist.visible ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="playlist-editor-title" className={styles.editorPanel}>
        <div className={styles.panelHeading}>
          <div>
            <p className={styles.sectionLabel}>{isCreating ? "Nuevo elemento" : "Edición local"}</p>
            <h2 id="playlist-editor-title">{isCreating ? "Crear playlist" : "Editar playlist"}</h2>
          </div>
        </div>
        <form className={styles.editorForm} noValidate onSubmit={submitDraft}>
          <AdminTextField
            error={errors.title}
            id="playlist-title"
            label="Título"
            onChange={(value) => updateDraft("title", value)}
            required
            value={draft.title}
          />
          <AdminTextAreaField
            error={errors.description}
            help="Una o dos frases, como en la tarjeta pública."
            id="playlist-description"
            label="Descripción"
            onChange={(value) => updateDraft("description", value)}
            required
            value={draft.description}
          />
          <AdminTextField
            error={errors.spotifyUrl}
            id="playlist-url"
            label="URL de Spotify"
            onChange={(value) => updateDraft("spotifyUrl", value)}
            required
            type="url"
            value={draft.spotifyUrl}
          />
          <AdminTextField
            error={errors.label}
            id="playlist-label"
            label="Etiqueta"
            onChange={(value) => updateDraft("label", value)}
            required
            value={draft.label}
          />
          <div className={styles.formField}>
            <label htmlFor="playlist-tone">Estilo de tarjeta</label>
            <select
              id="playlist-tone"
              onChange={(event) => updateDraft("tone", event.target.value as PlaylistCardTone)}
              value={draft.tone}
            >
              {Object.entries(toneLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <VisibilityField
            checked={draft.visible}
            id="playlist-visible"
            onChange={(checked) => updateDraft("visible", checked)}
          />
          <div className={styles.formActions}>
            <button className={styles.primaryButton} type="submit">
              Aplicar en demo
            </button>
            <button
              className={styles.textButton}
              onClick={() => {
                const original = playlists.find((item) => item.id === selectedId);
                setDraft(original ? { ...original } : emptyPlaylist);
                setErrors({});
                setAnnouncement("Cambios del formulario descartados.");
              }}
              type="button"
            >
              Descartar cambios
            </button>
          </div>
        </form>

        <div aria-label="Vista previa de la tarjeta" className={styles.previewSection}>
          <p className={styles.sectionLabel}>Vista previa</p>
          <article className={`${styles.playlistPreview} ${styles[`playlistPreview-${draft.tone}`]}`}>
            <div className={styles.playlistPreviewCover}>
              <span>{draft.label || "Etiqueta"}</span>
              <strong>{draft.title || "Título de la playlist"}</strong>
            </div>
            <div className={styles.playlistPreviewCopy}>
              <p>{draft.description || "La descripción aparecerá aquí."}</p>
              <small>{draft.visible ? "Visible" : "Oculta"}</small>
            </div>
          </article>
        </div>
      </section>
      <p aria-live="polite" className={styles.srOnly}>{announcement}</p>
    </div>
  );
}
