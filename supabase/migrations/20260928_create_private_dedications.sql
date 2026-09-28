create table public.private_dedications (
  id uuid primary key default gen_random_uuid(),
  sender_name text,
  recipient_name text not null,
  song text not null,
  artist text not null,
  message text not null,
  share_token_hash text not null unique,
  created_at timestamptz not null default now(),
  constraint private_dedications_sender_name_length check (
    sender_name is null or char_length(sender_name) <= 80
  ),
  constraint private_dedications_recipient_name_length check (
    char_length(recipient_name) between 1 and 80 and btrim(recipient_name) <> ''
  ),
  constraint private_dedications_song_not_blank check (
    char_length(song) between 1 and 160 and btrim(song) <> ''
  ),
  constraint private_dedications_artist_not_blank check (
    char_length(artist) between 1 and 160 and btrim(artist) <> ''
  ),
  constraint private_dedications_message_not_blank check (
    char_length(message) between 1 and 4000 and btrim(message) <> ''
  ),
  constraint private_dedications_share_token_hash_length check (
    char_length(share_token_hash) = 64
  )
);

alter table public.private_dedications enable row level security;
