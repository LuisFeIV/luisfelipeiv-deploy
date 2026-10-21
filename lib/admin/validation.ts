import type {
  AdminPlaylistDraft,
  ArchiveItemDraft,
  CommunityStoryDraft,
  PublicNumberDraft,
} from "@/lib/admin/models";

export type PlaylistDraftErrors = Partial<
  Record<"title" | "description" | "spotifyUrl" | "label" | "imageUrl", string>
>;

export type PublicNumberDraftErrors = Partial<
  Record<"platform" | "value" | "suffix" | "description", string>
>;

export type ArchiveItemDraftErrors = Partial<
  Record<"title" | "subtitle" | "metric" | "destinationUrl" | "imagePath" | "imageAlt", string>
>;

export type CommunityStoryDraftErrors = Partial<
  Record<"song" | "artist" | "story" | "feeling", string>
>;

function isSpotifyUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "open.spotify.com";
  } catch {
    return false;
  }
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function isVideoProviderArtwork(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && ["cdninstagram.com", "tiktokcdn.com"].some((domain) => url.hostname === domain || url.hostname.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

export function validatePlaylistDraft(draft: AdminPlaylistDraft) {
  const errors: PlaylistDraftErrors = {};

  if (!draft.title.trim()) errors.title = "Agrega un título.";
  if (!draft.description.trim()) errors.description = "Agrega una descripción breve.";
  if (!isSpotifyUrl(draft.spotifyUrl)) {
    errors.spotifyUrl = "Usa una URL válida de open.spotify.com.";
  }
  if (!draft.label.trim()) errors.label = "Agrega una etiqueta.";
  const isSpotifyArtwork = /^https:\/\/(?:i\.scdn\.co|image-cdn-ak\.spotifycdn\.com)\//.test(draft.imageUrl);
  if (draft.imageUrl && !draft.imageUrl.startsWith("/images/") && !draft.imageUrl.startsWith("/api/media/") && !isSpotifyArtwork) {
    errors.imageUrl = "Elige una imagen del sitio o de la biblioteca.";
  }

  return errors;
}

export function validateArchiveItemDraft(draft: ArchiveItemDraft) {
  const errors: ArchiveItemDraftErrors = {};

  if (!draft.title.trim()) errors.title = "Agrega un título.";
  if (!draft.subtitle.trim()) errors.subtitle = "Agrega un artista o contexto.";
  if (!draft.metric.trim()) errors.metric = "Agrega una cifra o llamada breve.";
  if (!isHttpUrl(draft.destinationUrl)) errors.destinationUrl = "Agrega una URL válida.";
  if (draft.imagePath && !draft.imagePath.startsWith("/images/") && !draft.imagePath.startsWith("/api/media/") && !/^https:\/\/i\.ytimg\.com\/vi\/[\w-]+\/hqdefault\.jpg$/.test(draft.imagePath) && !isVideoProviderArtwork(draft.imagePath)) {
    errors.imagePath = "Elige una imagen del sitio o de la biblioteca.";
  }
  if (draft.imagePath && !draft.imageAlt.trim()) {
    errors.imageAlt = "Describe la imagen para hacerla accesible.";
  }

  return errors;
}

export function validateCommunityStoryDraft(draft: CommunityStoryDraft) {
  const errors: CommunityStoryDraftErrors = {};

  if (!draft.song.trim()) errors.song = "Agrega una canción.";
  if (!draft.artist.trim()) errors.artist = "Agrega el artista.";
  if (!draft.story.trim()) errors.story = "Agrega la historia.";
  if (!draft.feeling.trim()) errors.feeling = "Agrega un sentimiento.";

  return errors;
}

export function validatePublicNumberDraft(draft: PublicNumberDraft) {
  const errors: PublicNumberDraftErrors = {};

  if (!draft.platform.trim()) errors.platform = "Agrega una plataforma o indicador.";
  if (!draft.value.trim()) errors.value = "Agrega una cifra.";
  if (!draft.suffix.trim()) errors.suffix = "Agrega una unidad o sufijo.";
  if (!draft.description.trim()) errors.description = "Agrega una descripción.";

  return errors;
}
