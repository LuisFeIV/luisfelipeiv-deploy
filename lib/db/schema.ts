import { desc, sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const dedicationStatusValues = [
  "pending",
  "approved",
  "rejected",
  "published",
] as const;

export const privateDedicationStyleValues = [
  "editorial",
  "noche",
  "tinta",
] as const;

export type DedicationStatus = (typeof dedicationStatusValues)[number];
export type PrivateDedicationStyle =
  (typeof privateDedicationStyleValues)[number];

export const dedicationStatus = pgEnum(
  "dedication_status",
  dedicationStatusValues,
);

export const dedications = pgTable(
  "dedications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sender_name: text("sender_name"),
    recipient_name: text("recipient_name"),
    song: text("song").notNull(),
    artist: text("artist").notNull(),
    message: text("message").notNull(),
    instagram: text("instagram"),
    allow_publishing: boolean("allow_publishing").default(false).notNull(),
    status: dedicationStatus("status").default("pending").notNull(),
    created_at: timestamp("created_at", {
      mode: "string",
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", {
      mode: "string",
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
    spotify_track_id: text("spotify_track_id"),
    spotify_url: text("spotify_url"),
  },
  (table) => [
    check(
      "dedications_sender_name_length",
      sql`${table.sender_name} is null or char_length(${table.sender_name}) <= 80`,
    ),
    check(
      "dedications_recipient_name_length",
      sql`${table.recipient_name} is null or char_length(${table.recipient_name}) <= 80`,
    ),
    check(
      "dedications_song_not_blank",
      sql`char_length(${table.song}) between 1 and 160 and btrim(${table.song}) <> ''`,
    ),
    check(
      "dedications_artist_not_blank",
      sql`char_length(${table.artist}) between 1 and 160 and btrim(${table.artist}) <> ''`,
    ),
    check(
      "dedications_message_not_blank",
      sql`char_length(${table.message}) between 1 and 4000 and btrim(${table.message}) <> ''`,
    ),
    check(
      "dedications_instagram_length",
      sql`${table.instagram} is null or char_length(${table.instagram}) <= 31`,
    ),
    check(
      "dedications_spotify_track_id_length",
      sql`${table.spotify_track_id} is null or char_length(${table.spotify_track_id}) between 1 and 64`,
    ),
    check(
      "dedications_spotify_url_length",
      sql`${table.spotify_url} is null or char_length(${table.spotify_url}) <= 500`,
    ),
    index("dedications_status_created_at_idx").on(
      table.status,
      desc(table.created_at),
    ),
  ],
);

export const privateDedications = pgTable(
  "private_dedications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sender_name: text("sender_name"),
    recipient_name: text("recipient_name").notNull(),
    song: text("song").notNull(),
    artist: text("artist").notNull(),
    message: text("message").notNull(),
    share_token_hash: text("share_token_hash").notNull().unique(),
    created_at: timestamp("created_at", {
      mode: "string",
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
    spotify_track_id: text("spotify_track_id"),
    spotify_url: text("spotify_url"),
    story_style: text("story_style").default("editorial").notNull(),
  },
  (table) => [
    check(
      "private_dedications_sender_name_length",
      sql`${table.sender_name} is null or char_length(${table.sender_name}) <= 80`,
    ),
    check(
      "private_dedications_recipient_name_length",
      sql`char_length(${table.recipient_name}) between 1 and 80 and btrim(${table.recipient_name}) <> ''`,
    ),
    check(
      "private_dedications_song_not_blank",
      sql`char_length(${table.song}) between 1 and 160 and btrim(${table.song}) <> ''`,
    ),
    check(
      "private_dedications_artist_not_blank",
      sql`char_length(${table.artist}) between 1 and 160 and btrim(${table.artist}) <> ''`,
    ),
    check(
      "private_dedications_message_not_blank",
      sql`char_length(${table.message}) between 1 and 4000 and btrim(${table.message}) <> ''`,
    ),
    check(
      "private_dedications_share_token_hash_length",
      sql`char_length(${table.share_token_hash}) = 64`,
    ),
    check(
      "private_dedications_spotify_track_id_length",
      sql`${table.spotify_track_id} is null or char_length(${table.spotify_track_id}) between 1 and 64`,
    ),
    check(
      "private_dedications_spotify_url_length",
      sql`${table.spotify_url} is null or char_length(${table.spotify_url}) <= 500`,
    ),
    check(
      "private_dedications_story_style_valid",
      sql`${table.story_style} in ('editorial', 'noche', 'tinta')`,
    ),
  ],
);
