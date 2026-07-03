create table if not exists artwork_templates (
  id text primary key,
  config jsonb not null,
  updated_by text,
  updated_at timestamptz not null default now()
);

alter table artwork_templates enable row level security;

drop policy if exists "No direct public artwork template access" on artwork_templates;
create policy "No direct public artwork template access"
on artwork_templates
for all
to anon, authenticated
using (false)
with check (false);
