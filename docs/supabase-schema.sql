-- CIA App — Supabase MVP schema
-- Use anon key in frontend ONLY with RLS enabled.
-- Keep service_role only in server-side functions/proxy.

create extension if not exists pgcrypto;

create table if not exists public.cia_leads (
  id uuid primary key default gen_random_uuid(),
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
  score int,
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
  lead_id text not null,
  created_at timestamptz not null default now(),
  trilha text check (trilha in ('de','au')),
  score int not null,
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
  lead_id text,
  ts timestamptz not null default now(),
  type text not null,
  app_version text,
  payload jsonb not null default '{}'::jsonb
);

create table if not exists public.cia_cta_clicks (
  id uuid primary key default gen_random_uuid(),
  lead_id text,
  created_at timestamptz not null default now(),
  trilha text,
  score int,
  banda text,
  cta_id text not null,
  cta_label text,
  cta_url text,
  source text
);

create table if not exists public.cia_nps (
  id uuid primary key default gen_random_uuid(),
  lead_id text,
  created_at timestamptz not null default now(),
  trilha text,
  score int,
  banda text,
  nps int check (nps between 0 and 10),
  comentario text
);

-- RLS: permissive insert-only MVP for static frontend.
-- Tighten later with Edge Function / captcha / rate limiting.
alter table public.cia_leads enable row level security;
alter table public.cia_results enable row level security;
alter table public.cia_events enable row level security;
alter table public.cia_cta_clicks enable row level security;
alter table public.cia_nps enable row level security;

create policy "cia_leads_insert_anon" on public.cia_leads for insert to anon with check (true);
create policy "cia_results_insert_anon" on public.cia_results for insert to anon with check (true);
create policy "cia_events_insert_anon" on public.cia_events for insert to anon with check (true);
create policy "cia_cta_clicks_insert_anon" on public.cia_cta_clicks for insert to anon with check (true);
create policy "cia_nps_insert_anon" on public.cia_nps for insert to anon with check (true);

-- No public select/update/delete policies for MVP.
