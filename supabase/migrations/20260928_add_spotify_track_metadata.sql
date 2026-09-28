alter table public.dedications
  add column spotify_track_id text,
  add column spotify_url text,
  add constraint dedications_spotify_track_id_length check (
    spotify_track_id is null or char_length(spotify_track_id) between 1 and 64
  ),
  add constraint dedications_spotify_url_length check (
    spotify_url is null or char_length(spotify_url) <= 500
  );

alter table public.private_dedications
  add column spotify_track_id text,
  add column spotify_url text,
  add constraint private_dedications_spotify_track_id_length check (
    spotify_track_id is null or char_length(spotify_track_id) between 1 and 64
  ),
  add constraint private_dedications_spotify_url_length check (
    spotify_url is null or char_length(spotify_url) <= 500
  );
