alter table public.private_dedications
  add column story_style text not null default 'editorial';

alter table public.private_dedications
  add constraint private_dedications_story_style_valid check (
    story_style in ('editorial', 'noche', 'tinta')
  );
