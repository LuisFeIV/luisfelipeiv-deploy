create type public.dedication_status as enum (
  'pending',
  'approved',
  'rejected',
  'published'
);

create table public.dedications (
  id uuid primary key default gen_random_uuid(),
  sender_name text,
  recipient_name text,
  song text not null,
  artist text not null,
  message text not null,
  instagram text,
  allow_publishing boolean not null default false,
  status public.dedication_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dedications_sender_name_length check (
    sender_name is null or char_length(sender_name) <= 80
  ),
  constraint dedications_recipient_name_length check (
    recipient_name is null or char_length(recipient_name) <= 80
  ),
  constraint dedications_song_not_blank check (
    char_length(song) between 1 and 160 and btrim(song) <> ''
  ),
  constraint dedications_artist_not_blank check (
    char_length(artist) between 1 and 160 and btrim(artist) <> ''
  ),
  constraint dedications_message_not_blank check (
    char_length(message) between 1 and 4000 and btrim(message) <> ''
  ),
  constraint dedications_instagram_length check (
    instagram is null or char_length(instagram) <= 31
  )
);

create index dedications_status_created_at_idx
  on public.dedications (status, created_at desc);

alter table public.dedications enable row level security;

create function public.set_dedications_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_dedications_updated_at
before update on public.dedications
for each row
execute function public.set_dedications_updated_at();
