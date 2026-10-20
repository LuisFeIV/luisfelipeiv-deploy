import "server-only";

import { and, desc, eq } from "drizzle-orm";

import { getDatabase } from "./client";
import {
  dedications,
  privateDedications,
  type DedicationStatus,
  type PrivateDedicationStyle,
} from "./schema";

type DedicationInput = {
  allow_publishing: boolean;
  artist: string;
  instagram: string | null;
  message: string;
  recipient_name: string | null;
  sender_name: string | null;
  song: string;
  spotify_track_id: string | null;
  spotify_url: string | null;
};

type PrivateDedicationInput = {
  artist: string;
  message: string;
  recipient_name: string;
  sender_name: string | null;
  share_token_hash: string;
  song: string;
  spotify_track_id: string | null;
  spotify_url: string | null;
  story_style: PrivateDedicationStyle;
};

type DedicationFilters = {
  authorizedOnly: boolean;
  status: DedicationStatus | null;
};

export async function createDedication(input: DedicationInput) {
  await getDatabase().insert(dedications).values(input);
}

export async function createPrivateDedication(input: PrivateDedicationInput) {
  await getDatabase().insert(privateDedications).values(input);
}

export async function findPrivateDedication(shareTokenHash: string) {
  const [dedication] = await getDatabase()
    .select({
      artist: privateDedications.artist,
      message: privateDedications.message,
      recipient_name: privateDedications.recipient_name,
      sender_name: privateDedications.sender_name,
      song: privateDedications.song,
      spotify_track_id: privateDedications.spotify_track_id,
      spotify_url: privateDedications.spotify_url,
      story_style: privateDedications.story_style,
    })
    .from(privateDedications)
    .where(eq(privateDedications.share_token_hash, shareTokenHash))
    .limit(1);

  if (!dedication) {
    return null;
  }

  return {
    ...dedication,
    story_style: dedication.story_style as PrivateDedicationStyle,
  };
}

export async function listDedications(filters: DedicationFilters) {
  return getDatabase()
    .select({
      allow_publishing: dedications.allow_publishing,
      artist: dedications.artist,
      created_at: dedications.created_at,
      id: dedications.id,
      instagram: dedications.instagram,
      message: dedications.message,
      recipient_name: dedications.recipient_name,
      sender_name: dedications.sender_name,
      song: dedications.song,
      status: dedications.status,
    })
    .from(dedications)
    .where(
      and(
        filters.status ? eq(dedications.status, filters.status) : undefined,
        filters.authorizedOnly
          ? eq(dedications.allow_publishing, true)
          : undefined,
      ),
    )
    .orderBy(desc(dedications.created_at))
    .limit(100);
}

export async function updateDedicationStatus(
  id: string,
  status: DedicationStatus,
) {
  const [updated] = await getDatabase()
    .update(dedications)
    .set({ status })
    .where(eq(dedications.id, id))
    .returning({ id: dedications.id });

  return updated ?? null;
}
