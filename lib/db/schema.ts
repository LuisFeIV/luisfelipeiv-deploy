import { desc, sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  uniqueIndex,
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

export const ribbonItemKindValues = ["artist", "song", "phrase"] as const;
export type RibbonItemKind = (typeof ribbonItemKindValues)[number];

export const playlistCardToneValues = ["bolero", "stories", "dedication"] as const;
export type PlaylistCardTone = (typeof playlistCardToneValues)[number];

export const dedicationStatus = pgEnum(
  "dedication_status",
  dedicationStatusValues,
);

export const siteMediaAssets = pgTable("site_media_assets", {
  id: uuid("id").defaultRandom().primaryKey(),
  storage_key: text("storage_key").notNull().unique(),
  original_name: text("original_name").notNull(),
  content_type: text("content_type").notNull(),
  size_bytes: integer("size_bytes").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  created_at: timestamp("created_at", { mode: "string", withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const archiveItems = pgTable(
  "archive_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    subtitle: text("subtitle").notNull(),
    metric: text("metric").notNull(),
    destination_url: text("destination_url").notNull(),
    image_url: text("image_url").notNull().default(""),
    image_alt: text("image_alt").notNull().default(""),
    visible: boolean("visible").notNull().default(true),
    sort_order: integer("sort_order").notNull(),
    created_at: timestamp("created_at", { mode: "string", withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { mode: "string", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("archive_items_visible_order_idx").on(table.visible, table.sort_order)],
);

export const sitePlaylists = pgTable(
  "site_playlists",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    spotify_url: text("spotify_url").notNull(),
    image_url: text("image_url").notNull().default(""),
    label: text("label").notNull(),
    tone: text("tone").$type<PlaylistCardTone>().notNull().default("dedication"),
    visible: boolean("visible").notNull().default(true),
    sort_order: integer("sort_order").notNull(),
    created_at: timestamp("created_at", { mode: "string", withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { mode: "string", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("site_playlists_visible_order_idx").on(table.visible, table.sort_order)],
);

export const communityStories = pgTable(
  "community_stories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    song: text("song").notNull(),
    artist: text("artist").notNull(),
    story: text("story").notNull(),
    feeling: text("feeling").notNull(),
    visible: boolean("visible").notNull().default(true),
    sort_order: integer("sort_order").notNull(),
    created_at: timestamp("created_at", { mode: "string", withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { mode: "string", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("community_stories_visible_order_idx").on(table.visible, table.sort_order)],
);

export const publicNumbers = pgTable(
  "public_numbers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    platform: text("platform").notNull(),
    value: text("value").notNull(),
    suffix: text("suffix").notNull(),
    description: text("description").notNull(),
    visible: boolean("visible").notNull().default(true),
    sort_order: integer("sort_order").notNull(),
    created_at: timestamp("created_at", { mode: "string", withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { mode: "string", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("public_numbers_visible_order_idx").on(table.visible, table.sort_order)],
);

export const ribbonItems = pgTable(
  "ribbon_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    label: text("label").notNull(),
    kind: text("kind").$type<RibbonItemKind>().notNull().default("artist"),
    visible: boolean("visible").notNull().default(true),
    sort_order: integer("sort_order").notNull(),
    created_at: timestamp("created_at", { mode: "string", withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { mode: "string", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("ribbon_items_visible_order_idx").on(table.visible, table.sort_order)],
);

export const aboutImages = pgTable(
  "about_images",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    image_url: text("image_url").notNull(),
    alt_text: text("alt_text").notNull(),
    object_position: text("object_position").notNull().default("center center"),
    visible: boolean("visible").notNull().default(true),
    sort_order: integer("sort_order").notNull(),
    created_at: timestamp("created_at", { mode: "string", withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { mode: "string", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("about_images_visible_order_idx").on(table.visible, table.sort_order)],
);

export const dedicationRecommendations = pgTable(
  "dedication_recommendations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    mood_key: text("mood_key").notNull(),
    mood_label: text("mood_label").notNull(),
    mood_description: text("mood_description").notNull(),
    song: text("song").notNull(),
    artist: text("artist").notNull(),
    description: text("description").notNull(),
    playlist_url: text("playlist_url").notNull(),
    spotify_track_id: text("spotify_track_id").notNull(),
    spotify_url: text("spotify_url").notNull(),
    visible: boolean("visible").notNull().default(true),
    sort_order: integer("sort_order").notNull(),
    created_at: timestamp("created_at", { mode: "string", withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { mode: "string", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("dedication_recommendations_mood_key_idx").on(table.mood_key),
    index("dedication_recommendations_visible_order_idx").on(table.visible, table.sort_order),
  ],
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
