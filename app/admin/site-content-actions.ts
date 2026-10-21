"use server";

import { cookies } from "next/headers";
import { eq, max } from "drizzle-orm";
import { z } from "zod";

import { adminSessionCookieName, hasValidAdminSession } from "@/lib/admin-auth";
import {
  aboutImageContentSchema,
  archiveContentSchema,
  numberContentSchema,
  playlistContentSchema,
  recommendationContentSchema,
  ribbonContentSchema,
  storyContentSchema,
  type SiteContentCollection,
  type SiteContentDraft,
} from "@/lib/admin/content-schemas";
import { getDatabase } from "@/lib/db/client";
import {
  aboutImages,
  archiveItems,
  communityStories,
  dedicationRecommendations,
  publicNumbers,
  ribbonItems,
  sitePlaylists,
} from "@/lib/db/schema";
import { setContentSortOrder } from "@/lib/db/site-content";

type ActionResult = { success: true; id?: string } | { success: false; message: string };

async function hasAdminAccess() {
  const cookieStore = await cookies();
  return hasValidAdminSession(cookieStore.get(adminSessionCookieName)?.value);
}

async function nextOrder(collection: SiteContentCollection) {
  const db = getDatabase();

  switch (collection) {
    case "archive": return (await db.select({ value: max(archiveItems.sort_order) }).from(archiveItems))[0]?.value ?? 0;
    case "playlists": return (await db.select({ value: max(sitePlaylists.sort_order) }).from(sitePlaylists))[0]?.value ?? 0;
    case "stories": return (await db.select({ value: max(communityStories.sort_order) }).from(communityStories))[0]?.value ?? 0;
    case "numbers": return (await db.select({ value: max(publicNumbers.sort_order) }).from(publicNumbers))[0]?.value ?? 0;
    case "ribbon": return (await db.select({ value: max(ribbonItems.sort_order) }).from(ribbonItems))[0]?.value ?? 0;
    case "about-images": return (await db.select({ value: max(aboutImages.sort_order) }).from(aboutImages))[0]?.value ?? 0;
    case "recommendations": return (await db.select({ value: max(dedicationRecommendations.sort_order) }).from(dedicationRecommendations))[0]?.value ?? 0;
  }
}

export async function saveSiteContent(
  collection: SiteContentCollection,
  id: string | null,
  draft: SiteContentDraft,
): Promise<ActionResult> {
  if (!(await hasAdminAccess())) {
    return { success: false, message: "Tu sesión terminó. Inicia sesión de nuevo." };
  }

  const db = getDatabase();

  try {
    const order = id ? undefined : (await nextOrder(collection)) + 1;

    switch (collection) {
      case "archive": {
        const parsed = archiveContentSchema.safeParse(draft);
        if (!parsed.success) return { success: false, message: "Revisa los campos de la pieza." };
        const values = { title: parsed.data.title, subtitle: parsed.data.subtitle, metric: parsed.data.metric, destination_url: parsed.data.destinationUrl, image_url: parsed.data.imagePath, image_alt: parsed.data.imageAlt, visible: parsed.data.visible, updated_at: new Date().toISOString() };
        if (id) await db.update(archiveItems).set(values).where(eq(archiveItems.id, id));
        else { const [row] = await db.insert(archiveItems).values({ ...values, sort_order: order ?? 1 }).returning({ id: archiveItems.id }); return { success: true, id: row.id }; }
        break;
      }
      case "playlists": {
        const parsed = playlistContentSchema.safeParse(draft);
        if (!parsed.success) return { success: false, message: "Revisa los campos de la playlist." };
        const values = { title: parsed.data.title, description: parsed.data.description, spotify_url: parsed.data.spotifyUrl, image_url: parsed.data.imageUrl, label: parsed.data.label, tone: parsed.data.tone, visible: parsed.data.visible, updated_at: new Date().toISOString() };
        if (id) await db.update(sitePlaylists).set(values).where(eq(sitePlaylists.id, id));
        else { const [row] = await db.insert(sitePlaylists).values({ ...values, sort_order: order ?? 1 }).returning({ id: sitePlaylists.id }); return { success: true, id: row.id }; }
        break;
      }
      case "stories": {
        const parsed = storyContentSchema.safeParse(draft);
        if (!parsed.success) return { success: false, message: "Revisa los campos de la historia." };
        const values = { ...parsed.data, updated_at: new Date().toISOString() };
        if (id) await db.update(communityStories).set(values).where(eq(communityStories.id, id));
        else { const [row] = await db.insert(communityStories).values({ ...values, sort_order: order ?? 1 }).returning({ id: communityStories.id }); return { success: true, id: row.id }; }
        break;
      }
      case "numbers": {
        const parsed = numberContentSchema.safeParse(draft);
        if (!parsed.success) return { success: false, message: "Revisa los campos del número." };
        const values = { ...parsed.data, updated_at: new Date().toISOString() };
        if (id) await db.update(publicNumbers).set(values).where(eq(publicNumbers.id, id));
        else { const [row] = await db.insert(publicNumbers).values({ ...values, sort_order: order ?? 1 }).returning({ id: publicNumbers.id }); return { success: true, id: row.id }; }
        break;
      }
      case "ribbon": {
        const parsed = ribbonContentSchema.safeParse(draft);
        if (!parsed.success) return { success: false, message: "Revisa el texto de la cinta." };
        const values = { ...parsed.data, updated_at: new Date().toISOString() };
        if (id) await db.update(ribbonItems).set(values).where(eq(ribbonItems.id, id));
        else { const [row] = await db.insert(ribbonItems).values({ ...values, sort_order: order ?? 1 }).returning({ id: ribbonItems.id }); return { success: true, id: row.id }; }
        break;
      }
      case "about-images": {
        const parsed = aboutImageContentSchema.safeParse(draft);
        if (!parsed.success) return { success: false, message: "Elige una imagen e incluye su descripción." };
        const values = { image_url: parsed.data.imageUrl, alt_text: parsed.data.altText, object_position: parsed.data.objectPosition, visible: parsed.data.visible, updated_at: new Date().toISOString() };
        if (id) await db.update(aboutImages).set(values).where(eq(aboutImages.id, id));
        else { const [row] = await db.insert(aboutImages).values({ ...values, sort_order: order ?? 1 }).returning({ id: aboutImages.id }); return { success: true, id: row.id }; }
        break;
      }
      case "recommendations": {
        const parsed = recommendationContentSchema.safeParse(draft);
        if (!parsed.success) return { success: false, message: "Revisa el mood y los datos de Spotify." };
        const values = { mood_key: parsed.data.moodKey, mood_label: parsed.data.moodLabel, mood_description: parsed.data.moodDescription, song: parsed.data.song, artist: parsed.data.artist, description: parsed.data.description, playlist_url: parsed.data.playlistUrl, spotify_track_id: parsed.data.spotifyTrackId, spotify_url: parsed.data.spotifyUrl, visible: parsed.data.visible, updated_at: new Date().toISOString() };
        if (id) await db.update(dedicationRecommendations).set(values).where(eq(dedicationRecommendations.id, id));
        else { const [row] = await db.insert(dedicationRecommendations).values({ ...values, sort_order: order ?? 1 }).returning({ id: dedicationRecommendations.id }); return { success: true, id: row.id }; }
        break;
      }
    }

    return { success: true, id: id ?? undefined };
  } catch (error) {
    console.error("Unable to save site content.", error);
    return { success: false, message: "No pudimos guardar los cambios. Inténtalo de nuevo." };
  }
}

export async function deleteSiteContent(
  collection: SiteContentCollection,
  id: string,
): Promise<ActionResult> {
  if (!(await hasAdminAccess())) {
    return { success: false, message: "Tu sesión terminó. Inicia sesión de nuevo." };
  }
  if (!z.uuid().safeParse(id).success) {
    return { success: false, message: "No encontramos ese elemento." };
  }

  const db = getDatabase();

  try {
    switch (collection) {
      case "archive": await db.delete(archiveItems).where(eq(archiveItems.id, id)); break;
      case "playlists": await db.delete(sitePlaylists).where(eq(sitePlaylists.id, id)); break;
      case "stories": await db.delete(communityStories).where(eq(communityStories.id, id)); break;
      case "numbers": await db.delete(publicNumbers).where(eq(publicNumbers.id, id)); break;
      case "ribbon": await db.delete(ribbonItems).where(eq(ribbonItems.id, id)); break;
      case "about-images": await db.delete(aboutImages).where(eq(aboutImages.id, id)); break;
      case "recommendations": await db.delete(dedicationRecommendations).where(eq(dedicationRecommendations.id, id)); break;
    }
    return { success: true };
  } catch (error) {
    console.error("Unable to delete site content.", error);
    return { success: false, message: "No pudimos eliminarlo. Inténtalo de nuevo." };
  }
}

export async function reorderSiteContent(
  collection: SiteContentCollection,
  values: Array<{ id: string; order: number }>,
): Promise<ActionResult> {
  if (!(await hasAdminAccess())) {
    return { success: false, message: "Tu sesión terminó. Inicia sesión de nuevo." };
  }

  try {
    await setContentSortOrder(collection, values);
    return { success: true };
  } catch (error) {
    console.error("Unable to reorder site content.", error);
    return { success: false, message: "No pudimos guardar el nuevo orden." };
  }
}
