import "server-only";

import { asc, eq, sql } from "drizzle-orm";

import type {
  AboutImageViewModel,
  AdminPlaylistViewModel,
  ArchiveItemViewModel,
  CommunityStoryViewModel,
  DedicationRecommendationViewModel,
  PublicNumberViewModel,
  RibbonItemViewModel,
} from "@/lib/admin/models";

import { getDatabase } from "./client";
import {
  aboutImages,
  archiveItems,
  communityStories,
  dedicationRecommendations,
  publicNumbers,
  ribbonItems,
  sitePlaylists,
} from "./schema";

export async function listAdminArchiveItems(): Promise<ArchiveItemViewModel[]> {
  const rows = await getDatabase().select().from(archiveItems).orderBy(asc(archiveItems.sort_order));
  return rows.map((row) => ({ id: row.id, title: row.title, subtitle: row.subtitle, metric: row.metric, destinationUrl: row.destination_url, imagePath: row.image_url, imageAlt: row.image_alt, visible: row.visible, order: row.sort_order }));
}

export async function listAdminPlaylists(): Promise<AdminPlaylistViewModel[]> {
  const rows = await getDatabase().select().from(sitePlaylists).orderBy(asc(sitePlaylists.sort_order));
  return rows.map((row) => ({ id: row.id, title: row.title, description: row.description, spotifyUrl: row.spotify_url, imageUrl: row.image_url, label: row.label, tone: row.tone, visible: row.visible, order: row.sort_order }));
}

export async function listAdminCommunityStories(): Promise<CommunityStoryViewModel[]> {
  const rows = await getDatabase().select().from(communityStories).orderBy(asc(communityStories.sort_order));
  return rows.map((row) => ({ id: row.id, song: row.song, artist: row.artist, story: row.story, feeling: row.feeling, visible: row.visible, order: row.sort_order }));
}

export async function listAdminPublicNumbers(): Promise<PublicNumberViewModel[]> {
  const rows = await getDatabase().select().from(publicNumbers).orderBy(asc(publicNumbers.sort_order));
  return rows.map((row) => ({ id: row.id, platform: row.platform, value: row.value, suffix: row.suffix, description: row.description, visible: row.visible, order: row.sort_order }));
}

export async function listAdminRibbonItems(): Promise<RibbonItemViewModel[]> {
  const rows = await getDatabase().select().from(ribbonItems).orderBy(asc(ribbonItems.sort_order));
  return rows.map((row) => ({ id: row.id, label: row.label, kind: row.kind, visible: row.visible, order: row.sort_order }));
}

export async function listAdminAboutImages(): Promise<AboutImageViewModel[]> {
  const rows = await getDatabase().select().from(aboutImages).orderBy(asc(aboutImages.sort_order));
  return rows.map((row) => ({ id: row.id, imageUrl: row.image_url, altText: row.alt_text, objectPosition: row.object_position, visible: row.visible, order: row.sort_order }));
}

export async function listAdminRecommendations(): Promise<DedicationRecommendationViewModel[]> {
  const rows = await getDatabase().select().from(dedicationRecommendations).orderBy(asc(dedicationRecommendations.sort_order));
  return rows.map((row) => ({ id: row.id, moodKey: row.mood_key, moodLabel: row.mood_label, moodDescription: row.mood_description, song: row.song, artist: row.artist, description: row.description, playlistUrl: row.playlist_url, spotifyTrackId: row.spotify_track_id, spotifyUrl: row.spotify_url, visible: row.visible, order: row.sort_order }));
}

export async function listPublicSiteContent() {
  const [archive, playlists, stories, numbers, ribbon, images, recommendations] = await Promise.all([
    getDatabase().select().from(archiveItems).where(eq(archiveItems.visible, true)).orderBy(asc(archiveItems.sort_order)),
    getDatabase().select().from(sitePlaylists).where(eq(sitePlaylists.visible, true)).orderBy(asc(sitePlaylists.sort_order)),
    getDatabase().select().from(communityStories).where(eq(communityStories.visible, true)).orderBy(asc(communityStories.sort_order)),
    getDatabase().select().from(publicNumbers).where(eq(publicNumbers.visible, true)).orderBy(asc(publicNumbers.sort_order)),
    getDatabase().select().from(ribbonItems).where(eq(ribbonItems.visible, true)).orderBy(asc(ribbonItems.sort_order)),
    getDatabase().select().from(aboutImages).where(eq(aboutImages.visible, true)).orderBy(asc(aboutImages.sort_order)),
    getDatabase().select().from(dedicationRecommendations).where(eq(dedicationRecommendations.visible, true)).orderBy(asc(dedicationRecommendations.sort_order)),
  ]);

  return { archive, playlists, stories, numbers, ribbon, images, recommendations };
}

export async function setContentSortOrder(
  collection: string,
  values: Array<{ id: string; order: number }>,
) {
  const db = getDatabase();
  const cases = sql.join(values.map(({ id, order }) => sql`when ${id}::uuid then ${order}::integer`), sql` `);
  const ids = sql.join(values.map(({ id }) => sql`${id}::uuid`), sql`, `);

  switch (collection) {
    case "archive": return db.execute(sql`update ${archiveItems} set sort_order = case id ${cases} end, updated_at = now() where id in (${ids})`);
    case "playlists": return db.execute(sql`update ${sitePlaylists} set sort_order = case id ${cases} end, updated_at = now() where id in (${ids})`);
    case "stories": return db.execute(sql`update ${communityStories} set sort_order = case id ${cases} end, updated_at = now() where id in (${ids})`);
    case "numbers": return db.execute(sql`update ${publicNumbers} set sort_order = case id ${cases} end, updated_at = now() where id in (${ids})`);
    case "ribbon": return db.execute(sql`update ${ribbonItems} set sort_order = case id ${cases} end, updated_at = now() where id in (${ids})`);
    case "about-images": return db.execute(sql`update ${aboutImages} set sort_order = case id ${cases} end, updated_at = now() where id in (${ids})`);
    case "recommendations": return db.execute(sql`update ${dedicationRecommendations} set sort_order = case id ${cases} end, updated_at = now() where id in (${ids})`);
    default: throw new Error("Invalid site content collection.");
  }
}
