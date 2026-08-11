-- CIA App — Supabase tracking foundation
-- Date: 2026-06-23
-- Purpose: insert-only MVP schema for static frontend with anon key + RLS.
-- Important: service_role keys must never be used in the frontend.

create extension if not exists pgcrypto;

create table if not exists public.cia_sessions (
  id uuid primary key default gen_random_uuid(),
  session_id text unique not null,
  created_at timestamptz not null default now(),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  app_version text,
  landing_path text,
  referrer text,
  utm jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.cia_leads (
  id uuid primary key default gen_random_uuid(),
  session_id text,
  lead_id text unique not null,
  created_at timestamptz not null default now(),
  nome text,
  email text,
  whatsapp text,
  whatsapp_ddi text,
  trilha text check (trilha in ('de','au')),
  origem text,
  idade text,
  pais_atual text,
  tempo_fora text,
  score int check (score between 0 and 100),
  banda text,
  d1 int,
  d2 int,
  d3 int,
  d4 int,
  consent_educational_disclaimer boolean default true,
  consent_marketing_soft boolean default true,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.cia_results (
  id uuid primary key default gen_random_uuid(),
  session_id text,
  lead_id text not null,
  created_at timestamptz not null default now(),
  trilha text check (trilha in ('de','au')),
  score int not null check (score between 0 and 100),
  banda text not null,
  d1 int,
  d2 int,
  d3 int,
  d4 int,
  pais_atual text,
  tempo_fora text,
  area text,
  ingles text,
  alemao text,
  diploma text,
  prazo text,
  investimento text,
  dependentes int,
  criancas int,
  jovens int,
  answers jsonb not null default '{}'::jsonb,
  counters jsonb not null default '{}'::jsonb,
  alerts jsonb not null default '[]'::jsonb,
  insights jsonb not null default '[]'::jsonb
);

create table if not exists public.cia_events (
  id uuid primary key default gen_random_uuid(),
  session_id text,
  lead_id text,
  ts timestamptz not null default now(),
  type text not null,
  app_version text,
  trilha text,
  step int,
  payload jsonb not null default '{}'::jsonb
);

create table if not exists public.cia_cta_clicks (
  id uuid primary key default gen_random_uuid(),
  session_id text,
  lead_id text,
  created_at timestamptz not null default now(),
  trilha text,
  score int check (score between 0 and 100),
  banda text,
  cta_id text not null,
  cta_label text,
  cta_url text,
  source text
);

create table if not exists public.cia_nps (
  id uuid primary key default gen_random_uuid(),
  session_id text,
  lead_id text,
  created_at timestamptz not null default now(),
  trilha text,
  score int check (score between 0 and 100),
  banda text,
  nps int check (nps between 0 and 10),
  comentario text
);

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

create index if not exists cia_events_session_idx on public.cia_events (session_id, ts desc);
create index if not exists cia_events_lead_idx on public.cia_events (lead_id, ts desc);
create index if not exists cia_events_type_idx on public.cia_events (type, ts desc);
create index if not exists cia_results_lead_idx on public.cia_results (lead_id, created_at desc);
create index if not exists cia_cta_clicks_lead_idx on public.cia_cta_clicks (lead_id, created_at desc);
create index if not exists cia_dossier_intakes_lead_idx on public.cia_dossier_intakes (lead_id, created_at desc);
create index if not exists cia_dossier_decisions_lead_idx on public.cia_dossier_decisions (lead_id, created_at desc);

alter table public.cia_sessions enable row level security;
alter table public.cia_leads enable row level security;
alter table public.cia_results enable row level security;
alter table public.cia_events enable row level security;
alter table public.cia_cta_clicks enable row level security;
alter table public.cia_nps enable row level security;
alter table public.cia_dossier_intakes enable row level security;
alter table public.cia_dossier_decisions enable row level security;

-- Keep policies idempotent for repeated migration runs.
drop policy if exists cia_sessions_insert_anon on public.cia_sessions;
drop policy if exists cia_leads_insert_anon on public.cia_leads;
drop policy if exists cia_results_insert_anon on public.cia_results;
drop policy if exists cia_events_insert_anon on public.cia_events;
drop policy if exists cia_cta_clicks_insert_anon on public.cia_cta_clicks;
drop policy if exists cia_nps_insert_anon on public.cia_nps;
drop policy if exists cia_dossier_intakes_insert_anon on public.cia_dossier_intakes;
drop policy if exists cia_dossier_decisions_insert_anon on public.cia_dossier_decisions;

create policy cia_sessions_insert_anon on public.cia_sessions for insert to anon with check (true);
create policy cia_leads_insert_anon on public.cia_leads for insert to anon with check (true);
create policy cia_results_insert_anon on public.cia_results for insert to anon with check (true);
create policy cia_events_insert_anon on public.cia_events for insert to anon with check (true);
create policy cia_cta_clicks_insert_anon on public.cia_cta_clicks for insert to anon with check (true);
create policy cia_nps_insert_anon on public.cia_nps for insert to anon with check (true);
create policy cia_dossier_intakes_insert_anon on public.cia_dossier_intakes for insert to anon with check (true);
create policy cia_dossier_decisions_insert_anon on public.cia_dossier_decisions for insert to anon with check (true);

-- No public select/update/delete policies for MVP.
-- Analytics should use dashboard/service_role only outside the frontend.
