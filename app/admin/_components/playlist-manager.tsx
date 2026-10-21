"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
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
  AdminFeedbackRegion,
  AdminTextAreaField,
  AdminTextField,
  MoveIcon,
  Spinner,
  VisibilityField,
} from "./form-controls";
import { useSiteContentMutations } from "./use-site-content-mutations";
import { MediaPicker } from "./media-picker";

type PlaylistManagerProps = {
  initialPlaylists: AdminPlaylistViewModel[];
};

const emptyPlaylist: AdminPlaylistDraft = {
  title: "",
  description: "",
  spotifyUrl: "",
  imageUrl: "",
  label: "",
  visible: true,
  tone: "dedication",
};

const toneLabels: Record<PlaylistCardTone, string> = {
  bolero: "Bolero",
  dedication: "Dedicatoria",
  stories: "Historias",
};

type SpotifyStatus = { tone: "error" | "loading" | "success"; message: string };
type SpotifyPlaylistPayload = { description?: string; error?: string; imageUrl?: string | null; title?: string };

const playlistUrlPattern = /^https:\/\/open\.spotify\.com\/(?:intl-[a-z-]+\/)?playlist\/[A-Za-z0-9]{22}(?:[/?#].*)?$/;

function isSpotifyArtwork(value: string) {
  try {
    return ["i.scdn.co", "image-cdn-ak.spotifycdn.com"].includes(new URL(value).hostname);
  } catch {
    return false;
  }
}

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
  const [spotifyStatus, setSpotifyStatus] = useState<SpotifyStatus | null>(null);
  const [lookup, setLookup] = useState<{ attempt: number; url: string } | null>(null);
  const lastAutofill = useRef({ title: "", description: "" });
  const { announcement, dismissFeedback, feedback, notify, pendingAction, reorder, save, saving, setAnnouncement } = useSiteContentMutations("playlists");
  const sortedPlaylists = useMemo(() => sortPlaylists(playlists), [playlists]);
  const isCreating = selectedId === null;

  useEffect(() => {
    if (!lookup) return;
    const spotifyUrl = lookup.url;
    if (!playlistUrlPattern.test(spotifyUrl)) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setSpotifyStatus({ tone: "loading", message: "Buscando la playlist en Spotify…" });
      try {
        const response = await fetch("/api/admin/spotify/playlist-artwork", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ spotifyUrl }),
          signal: controller.signal,
        });
        const payload = await response.json() as SpotifyPlaylistPayload;
        if (!response.ok) throw new Error(payload.error ?? "Spotify no devolvió datos de esa playlist.");

        const previous = lastAutofill.current;
        const filled: string[] = [];
        setDraft((current) => {
          if (current.spotifyUrl.trim() !== spotifyUrl) return current;
          const next = { ...current };
          if (payload.title && (!current.title.trim() || current.title === previous.title)) next.title = payload.title;
          if (payload.description && (!current.description.trim() || current.description === previous.description)) next.description = payload.description;
          if (payload.imageUrl && (!current.imageUrl || isSpotifyArtwork(current.imageUrl))) next.imageUrl = payload.imageUrl;
          return next;
        });
        if (payload.title) filled.push("título");
        if (payload.description) filled.push("descripción");
        if (payload.imageUrl) filled.push("portada");
        lastAutofill.current = { title: payload.title ?? "", description: payload.description ?? "" };
        const filledText = filled.length > 1 ? `${filled.slice(0, -1).join(", ")} y ${filled.at(-1)}` : filled[0];
        const missingText = [
          !payload.description ? "Esta playlist no tiene descripción en Spotify; escribe una para la tarjeta." : "",
          !payload.imageUrl ? "Spotify no compartió portada; elige una imagen." : "",
        ].filter(Boolean).join(" ");
        setSpotifyStatus({
          tone: "success",
          message: `Spotify compartió ${filledText}. Sólo cambiamos campos vacíos o que no habías editado. ${missingText || "Revisa y ajusta antes de guardar."}`,
        });
      } catch (error) {
        if (controller.signal.aborted) return;
        setSpotifyStatus({
          tone: "error",
          message: `${error instanceof Error ? error.message : "No pudimos consultar Spotify."} Puedes llenar el título, la descripción y la portada a mano.`,
        });
      }
    }, 500);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [lookup]);

  function updateDraft<Key extends keyof AdminPlaylistDraft>(
    field: Key,
    value: AdminPlaylistDraft[Key],
  ) {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    if (field === "spotifyUrl") {
      const url = String(value).trim();
      setSpotifyStatus(url && !playlistUrlPattern.test(url) ? { tone: "error", message: "Pega el enlace de una playlist: open.spotify.com/playlist/…" } : null);
      setLookup(url ? { attempt: 0, url } : null);
    }
  }

  function resetSpotifyLookup() {
    setSpotifyStatus(null);
    setLookup(null);
    lastAutofill.current = { title: "", description: "" };
  }

  function selectPlaylist(playlist: AdminPlaylistViewModel) {
    setSelectedId(playlist.id);
    setDraft({ ...playlist });
    setErrors({});
    resetSpotifyLookup();
    setAnnouncement(`${playlist.title} lista para editar.`);
  }

  function startCreating() {
    setSelectedId(null);
    setDraft(emptyPlaylist);
    setErrors({});
    resetSpotifyLookup();
    setAnnouncement("Formulario para una nueva playlist.");
  }

  async function movePlaylist(id: string, direction: -1 | 1) {
    const ordered = sortPlaylists(playlists);
    const currentIndex = ordered.findIndex((item) => item.id === id);
    const targetIndex = currentIndex + direction;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= ordered.length) return;
    const reordered = [...ordered];
    [reordered[currentIndex], reordered[targetIndex]] = [reordered[targetIndex], reordered[currentIndex]];
    const nextItems = reordered.map((item, index) => ({ ...item, order: index + 1 }));
    if (await reorder(nextItems)) setPlaylists(nextItems);
  }

  async function togglePlaylistVisibility(playlist: AdminPlaylistViewModel) {
    const visible = !playlist.visible;
    const updated = { ...playlist, visible };
    const result = await save(playlist.id, updated, {
      action: `visibility:${playlist.id}`,
      successMessage: visible ? `«${playlist.title}» ahora es visible en el sitio.` : `«${playlist.title}» quedó oculta del sitio.`,
    });
    if (!result.success) return;
    setPlaylists((current) => current.map((item) => item.id === playlist.id ? updated : item));
    if (selectedId === playlist.id) {
      setDraft((current) => ({ ...current, visible }));
    }
  }

  async function submitDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const nextErrors = validatePlaylistDraft(draft);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      notify("error", "Revisa los campos marcados antes de continuar.");
      requestAnimationFrame(() => {
        form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      });
      return;
    }

    const result = await save(selectedId, draft);
    if (!result.success) return;
    if (selectedId) setPlaylists((current) => current.map((item) => item.id === selectedId ? { ...item, ...draft } : item));
    else {
      const id = result.id;
      if (!id) return;
      setPlaylists((current) => [...current, { ...draft, id, order: playlists.length + 1 }]);
      setSelectedId(id);
    }
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
                  disabled={index === 0 || saving}
                  onClick={() => movePlaylist(playlist.id, -1)}
                  type="button"
                >
                  <MoveIcon direction="up" />
                </button>
                <button
                  aria-label={`Bajar ${playlist.title}`}
                  disabled={index === sortedPlaylists.length - 1 || saving}
                  onClick={() => movePlaylist(playlist.id, 1)}
                  type="button"
                >
                  <MoveIcon direction="down" />
                </button>
                <button aria-busy={pendingAction === `visibility:${playlist.id}`} disabled={saving} onClick={() => togglePlaylistVisibility(playlist)} type="button">
                  {pendingAction === `visibility:${playlist.id}` ? <Spinner /> : null}
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
            <p className={styles.sectionLabel}>{isCreating ? "Nuevo elemento" : "Edición guardada"}</p>
            <h2 id="playlist-editor-title">{isCreating ? "Crear playlist" : "Editar playlist"}</h2>
          </div>
        </div>
        <form className={styles.editorForm} noValidate onSubmit={submitDraft}>
          <AdminTextField
            error={errors.spotifyUrl}
            help="Al pegarlo completamos título, descripción y portada con lo que Spotify comparta. Todo sigue siendo editable."
            id="playlist-url"
            label="Primero, pega el enlace de la playlist de Spotify"
            onChange={(value) => updateDraft("spotifyUrl", value)}
            required
            type="url"
            value={draft.spotifyUrl}
          />
          {spotifyStatus ? (
            <div aria-live="polite" className={styles.inlineStatus} data-tone={spotifyStatus.tone}>
              {spotifyStatus.tone === "loading" ? <Spinner /> : null}
              <span>{spotifyStatus.message}</span>
              {spotifyStatus.tone === "error" && lookup && playlistUrlPattern.test(lookup.url) ? (
                <button className={styles.textButton} onClick={() => setLookup((current) => current ? { ...current, attempt: current.attempt + 1 } : current)} type="button">Reintentar</button>
              ) : null}
            </div>
          ) : null}
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
            error={errors.label}
            id="playlist-label"
            label="Etiqueta"
            onChange={(value) => updateDraft("label", value)}
            required
            value={draft.label}
          />
          <MediaPicker error={errors.imageUrl} help="La portada de Spotify se carga sola; si subes o eliges otra, esa tiene prioridad." id="playlist-image" label="Portada de la playlist" onChange={(value) => updateDraft("imageUrl", value)} value={draft.imageUrl} />
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
            <button aria-busy={pendingAction === "save"} className={styles.primaryButton} disabled={saving} type="submit">
              {pendingAction === "save" ? <><Spinner />Guardando…</> : "Guardar playlist"}
            </button>
            <button
              className={styles.textButton}
              onClick={() => {
                const original = playlists.find((item) => item.id === selectedId);
                setDraft(original ? { ...original } : emptyPlaylist);
                setErrors({});
                resetSpotifyLookup();
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
              {draft.imageUrl ? <Image alt="" className={styles.playlistPreviewImage} fill sizes="(max-width: 700px) 112px, 240px" src={draft.imageUrl} unoptimized /> : null}
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
      <AdminFeedbackRegion announcement={announcement} feedback={feedback} onDismiss={dismissFeedback} />
    </div>
  );
}
