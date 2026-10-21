CREATE TABLE "about_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"image_url" text NOT NULL,
	"alt_text" text NOT NULL,
	"object_position" text DEFAULT 'center center' NOT NULL,
	"visible" boolean DEFAULT true NOT NULL,
	"sort_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "archive_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"subtitle" text NOT NULL,
	"metric" text NOT NULL,
	"destination_url" text NOT NULL,
	"image_url" text DEFAULT '' NOT NULL,
	"image_alt" text DEFAULT '' NOT NULL,
	"visible" boolean DEFAULT true NOT NULL,
	"sort_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_stories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"song" text NOT NULL,
	"artist" text NOT NULL,
	"story" text NOT NULL,
	"feeling" text NOT NULL,
	"visible" boolean DEFAULT true NOT NULL,
	"sort_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dedication_recommendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mood_key" text NOT NULL,
	"mood_label" text NOT NULL,
	"mood_description" text NOT NULL,
	"song" text NOT NULL,
	"artist" text NOT NULL,
	"description" text NOT NULL,
	"playlist_url" text NOT NULL,
	"spotify_track_id" text NOT NULL,
	"spotify_url" text NOT NULL,
	"visible" boolean DEFAULT true NOT NULL,
	"sort_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "public_numbers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" text NOT NULL,
	"value" text NOT NULL,
	"suffix" text NOT NULL,
	"description" text NOT NULL,
	"visible" boolean DEFAULT true NOT NULL,
	"sort_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ribbon_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" text NOT NULL,
	"kind" text DEFAULT 'artist' NOT NULL,
	"visible" boolean DEFAULT true NOT NULL,
	"sort_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_media_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"storage_key" text NOT NULL,
	"original_name" text NOT NULL,
	"content_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "site_media_assets_storage_key_unique" UNIQUE("storage_key")
);
--> statement-breakpoint
CREATE TABLE "site_playlists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"spotify_url" text NOT NULL,
	"label" text NOT NULL,
	"tone" text DEFAULT 'dedication' NOT NULL,
	"visible" boolean DEFAULT true NOT NULL,
	"sort_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "about_images_visible_order_idx" ON "about_images" USING btree ("visible","sort_order");--> statement-breakpoint
CREATE INDEX "archive_items_visible_order_idx" ON "archive_items" USING btree ("visible","sort_order");--> statement-breakpoint
CREATE INDEX "community_stories_visible_order_idx" ON "community_stories" USING btree ("visible","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "dedication_recommendations_mood_key_idx" ON "dedication_recommendations" USING btree ("mood_key");--> statement-breakpoint
CREATE INDEX "dedication_recommendations_visible_order_idx" ON "dedication_recommendations" USING btree ("visible","sort_order");--> statement-breakpoint
CREATE INDEX "public_numbers_visible_order_idx" ON "public_numbers" USING btree ("visible","sort_order");--> statement-breakpoint
CREATE INDEX "ribbon_items_visible_order_idx" ON "ribbon_items" USING btree ("visible","sort_order");--> statement-breakpoint
CREATE INDEX "site_playlists_visible_order_idx" ON "site_playlists" USING btree ("visible","sort_order");
--> statement-breakpoint
INSERT INTO "about_images" ("image_url", "alt_text", "object_position", "sort_order") VALUES
('/images/site-2.jpg', 'Luis Felipe IV en una sesión editorial', 'center center', 1),
('/images/site-3.jpg', 'Luis Felipe IV con una radio vintage', 'center center', 2),
('/images/site-4.jpg', 'Retrato de Luis Felipe IV', 'center 20%', 3);
--> statement-breakpoint
INSERT INTO "archive_items" ("title", "subtitle", "metric", "destination_url", "image_url", "image_alt", "sort_order") VALUES
('Top 5 Melancólicas', 'Varios artistas', 'Enlace pendiente', '', '/images/site-5.jpg', 'Top 5 canciones melancólicas', 1),
('100 Canciones — Cap. 100', 'Episodio final', '3M+ views', 'https://www.instagram.com/luisfelipeiv/reel/DS7-ZitgTHy/', '/images/site-6.jpg', '100 Canciones de Amor — Capítulo 100', 2),
('Omakase', 'Alvarito Díaz', 'Enlace pendiente', '', '', '', 3),
('Sienna', 'The Marías', '1.8M views', 'https://www.tiktok.com/@luisfelipeiv/video/7655032496760933639', '', '', 4),
('Doma', 'Josean Log', '1.5M views', 'https://www.tiktok.com/@luisfelipeiv/video/7649080801925156114', '', '', 5),
('Uno', 'YouTube', 'Enlace pendiente', '', '', '', 6);
--> statement-breakpoint
INSERT INTO "community_stories" ("song", "artist", "story", "feeling", "sort_order") VALUES
('Fix You', 'Coldplay', 'La puse en repeat el día que mi abuela murió. No encontraba palabras y esta canción las tenía todas.', 'Pérdida', 1),
('El Triste', 'José José', 'Mi papá la canta cada vez que toma. Antes me daba vergüenza, ahora la busco yo para entender qué le pasa.', 'Nostalgia', 2),
('Sienna', 'The Marías', 'Se la mandé a alguien sin decirle nada. Ella entendió todo. Nunca lo hablamos pero algo cambió.', 'Amor tácito', 3),
('Yellow', 'Coldplay', 'Primera canción que escuché en inglés y entendí de corazón sin saber el idioma. Algo en la melodía lo decía todo.', 'Descubrimiento', 4),
('Omakase', 'Alvarito Díaz', 'La escuché por primera vez en una cena de cumpleaños. Ahora no puedo comer sin pensar en esa noche.', 'Memoria', 5),
('Doma', 'Josean Log', 'Me la puso mi ex antes de irse. No sé si fue una despedida o una promesa. Todavía no lo sé.', 'Ambigüedad', 6),
('Pink + White', 'Frank Ocean', 'La escucho cuando necesito recordarme que las cosas buenas también terminan y eso está bien.', 'Paz', 7);
--> statement-breakpoint
INSERT INTO "dedication_recommendations" ("mood_key", "mood_label", "mood_description", "song", "artist", "description", "playlist_url", "spotify_track_id", "spotify_url", "sort_order") VALUES
('love', 'Enamorarse', 'Te ayudamos a elegir según lo que sientes.', 'Contigo', 'Los Panchos', 'Una declaración cálida y directa para decirle a alguien que quieres compartir la vida a su lado.', 'https://open.spotify.com/playlist/2PoIQAnGxzymkXlT2rk7Lt', '0RayTAbupCL4o2F54f9tCP', 'https://open.spotify.com/track/0RayTAbupCL4o2F54f9tCP', 1),
('miss', 'Extrañar', 'Te ayudamos a elegir según lo que sientes.', 'La Gata Bajo la Lluvia', 'Rocío Dúrcal', 'Para una despedida en la que todavía queda cariño y cuesta decir todo lo que se siente.', 'https://open.spotify.com/playlist/2PoIQAnGxzymkXlT2rk7Lt', '2kfSFdq2h0xLXq01em1zc7', 'https://open.spotify.com/track/2kfSFdq2h0xLXq01em1zc7', 2),
('celebrate', 'Celebrar', 'Te ayudamos a elegir según lo que sientes.', 'Yellow', 'Coldplay', 'Para reconocer a esa persona que iluminó una etapa y hacerle saber lo importante que es.', 'https://open.spotify.com/playlist/2PoIQAnGxzymkXlT2rk7Lt', '3AJwUDP919kvQ9QcozQPxg', 'https://open.spotify.com/track/3AJwUDP919kvQ9QcozQPxg', 3);
--> statement-breakpoint
INSERT INTO "public_numbers" ("platform", "value", "suffix", "description", "sort_order") VALUES
('TikTok', '476', 'mil', 'seguidores', 1),
('Instagram', '278', 'mil', 'seguidores', 2),
('Contenido en TikTok', '29.6', 'M', 'me gusta acumulados', 3),
('Playlist destacada', '15.6', 'mil', 'seguidores en Spotify', 4);
--> statement-breakpoint
INSERT INTO "ribbon_items" ("label", "kind", "sort_order") VALUES
('Historias musicales', 'phrase', 1),
('José José', 'artist', 2),
('Frank Ocean', 'artist', 3),
('Coldplay', 'artist', 4),
('The Marías', 'artist', 5),
('Alvarito Díaz', 'artist', 6),
('Josean Log', 'artist', 7),
('Canciones que se sienten', 'song', 8);
--> statement-breakpoint
INSERT INTO "site_playlists" ("title", "description", "spotify_url", "label", "tone", "sort_order") VALUES
('Boleros que se sienten', 'Para escuchar sin prisa y con el corazón abierto.', 'https://open.spotify.com/playlist/7DPmtNccvQJqSfoS2OkNnF', 'Playlist', 'bolero', 1),
('100 Canciones que se sienten', 'La música detrás de las historias que nos acompañan.', 'https://open.spotify.com/playlist/1aeqRnxHEanUjNnyeaoGHw', 'La más guardada', 'stories', 2),
('Canciones para dedicar', 'Para decir con música lo que cuesta poner en palabras.', 'https://open.spotify.com/playlist/2PoIQAnGxzymkXlT2rk7Lt', 'Para compartir', 'dedication', 3);
