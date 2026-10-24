-- Reproduit le strict nécessaire de Supabase pour tester schema.sql dans PGlite :
-- rôles anon/authenticated, auth.jwt() et schéma storage. Les droits par défaut du schéma public
-- (donnés aujourd'hui par Supabase) sont ajoutés ou non par le test : le schéma doit marcher dans les deux cas.
create role anon nologin;
create role authenticated nologin;

create schema auth;
create function auth.jwt() returns jsonb language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb
$$;
grant usage on schema auth to anon, authenticated;
grant execute on all functions in schema auth to anon, authenticated;


create schema storage;
grant usage on schema storage to anon, authenticated;
create table storage.buckets (
  id text primary key,
  name text not null,
  public boolean default false,
  file_size_limit bigint,
  allowed_mime_types text[]
);
create table storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets (id),
  name text not null,
  created_at timestamptz default now()
);
alter table storage.objects enable row level security;
grant all on storage.objects to anon, authenticated;
