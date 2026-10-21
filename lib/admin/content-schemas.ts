import { z } from "zod";

const imageUrlSchema = z.string().trim().refine(
  (value) => value === "" || value.startsWith("/images/") || /^\/api\/media\/[0-9a-f-]+$/i.test(value) || /^https:\/\/i\.ytimg\.com\/vi\/[\w-]+\/hqdefault\.jpg$/.test(value) || isVideoProviderArtworkUrl(value) || isSpotifyArtworkUrl(value),
  "Elige una imagen del sitio o de la biblioteca.",
);

function isVideoProviderArtworkUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && ["cdninstagram.com", "tiktokcdn.com"].some((domain) => url.hostname === domain || url.hostname.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

function isSpotifyArtworkUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && ["i.scdn.co", "image-cdn-ak.spotifycdn.com"].includes(url.hostname);
  } catch {
    return false;
  }
}

export const archiveContentSchema = z.object({
  title: z.string().trim().min(1).max(160),
  subtitle: z.string().trim().min(1).max(160),
  metric: z.string().trim().min(1).max(80),
  destinationUrl: z.string().trim().max(500),
  imagePath: imageUrlSchema,
  imageAlt: z.string().trim().max(240),
  visible: z.boolean(),
});

export const playlistContentSchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().min(1).max(500),
  spotifyUrl: z.string().url().refine((value) => new URL(value).hostname === "open.spotify.com"),
  imageUrl: imageUrlSchema,
  label: z.string().trim().min(1).max(80),
  tone: z.enum(["bolero", "stories", "dedication"]),
  visible: z.boolean(),
});

export const storyContentSchema = z.object({
  song: z.string().trim().min(1).max(160),
  artist: z.string().trim().min(1).max(160),
  story: z.string().trim().min(1).max(2000),
  feeling: z.string().trim().min(1).max(80),
  visible: z.boolean(),
});

export const numberContentSchema = z.object({
  platform: z.string().trim().min(1).max(100),
  value: z.string().trim().min(1).max(32),
  suffix: z.string().trim().min(1).max(32),
  description: z.string().trim().min(1).max(120),
  visible: z.boolean(),
});

export const ribbonContentSchema = z.object({
  label: z.string().trim().min(1).max(100),
  kind: z.enum(["artist", "song", "phrase"]),
  visible: z.boolean(),
});

export const aboutImageContentSchema = z.object({
  imageUrl: imageUrlSchema.refine((value) => value.length > 0, "Elige una imagen."),
  altText: z.string().trim().min(1).max(240),
  objectPosition: z.string().trim().min(1).max(80),
  visible: z.boolean(),
});

export const recommendationContentSchema = z.object({
  moodKey: z.string().trim().min(1).max(40).regex(/^[a-z0-9-]+$/),
  moodLabel: z.string().trim().min(1).max(80),
  moodDescription: z.string().trim().min(1).max(240),
  song: z.string().trim().min(1).max(160),
  artist: z.string().trim().min(1).max(160),
  description: z.string().trim().min(1).max(500),
  playlistUrl: z.string().url().refine((value) => new URL(value).hostname === "open.spotify.com"),
  spotifyTrackId: z.string().trim().min(1).max(64),
  spotifyUrl: z.string().url().refine((value) => new URL(value).hostname === "open.spotify.com"),
  visible: z.boolean(),
});

export type SiteContentCollection =
  | "archive"
  | "playlists"
  | "stories"
  | "numbers"
  | "ribbon"
  | "about-images"
  | "recommendations";

export type SiteContentDraft =
  | z.infer<typeof archiveContentSchema>
  | z.infer<typeof playlistContentSchema>
  | z.infer<typeof storyContentSchema>
  | z.infer<typeof numberContentSchema>
  | z.infer<typeof ribbonContentSchema>
  | z.infer<typeof aboutImageContentSchema>
  | z.infer<typeof recommendationContentSchema>;
