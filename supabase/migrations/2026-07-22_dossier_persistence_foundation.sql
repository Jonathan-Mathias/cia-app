-- CIA App — Dossier persistence foundation
-- Date: 2026-07-22
-- Purpose: persist dossier intake submissions and motor decisions for controlled MVP testing.
-- Important: keep insert-only access from anon role; no public select/update/delete.

create table if not exists public.cia_dossier_intakes (
  id uuid primary key default gen_random_uuid(),
  session_id text,
  lead_id text,
  created_at timestamptz not null default now(),
  trilha text check (trilha in ('de','au')),
  route_label text,
  score int check (score between 0 and 100),
  banda text,
  profile jsonb not null default '{}'::jsonb,
  materials jsonb not null default '{}'::jsonb,
  questionnaire jsonb not null default '{}'::jsonb,
  meta jsonb not null default '{}'::jsonb
);

create table if not exists public.cia_dossier_decisions (
  id uuid primary key default gen_random_uuid(),
  session_id text,
  lead_id text,
  created_at timestamptz not null default now(),
  trilha text check (trilha in ('de','au')),
  route_label text,
  score int check (score between 0 and 100),
  banda text,
  decision_status text,
  recommended_offer text,
  next_step text,
  source text,
  request_payload jsonb not null default '{}'::jsonb,
  decision_payload jsonb not null default '{}'::jsonb
);

create index if not exists cia_dossier_intakes_lead_idx on public.cia_dossier_intakes (lead_id, created_at desc);
create index if not exists cia_dossier_decisions_lead_idx on public.cia_dossier_decisions (lead_id, created_at desc);
create index if not exists cia_dossier_decisions_status_idx on public.cia_dossier_decisions (decision_status, created_at desc);

alter table public.cia_dossier_intakes enable row level security;
alter table public.cia_dossier_decisions enable row level security;

drop policy if exists cia_dossier_intakes_insert_anon on public.cia_dossier_intakes;
drop policy if exists cia_dossier_decisions_insert_anon on public.cia_dossier_decisions;

create policy cia_dossier_intakes_insert_anon on public.cia_dossier_intakes for insert to anon with check (true);
create policy cia_dossier_decisions_insert_anon on public.cia_dossier_decisions for insert to anon with check (true);

-- No public select/update/delete policies for MVP.
