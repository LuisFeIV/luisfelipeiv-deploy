"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";

import type { AdminPlaylistViewModel, DedicationRecommendationViewModel } from "@/lib/admin/models";
import type { SpotifyTrack } from "@/lib/spotify";

import styles from "../admin.module.css";
import { AdminFeedbackRegion, AdminTextAreaField, AdminTextField, Spinner, VisibilityField } from "./form-controls";
import { useSiteContentMutations } from "./use-site-content-mutations";

type RecommendationManagerProps = {
  initialRecommendations: DedicationRecommendationViewModel[];
  playlists: AdminPlaylistViewModel[];
};

type RecommendationDraft = Omit<DedicationRecommendationViewModel, "id" | "order">;
type DraftErrors = Partial<Record<"moodLabel" | "moodDescription" | "track" | "song" | "artist" | "description" | "playlistUrl", string>>;
type SearchState = { status: "idle" | "loading" | "error" | "empty" | "ready"; message?: string; tracks: SpotifyTrack[] };

const maxRecommendations = 3;
const otherPlaylistValue = "__other__";

const emptyRecommendation: RecommendationDraft = {
  moodKey: "",
  moodLabel: "",
  moodDescription: "",
  song: "",
  artist: "",
  description: "",
  playlistUrl: "",
  spotifyTrackId: "",
  spotifyUrl: "",
  visible: true,
};

function toDraft(item: DedicationRecommendationViewModel): RecommendationDraft {
  const { id: _id, order: _order, ...draft } = item;
  return draft;
}

function slugify(value: string) {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 32) || "mood";
}

function isSpotifyUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "open.spotify.com";
  } catch {
    return false;
  }
}

function validate(draft: RecommendationDraft) {
  const errors: DraftErrors = {};
  if (!draft.moodLabel.trim()) errors.moodLabel = "Escribe el nombre del mood, por ejemplo «Extrañar».";
  if (!draft.moodDescription.trim()) errors.moodDescription = "Escribe la frase que acompaña la canción.";
  if (!draft.spotifyTrackId || !draft.spotifyUrl) errors.track = "Elige una canción de Spotify.";
  if (!draft.song.trim()) errors.song = "Agrega el nombre de la canción.";
  if (!draft.artist.trim()) errors.artist = "Agrega el artista.";
  if (!draft.description.trim()) errors.description = "Explica en una frase por qué dedicarla.";
  if (!isSpotifyUrl(draft.playlistUrl)) errors.playlistUrl = "Elige una playlist o pega un enlace de open.spotify.com.";
  return errors;
}

export function RecommendationManager({ initialRecommendations, playlists }: RecommendationManagerProps) {
  const sortedInitial = [...initialRecommendations].sort((first, second) => first.order - second.order);
  const [items, setItems] = useState(sortedInitial);
  const [selectedId, setSelectedId] = useState<string | null>(sortedInitial[0]?.id ?? null);
  const [draft, setDraft] = useState<RecommendationDraft>(sortedInitial[0] ? toDraft(sortedInitial[0]) : emptyRecommendation);
  const [errors, setErrors] = useState<DraftErrors>({});
  const [trackQuery, setTrackQuery] = useState("");
  const [search, setSearch] = useState<SearchState>({ status: "idle", tracks: [] });
  const [customPlaylist, setCustomPlaylist] = useState(() => Boolean(sortedInitial[0] && !playlists.some((playlist) => playlist.spotifyUrl === sortedInitial[0].playlistUrl)));
  const touchedFields = useRef(new Set<keyof RecommendationDraft>());
  const { announcement, dismissFeedback, feedback, notify, pendingAction, save, saving, setAnnouncement } = useSiteContentMutations("recommendations");
  const sortedItems = useMemo(() => [...items].sort((first, second) => first.order - second.order), [items]);
  const isCreating = selectedId === null;

  useEffect(() => {
    const query = trackQuery.trim();
    if (query.length < 2) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setSearch({ status: "loading", tracks: [] });
      try {
        const response = await fetch("/api/admin/spotify/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
          signal: controller.signal,
        });
        const payload = await response.json() as { tracks?: SpotifyTrack[]; error?: string };
        if (!response.ok) throw new Error(payload.error ?? "No pudimos consultar Spotify.");
        const tracks = payload.tracks ?? [];
        setSearch(tracks.length
          ? { status: "ready", tracks }
          : { status: "empty", message: "Spotify no encontró canciones con esa búsqueda. Prueba con el título y el artista.", tracks: [] });
      } catch (cause) {
        if (controller.signal.aborted) return;
        setSearch({ status: "error", message: cause instanceof Error ? cause.message : "No pudimos consultar Spotify.", tracks: [] });
      }
    }, 400);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [trackQuery]);

  function updateDraft<Key extends keyof RecommendationDraft>(field: Key, value: RecommendationDraft[Key]) {
    touchedFields.current.add(field);
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function chooseTrack(track: SpotifyTrack) {
    setDraft((current) => ({
      ...current,
      spotifyTrackId: track.id,
      spotifyUrl: track.url,
      song: touchedFields.current.has("song") && current.song.trim() ? current.song : track.name,
      artist: touchedFields.current.has("artist") && current.artist.trim() ? current.artist : track.artists,
    }));
    setErrors((current) => ({ ...current, track: undefined, song: undefined, artist: undefined }));
    setTrackQuery("");
    setSearch({ status: "idle", tracks: [] });
    setAnnouncement(`${track.name} de ${track.artists} seleccionada.`);
  }

  function resetEditor(next: RecommendationDraft, id: string | null) {
    setSelectedId(id);
    setDraft(next);
    setErrors({});
    setTrackQuery("");
    setSearch({ status: "idle", tracks: [] });
    touchedFields.current = new Set();
    setCustomPlaylist(Boolean(next.playlistUrl && !playlists.some((playlist) => playlist.spotifyUrl === next.playlistUrl)));
  }

  function selectItem(item: DedicationRecommendationViewModel) {
    resetEditor(toDraft(item), item.id);
    setAnnouncement(`Editando el mood ${item.moodLabel}.`);
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const keys: Record<string, number> = { ArrowRight: (index + 1) % sortedItems.length, ArrowLeft: (index - 1 + sortedItems.length) % sortedItems.length, Home: 0, End: sortedItems.length - 1 };
    const nextIndex = keys[event.key];
    if (nextIndex === undefined) return;
    event.preventDefault();
    selectItem(sortedItems[nextIndex]);
    document.getElementById(`admin-recommendation-tab-${sortedItems[nextIndex].id}`)?.focus();
  }

  async function submitDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const nextErrors = validate(draft);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      notify("error", "Revisa los campos marcados antes de guardar.");
      requestAnimationFrame(() => form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }

    const usedKeys = new Set(items.filter((item) => item.id !== selectedId).map((item) => item.moodKey));
    let moodKey = draft.moodKey || slugify(draft.moodLabel);
    for (let suffix = 2; usedKeys.has(moodKey); suffix += 1) moodKey = `${slugify(draft.moodLabel)}-${suffix}`;
    const next = { ...draft, moodKey };

    const result = await save(selectedId, next, { successMessage: `Recomendación «${next.moodLabel}» guardada. Ya aparece en el formulario de dedicatorias.` });
    if (!result.success) return;
    if (selectedId) {
      setItems((current) => current.map((item) => item.id === selectedId ? { ...item, ...next } : item));
      setDraft(next);
      return;
    }
    if (!result.id) return;
    const created = { ...next, id: result.id, order: Math.max(0, ...items.map((item) => item.order)) + 1 };
    setItems((current) => [...current, created]);
    resetEditor(next, created.id);
  }

  const playlistSelectValue = customPlaylist ? otherPlaylistValue : draft.playlistUrl;
  const playlistTitle = playlists.find((playlist) => playlist.spotifyUrl === draft.playlistUrl)?.title;
  const previewItems = sortedItems.map((item) => item.id === selectedId ? { ...item, ...draft } : item);
  if (isCreating) previewItems.push({ ...draft, id: "draft", order: previewItems.length + 1 });

  return (
    <>
      <section aria-labelledby="recommendation-preview-title" className={styles.recommendationPreviewSection}>
        <div className={styles.panelHeading}>
          <div>
            <p className={styles.sectionLabel}>Elige un mood para editarlo</p>
            <h2 id="recommendation-preview-title">«¿No sabes cuál dedicar?»</h2>
          </div>
          {sortedItems.length < maxRecommendations ? (
            <button className={styles.secondaryButton} disabled={saving} onClick={() => { resetEditor(emptyRecommendation, null); setAnnouncement("Formulario para un nuevo mood."); }} type="button">Agregar mood</button>
          ) : null}
        </div>
        <div className={`song-recommendations-body ${styles.recommendationPreview}`}>
          <div aria-label="Moods de las recomendaciones" className="song-recommendation-tabs" role="tablist">
            {previewItems.map((item, index) => {
              const selected = item.id === (selectedId ?? "draft");
              return (
                <button
                  aria-controls="admin-recommendation-editor"
                  aria-selected={selected}
                  className="song-recommendation-tab"
                  id={`admin-recommendation-tab-${item.id}`}
                  key={item.id}
                  onClick={() => { const saved = sortedItems.find((entry) => entry.id === item.id); if (saved) selectItem(saved); }}
                  onKeyDown={(event) => { if (item.id !== "draft") handleTabKeyDown(event, index); }}
                  role="tab"
                  tabIndex={selected ? 0 : -1}
                  type="button"
                >
                  {item.moodLabel || "Nuevo mood"}{item.visible ? "" : " (oculto)"}
                </button>
              );
            })}
          </div>
          <div aria-label="Vista previa de la recomendación" className="song-recommendation-panel">
            <div className="song-recommendation-copy">
              <p className="song-recommendation-intent">{draft.moodDescription || "Frase de intención"}</p>
              <h3>{draft.song || "Canción"} <span>— {draft.artist || "Artista"}</span></h3>
              <p>{draft.description || "La descripción aparecerá aquí."}</p>
              <a href={draft.playlistUrl || undefined} rel="noopener noreferrer" target="_blank">{playlistTitle ? `De la playlist ${playlistTitle}` : "Escúchala en Spotify"}</a>
            </div>
            <span aria-hidden="true" className="song-recommendation-select">Elegir esta canción</span>
          </div>
        </div>
      </section>

      <section aria-labelledby="recommendation-editor-title" className={`${styles.editorPanel} ${styles.recommendationEditor}`} id="admin-recommendation-editor" role="tabpanel">
        <div className={styles.panelHeading}>
          <div>
            <p className={styles.sectionLabel}>{isCreating ? "Nuevo mood" : "Edición"}</p>
            <h2 id="recommendation-editor-title">{isCreating ? "Crear recomendación" : `Mood «${items.find((item) => item.id === selectedId)?.moodLabel ?? ""}»`}</h2>
          </div>
        </div>
        <form className={styles.editorForm} noValidate onSubmit={submitDraft}>
          <fieldset className={styles.fieldGroup}>
            <legend>1. La canción</legend>
            <div className={styles.formField}>
              <label htmlFor="recommendation-track-search">Busca en Spotify o pega el enlace de la canción</label>
              <input
                aria-controls="recommendation-track-results"
                aria-describedby={errors.track ? "recommendation-track-error" : "recommendation-track-help"}
                aria-invalid={Boolean(errors.track)}
                autoComplete="off"
                id="recommendation-track-search"
                onChange={(event) => {
                  setTrackQuery(event.target.value);
                  if (event.target.value.trim().length < 2) setSearch({ status: "idle", tracks: [] });
                }}
                placeholder="Ej. Contigo Los Panchos o https://open.spotify.com/track/…"
                type="search"
                value={trackQuery}
              />
              {errors.track ? <p className={styles.fieldError} id="recommendation-track-error">{errors.track}</p> : <p className={styles.fieldHelp} id="recommendation-track-help">Al elegirla se llenan la canción y el artista; puedes ajustarlos después.</p>}
            </div>
            {search.status === "loading" ? <p aria-live="polite" className={styles.inlineStatus}><Spinner />Buscando en Spotify…</p> : null}
            {search.status === "error" || search.status === "empty" ? <p aria-live="polite" className={styles.inlineStatus} data-tone="error">{search.message}{search.status === "empty" ? " Si no aparece, pega el enlace de la canción desde Spotify (Compartir → Copiar enlace)." : ""}</p> : null}
            {search.status === "ready" ? (
              <ul aria-label="Resultados de Spotify" className={styles.trackResults} id="recommendation-track-results">
                {search.tracks.map((track) => (
                  <li key={track.id}>
                    <button onClick={() => chooseTrack(track)} type="button">
                      <strong>{track.name}</strong>
                      <small>{track.artists}</small>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            {draft.spotifyTrackId ? (
              <div className={styles.selectedTrack}>
                <span aria-hidden="true">♪</span>
                <p><strong>{draft.song || "Canción"}</strong><small>{draft.artist || "Artista"}</small></p>
                <a href={draft.spotifyUrl} rel="noopener noreferrer" target="_blank">Abrir en Spotify</a>
              </div>
            ) : null}
            <div className={styles.twoColumnFields}>
              <AdminTextField error={errors.song} id="recommendation-song" label="Canción" onChange={(value) => updateDraft("song", value)} required value={draft.song} />
              <AdminTextField error={errors.artist} id="recommendation-artist" label="Artista" onChange={(value) => updateDraft("artist", value)} required value={draft.artist} />
            </div>
          </fieldset>

          <fieldset className={styles.fieldGroup}>
            <legend>2. El mood</legend>
            <div className={styles.twoColumnFields}>
              <AdminTextField error={errors.moodLabel} help="Texto de la pestaña." id="recommendation-mood" label="Mood" onChange={(value) => updateDraft("moodLabel", value)} required value={draft.moodLabel} />
              <AdminTextField error={errors.moodDescription} help="Línea roja sobre la canción." id="recommendation-intent" label="Frase de intención" onChange={(value) => updateDraft("moodDescription", value)} required value={draft.moodDescription} />
            </div>
            <AdminTextAreaField error={errors.description} help="Una o dos frases sobre cuándo dedicarla." id="recommendation-description" label="Por qué dedicarla" onChange={(value) => updateDraft("description", value)} required value={draft.description} />
          </fieldset>

          <fieldset className={styles.fieldGroup}>
            <legend>3. La playlist</legend>
            <div className={styles.formField}>
              <label htmlFor="recommendation-playlist">Playlist de referencia</label>
              <select
                aria-describedby={errors.playlistUrl && !customPlaylist ? "recommendation-playlist-error" : undefined}
                aria-invalid={Boolean(errors.playlistUrl && !customPlaylist)}
                id="recommendation-playlist"
                onChange={(event) => {
                  const value = event.target.value;
                  setCustomPlaylist(value === otherPlaylistValue);
                  updateDraft("playlistUrl", value === otherPlaylistValue ? "" : value);
                }}
                value={playlistSelectValue}
              >
                <option value="">Elige una playlist…</option>
                {playlists.map((playlist) => <option key={playlist.id} value={playlist.spotifyUrl}>{playlist.title}</option>)}
                <option value={otherPlaylistValue}>Otro enlace de Spotify…</option>
              </select>
              {errors.playlistUrl && !customPlaylist ? <p className={styles.fieldError} id="recommendation-playlist-error">{errors.playlistUrl}</p> : null}
            </div>
            {customPlaylist ? (
              <AdminTextField error={errors.playlistUrl} help="El enlace dirá «Escúchala en Spotify» si no es una playlist del sitio." id="recommendation-playlist-url" label="Enlace de la playlist" onChange={(value) => updateDraft("playlistUrl", value)} required type="url" value={draft.playlistUrl} />
            ) : null}
          </fieldset>

          <VisibilityField checked={draft.visible} id="recommendation-visible" onChange={(visible) => updateDraft("visible", visible)} />
          <div className={styles.formActions}>
            <button aria-busy={pendingAction === "save"} className={styles.primaryButton} disabled={saving} type="submit">
              {pendingAction === "save" ? <><Spinner />Guardando…</> : "Guardar recomendación"}
            </button>
            <button
              className={styles.textButton}
              disabled={saving}
              onClick={() => {
                const original = items.find((item) => item.id === selectedId);
                resetEditor(original ? toDraft(original) : emptyRecommendation, selectedId);
                setAnnouncement(original ? "Cambios descartados." : "Formulario vacío.");
              }}
              type="button"
            >
              Descartar cambios
            </button>
          </div>
        </form>
      </section>
      <AdminFeedbackRegion announcement={announcement} feedback={feedback} onDismiss={dismissFeedback} />
    </>
  );
}
