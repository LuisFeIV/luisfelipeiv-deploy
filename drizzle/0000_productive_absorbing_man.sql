CREATE TYPE "public"."dedication_status" AS ENUM('pending', 'approved', 'rejected', 'published');--> statement-breakpoint
CREATE TABLE "dedications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sender_name" text,
	"recipient_name" text,
	"song" text NOT NULL,
	"artist" text NOT NULL,
	"message" text NOT NULL,
	"instagram" text,
	"allow_publishing" boolean DEFAULT false NOT NULL,
	"status" "dedication_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"spotify_track_id" text,
	"spotify_url" text,
	CONSTRAINT "dedications_sender_name_length" CHECK ("dedications"."sender_name" is null or char_length("dedications"."sender_name") <= 80),
	CONSTRAINT "dedications_recipient_name_length" CHECK ("dedications"."recipient_name" is null or char_length("dedications"."recipient_name") <= 80),
	CONSTRAINT "dedications_song_not_blank" CHECK (char_length("dedications"."song") between 1 and 160 and btrim("dedications"."song") <> ''),
	CONSTRAINT "dedications_artist_not_blank" CHECK (char_length("dedications"."artist") between 1 and 160 and btrim("dedications"."artist") <> ''),
	CONSTRAINT "dedications_message_not_blank" CHECK (char_length("dedications"."message") between 1 and 4000 and btrim("dedications"."message") <> ''),
	CONSTRAINT "dedications_instagram_length" CHECK ("dedications"."instagram" is null or char_length("dedications"."instagram") <= 31),
	CONSTRAINT "dedications_spotify_track_id_length" CHECK ("dedications"."spotify_track_id" is null or char_length("dedications"."spotify_track_id") between 1 and 64),
	CONSTRAINT "dedications_spotify_url_length" CHECK ("dedications"."spotify_url" is null or char_length("dedications"."spotify_url") <= 500)
);
--> statement-breakpoint
CREATE TABLE "private_dedications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sender_name" text,
	"recipient_name" text NOT NULL,
	"song" text NOT NULL,
	"artist" text NOT NULL,
	"message" text NOT NULL,
	"share_token_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"spotify_track_id" text,
	"spotify_url" text,
	"story_style" text DEFAULT 'editorial' NOT NULL,
	CONSTRAINT "private_dedications_share_token_hash_unique" UNIQUE("share_token_hash"),
	CONSTRAINT "private_dedications_sender_name_length" CHECK ("private_dedications"."sender_name" is null or char_length("private_dedications"."sender_name") <= 80),
	CONSTRAINT "private_dedications_recipient_name_length" CHECK (char_length("private_dedications"."recipient_name") between 1 and 80 and btrim("private_dedications"."recipient_name") <> ''),
	CONSTRAINT "private_dedications_song_not_blank" CHECK (char_length("private_dedications"."song") between 1 and 160 and btrim("private_dedications"."song") <> ''),
	CONSTRAINT "private_dedications_artist_not_blank" CHECK (char_length("private_dedications"."artist") between 1 and 160 and btrim("private_dedications"."artist") <> ''),
	CONSTRAINT "private_dedications_message_not_blank" CHECK (char_length("private_dedications"."message") between 1 and 4000 and btrim("private_dedications"."message") <> ''),
	CONSTRAINT "private_dedications_share_token_hash_length" CHECK (char_length("private_dedications"."share_token_hash") = 64),
	CONSTRAINT "private_dedications_spotify_track_id_length" CHECK ("private_dedications"."spotify_track_id" is null or char_length("private_dedications"."spotify_track_id") between 1 and 64),
	CONSTRAINT "private_dedications_spotify_url_length" CHECK ("private_dedications"."spotify_url" is null or char_length("private_dedications"."spotify_url") <= 500),
	CONSTRAINT "private_dedications_story_style_valid" CHECK ("private_dedications"."story_style" in ('editorial', 'noche', 'tinta'))
);
--> statement-breakpoint
CREATE INDEX "dedications_status_created_at_idx" ON "dedications" USING btree ("status","created_at" desc);--> statement-breakpoint
CREATE FUNCTION "public"."set_dedications_updated_at"()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;--> statement-breakpoint
CREATE TRIGGER "set_dedications_updated_at"
BEFORE UPDATE ON "public"."dedications"
FOR EACH ROW
EXECUTE FUNCTION "public"."set_dedications_updated_at"();
