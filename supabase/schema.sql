-- =====================================================================
-- Vertical Store — schéma de la base Supabase
--
-- À coller dans Supabase > SQL Editor > New query, puis « Run ».
-- Le script peut être relancé : il ne supprime aucune donnée.
-- Ensuite, lancer supabase/seed.sql pour importer les chaussures.
-- =====================================================================


-- ---------------------------------------------------------------------
-- Administrateurs : seules ces adresses peuvent gérer la boutique.
-- Pour ajouter un admin : ajouter son email ici (en minuscules), relancer,
-- puis créer son compte dans Authentication > Users > Add user.
-- ---------------------------------------------------------------------
create table if not exists public.admins (
  email text primary key check (email = lower(email))
);

insert into public.admins (email) values
  ('angebattey.616@gmail.com'),
  ('kodjojeanothniel24@icloud.com')
on conflict do nothing;

create or replace function public.est_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.admins a
    where a.email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;


-- ---------------------------------------------------------------------
-- Chaussures, photos et pointures
-- ---------------------------------------------------------------------
create table if not exists public.chaussures (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  nom text not null check (char_length(nom) between 1 and 120),
  marque text not null default '' check (char_length(marque) <= 60),
  couleur text not null default '' check (char_length(couleur) <= 80),
  description text not null default '' check (char_length(description) <= 600),
  prix integer not null check (prix > 0),
  prix_promo integer check (prix_promo > 0),
  fin_promo timestamptz,
  en_stock boolean not null default true,
  cree_le timestamptz not null default now(),
  modifie_le timestamptz not null default now(),
  constraint promo_inferieure_au_prix check (prix_promo is null or prix_promo < prix)
);

create table if not exists public.chaussure_images (
  id uuid primary key default gen_random_uuid(),
  chaussure_id uuid not null references public.chaussures (id) on delete cascade,
  url text not null,
  position integer not null default 0
);
create index if not exists chaussure_images_ordre on public.chaussure_images (chaussure_id, position);

create table if not exists public.chaussure_pointures (
  chaussure_id uuid not null references public.chaussures (id) on delete cascade,
  pointure smallint not null check (pointure between 30 and 50),
  en_stock boolean not null default true,
  primary key (chaussure_id, pointure)
);

create or replace function public.toucher_modifie_le() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.modifie_le := now();
  return new;
end $$;

drop trigger if exists chaussures_modifie_le on public.chaussures;
create trigger chaussures_modifie_le before update on public.chaussures
  for each row execute function public.toucher_modifie_le();


-- ---------------------------------------------------------------------
-- Zones de livraison
--   details = 'commune_quartier' (Abidjan), 'quartier' (ville proche),
--             'ville' (expédition à l'intérieur du pays)
-- ---------------------------------------------------------------------
create table if not exists public.zones_livraison (
  id uuid primary key default gen_random_uuid(),
  nom text not null check (char_length(nom) between 1 and 80),
  frais integer not null check (frais >= 0),
  details text not null default 'quartier' check (details in ('commune_quartier', 'quartier', 'ville')),
  position integer not null default 0
);


-- ---------------------------------------------------------------------
-- Numéros WhatsApp qui reçoivent les commandes.
-- Un seul actif à la fois, et il en faut toujours un.
-- ---------------------------------------------------------------------
create table if not exists public.numeros_whatsapp (
  id uuid primary key default gen_random_uuid(),
  libelle text not null check (char_length(libelle) between 1 and 60),
  numero text not null check (numero ~ '^[0-9]{8,15}$'),
  actif boolean not null default false,
  cree_le timestamptz not null default now()
);
create unique index if not exists un_seul_numero_actif on public.numeros_whatsapp ((true)) where actif;

create or replace function public.verifier_numero_actif() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.numeros_whatsapp where actif) then
    raise exception 'Il faut toujours un numéro WhatsApp actif.' using errcode = 'P0001';
  end if;
  return null;
end $$;

drop trigger if exists toujours_un_numero_actif on public.numeros_whatsapp;
create constraint trigger toujours_un_numero_actif
  after update or delete on public.numeros_whatsapp
  deferrable initially deferred
  for each row execute function public.verifier_numero_actif();


-- ---------------------------------------------------------------------
-- Réglages de la boutique (une seule ligne)
-- ---------------------------------------------------------------------
create table if not exists public.reglages (
  id smallint primary key default 1 check (id = 1),
  slogan text not null default 'Le style commence par les pieds.' check (char_length(slogan) <= 120),
  chaussure_vedette_id uuid references public.chaussures (id) on delete set null,
  mode_paiement text not null default 'À la livraison' check (char_length(mode_paiement) <= 80),
  modifie_le timestamptz not null default now()
);
insert into public.reglages (id) values (1) on conflict do nothing;


-- ---------------------------------------------------------------------
-- Commandes et demandes d'articles
-- ---------------------------------------------------------------------
create sequence if not exists public.numero_commande;
create sequence if not exists public.numero_demande;

create table if not exists public.commandes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  chaussure_id uuid references public.chaussures (id) on delete set null,
  chaussure_nom text not null,
  chaussure_image text,
  pointure smallint not null,
  quantite smallint not null check (quantite between 1 and 10),
  prix_unitaire integer not null,
  zone text not null,
  frais_livraison integer not null,
  total integer not null,
  client_nom text not null,
  client_telephone text not null,
  commune text,
  quartier text,
  ville text,
  adresse text not null,
  repere text,
  mode_paiement text not null,
  numero_whatsapp text not null,
  statut text not null default 'nouvelle' check (statut in ('nouvelle', 'envoyee', 'livree', 'annulee')),
  cree_le timestamptz not null default now()
);
create index if not exists commandes_recentes on public.commandes (cree_le desc);

create table if not exists public.demandes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  photo text,
  pointure text,
  client_nom text not null,
  client_telephone text not null,
  lieu text not null,
  commentaire text,
  numero_whatsapp text not null,
  statut text not null default 'nouvelle' check (statut in ('nouvelle', 'envoyee', 'livree', 'annulee')),
  cree_le timestamptz not null default now()
);
create index if not exists demandes_recentes on public.demandes (cree_le desc);


-- ---------------------------------------------------------------------
-- Sécurité : Row Level Security sur toutes les tables.
--   Public : lit le catalogue, les zones et les réglages ; crée commandes
--            et demandes uniquement via les fonctions plus bas.
--   Admins : tout.
-- ---------------------------------------------------------------------
alter table public.admins enable row level security;
alter table public.chaussures enable row level security;
alter table public.chaussure_images enable row level security;
alter table public.chaussure_pointures enable row level security;
alter table public.zones_livraison enable row level security;
alter table public.numeros_whatsapp enable row level security;
alter table public.reglages enable row level security;
alter table public.commandes enable row level security;
alter table public.demandes enable row level security;

drop policy if exists "lecture publique" on public.chaussures;
create policy "lecture publique" on public.chaussures for select to anon, authenticated using (true);
drop policy if exists "lecture publique" on public.chaussure_images;
create policy "lecture publique" on public.chaussure_images for select to anon, authenticated using (true);
drop policy if exists "lecture publique" on public.chaussure_pointures;
create policy "lecture publique" on public.chaussure_pointures for select to anon, authenticated using (true);
drop policy if exists "lecture publique" on public.zones_livraison;
create policy "lecture publique" on public.zones_livraison for select to anon, authenticated using (true);
drop policy if exists "lecture publique" on public.reglages;
create policy "lecture publique" on public.reglages for select to anon, authenticated using (true);

drop policy if exists "admins gerent" on public.chaussures;
create policy "admins gerent" on public.chaussures for all to authenticated
  using (public.est_admin()) with check (public.est_admin());
drop policy if exists "admins gerent" on public.chaussure_images;
create policy "admins gerent" on public.chaussure_images for all to authenticated
  using (public.est_admin()) with check (public.est_admin());
drop policy if exists "admins gerent" on public.chaussure_pointures;
create policy "admins gerent" on public.chaussure_pointures for all to authenticated
  using (public.est_admin()) with check (public.est_admin());
drop policy if exists "admins gerent" on public.zones_livraison;
create policy "admins gerent" on public.zones_livraison for all to authenticated
  using (public.est_admin()) with check (public.est_admin());
drop policy if exists "admins gerent" on public.numeros_whatsapp;
create policy "admins gerent" on public.numeros_whatsapp for all to authenticated
  using (public.est_admin()) with check (public.est_admin());
drop policy if exists "admins gerent" on public.reglages;
create policy "admins gerent" on public.reglages for all to authenticated
  using (public.est_admin()) with check (public.est_admin());
drop policy if exists "admins gerent" on public.commandes;
create policy "admins gerent" on public.commandes for all to authenticated
  using (public.est_admin()) with check (public.est_admin());
drop policy if exists "admins gerent" on public.demandes;
create policy "admins gerent" on public.demandes for all to authenticated
  using (public.est_admin()) with check (public.est_admin());
drop policy if exists "admins lisent" on public.admins;
create policy "admins lisent" on public.admins for select to authenticated using (public.est_admin());

-- Droits d'accès aux tables, donnés explicitement : le script ne dépend pas des droits par défaut
-- du projet. La sécurité ligne par ligne ci-dessus décide ensuite ce que chacun voit vraiment.
grant usage on schema public to anon, authenticated;
grant select on public.chaussures, public.chaussure_images, public.chaussure_pointures,
  public.zones_livraison, public.reglages to anon, authenticated;
grant insert, update, delete on public.chaussures, public.chaussure_images, public.chaussure_pointures,
  public.zones_livraison, public.reglages to authenticated;
grant select, insert, update, delete on public.numeros_whatsapp, public.commandes, public.demandes to authenticated;
grant select on public.admins to authenticated;


-- ---------------------------------------------------------------------
-- Fonctions appelées par le site
-- ---------------------------------------------------------------------

-- Téléphone ivoirien -> 10 chiffres (ex. 0700000000), sinon null.
create or replace function public.normaliser_telephone(p text) returns text
language plpgsql immutable set search_path = '' as $$
declare
  d text := regexp_replace(coalesce(p, ''), '[^0-9]', '', 'g');
begin
  if char_length(d) = 15 and left(d, 5) = '00225' then
    d := substr(d, 6);
  elsif char_length(d) = 13 and left(d, 3) = '225' then
    d := substr(d, 4);
  end if;
  if d ~ '^(01|05|07|21|25|27)[0-9]{8}$' then
    return d;
  end if;
  return null;
end $$;

-- Numéro WhatsApp qui reçoit en ce moment (pour le bouton flottant).
create or replace function public.numero_actif() returns text
language sql stable security definer set search_path = '' as $$
  select numero from public.numeros_whatsapp where actif limit 1;
$$;

-- Enregistre une commande. Le prix et le total sont recalculés ici,
-- jamais pris du navigateur.
create or replace function public.creer_commande(
  p_slug text,
  p_pointure integer,
  p_quantite integer,
  p_zone_id uuid,
  p_nom text,
  p_telephone text,
  p_commune text default null,
  p_quartier text default null,
  p_ville text default null,
  p_adresse text default null,
  p_repere text default null
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  c public.chaussures%rowtype;
  z public.zones_livraison%rowtype;
  v_nom text := left(btrim(coalesce(p_nom, '')), 80);
  v_tel text := public.normaliser_telephone(p_telephone);
  v_commune text := nullif(left(btrim(coalesce(p_commune, '')), 80), '');
  v_quartier text := nullif(left(btrim(coalesce(p_quartier, '')), 80), '');
  v_ville text := nullif(left(btrim(coalesce(p_ville, '')), 80), '');
  v_adresse text := left(btrim(coalesce(p_adresse, '')), 300);
  v_repere text := nullif(left(btrim(coalesce(p_repere, '')), 200), '');
  v_prix integer;
  v_total integer;
  v_numero text;
  v_paiement text;
  v_image text;
  v_code text;
  n bigint;
begin
  select * into c from public.chaussures where slug = p_slug;
  if not found then
    raise exception 'Cette chaussure n''est plus disponible.' using errcode = 'P0001';
  end if;
  if not c.en_stock then
    raise exception 'Cette chaussure est en rupture de stock.' using errcode = 'P0001';
  end if;
  if not exists (
    select 1 from public.chaussure_pointures
    where chaussure_id = c.id and pointure = p_pointure and en_stock
  ) then
    raise exception 'La pointure % n''est plus disponible.', p_pointure using errcode = 'P0001';
  end if;
  if p_quantite is null or p_quantite < 1 or p_quantite > 10 then
    raise exception 'Quantité invalide (entre 1 et 10).' using errcode = 'P0001';
  end if;
  select * into z from public.zones_livraison where id = p_zone_id;
  if not found then
    raise exception 'Choisissez une zone de livraison.' using errcode = 'P0001';
  end if;
  if char_length(v_nom) < 2 then
    raise exception 'Indiquez votre nom complet.' using errcode = 'P0001';
  end if;
  if v_tel is null then
    raise exception 'Numéro de téléphone invalide.' using errcode = 'P0001';
  end if;
  if z.details = 'commune_quartier' and (v_commune is null or v_quartier is null) then
    raise exception 'Indiquez la commune et le quartier.' using errcode = 'P0001';
  end if;
  if z.details = 'quartier' and v_quartier is null then
    raise exception 'Indiquez le quartier.' using errcode = 'P0001';
  end if;
  if z.details = 'ville' and v_ville is null then
    raise exception 'Indiquez la ville.' using errcode = 'P0001';
  end if;
  if char_length(v_adresse) < 3 then
    raise exception 'Indiquez une adresse précise.' using errcode = 'P0001';
  end if;
  if (select count(*) from public.commandes
      where client_telephone = v_tel and cree_le > now() - interval '10 minutes') >= 5 then
    raise exception 'Trop de commandes en peu de temps. Réessayez dans quelques minutes.' using errcode = 'P0001';
  end if;

  v_prix := case
    when c.prix_promo is not null and (c.fin_promo is null or c.fin_promo > now()) then c.prix_promo
    else c.prix
  end;
  v_total := v_prix * p_quantite + z.frais;

  select numero into v_numero from public.numeros_whatsapp where actif limit 1;
  if v_numero is null then
    raise exception 'La boutique ne peut pas recevoir de commande pour le moment.' using errcode = 'P0001';
  end if;
  select mode_paiement into v_paiement from public.reglages where id = 1;
  select url into v_image from public.chaussure_images where chaussure_id = c.id order by position limit 1;

  n := nextval('public.numero_commande');
  v_code := 'CMD-' || case when n < 10000 then lpad(n::text, 4, '0') else n::text end;

  insert into public.commandes (
    code, chaussure_id, chaussure_nom, chaussure_image, pointure, quantite, prix_unitaire,
    zone, frais_livraison, total, client_nom, client_telephone, commune, quartier, ville,
    adresse, repere, mode_paiement, numero_whatsapp
  ) values (
    v_code, c.id, c.nom, v_image, p_pointure, p_quantite, v_prix,
    z.nom, z.frais, v_total, v_nom, v_tel, v_commune, v_quartier, v_ville,
    v_adresse, v_repere, coalesce(v_paiement, 'À la livraison'), v_numero
  );

  return jsonb_build_object(
    'code', v_code,
    'chaussure', c.nom,
    'pointure', p_pointure,
    'quantite', p_quantite,
    'prixUnitaire', v_prix,
    'zone', z.nom,
    'fraisLivraison', z.frais,
    'total', v_total,
    'modePaiement', coalesce(v_paiement, 'À la livraison'),
    'whatsapp', v_numero
  );
end $$;

-- Enregistre une demande d'article (photo déjà déposée dans le bucket « demandes »).
create or replace function public.creer_demande(
  p_photo text,
  p_pointure text,
  p_nom text,
  p_telephone text,
  p_lieu text,
  p_commentaire text default null
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_photo text := nullif(btrim(coalesce(p_photo, '')), '');
  v_pointure text := nullif(left(btrim(coalesce(p_pointure, '')), 20), '');
  v_nom text := left(btrim(coalesce(p_nom, '')), 80);
  v_tel text := public.normaliser_telephone(p_telephone);
  v_lieu text := left(btrim(coalesce(p_lieu, '')), 120);
  v_commentaire text := nullif(left(btrim(coalesce(p_commentaire, '')), 500), '');
  v_numero text;
  v_code text;
  n bigint;
begin
  if v_photo is not null and v_photo !~ '^[a-z0-9-]{8,64}\.(webp|jpg|jpeg|png)$' then
    raise exception 'Photo invalide.' using errcode = 'P0001';
  end if;
  if v_photo is null and v_commentaire is null then
    raise exception 'Ajoutez une photo ou décrivez la chaussure.' using errcode = 'P0001';
  end if;
  if char_length(v_nom) < 2 then
    raise exception 'Indiquez votre nom complet.' using errcode = 'P0001';
  end if;
  if v_tel is null then
    raise exception 'Numéro de téléphone invalide.' using errcode = 'P0001';
  end if;
  if char_length(v_lieu) < 2 then
    raise exception 'Indiquez votre lieu de livraison.' using errcode = 'P0001';
  end if;
  if (select count(*) from public.demandes
      where client_telephone = v_tel and cree_le > now() - interval '10 minutes') >= 5 then
    raise exception 'Trop de demandes en peu de temps. Réessayez dans quelques minutes.' using errcode = 'P0001';
  end if;

  select numero into v_numero from public.numeros_whatsapp where actif limit 1;
  if v_numero is null then
    raise exception 'La boutique ne peut pas recevoir de demande pour le moment.' using errcode = 'P0001';
  end if;

  n := nextval('public.numero_demande');
  v_code := 'DEM-' || case when n < 10000 then lpad(n::text, 4, '0') else n::text end;

  insert into public.demandes (code, photo, pointure, client_nom, client_telephone, lieu, commentaire, numero_whatsapp)
  values (v_code, v_photo, v_pointure, v_nom, v_tel, v_lieu, v_commentaire, v_numero);

  return jsonb_build_object('code', v_code, 'whatsapp', v_numero, 'photo', v_photo);
end $$;

-- Active un numéro (et désactive les autres) en une seule opération.
create or replace function public.activer_numero(p_id uuid) returns void
language plpgsql security invoker set search_path = '' as $$
begin
  if not public.est_admin() then
    raise exception 'Accès refusé.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.numeros_whatsapp where id = p_id) then
    raise exception 'Numéro introuvable.' using errcode = 'P0001';
  end if;
  update public.numeros_whatsapp set actif = false where actif and id <> p_id;
  update public.numeros_whatsapp set actif = true where id = p_id;
end $$;

revoke all on function public.creer_commande(text, integer, integer, uuid, text, text, text, text, text, text, text) from public;
revoke all on function public.creer_demande(text, text, text, text, text, text) from public;
revoke all on function public.activer_numero(uuid) from public, anon;
revoke all on function public.numero_actif() from public;
revoke all on function public.est_admin() from public;
grant execute on function public.creer_commande(text, integer, integer, uuid, text, text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.creer_demande(text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.numero_actif() to anon, authenticated;
grant execute on function public.est_admin() to anon, authenticated;
grant execute on function public.activer_numero(uuid) to authenticated;


-- ---------------------------------------------------------------------
-- Stockage des photos
--   produits : photos des chaussures (lecture publique, écriture admins)
--   demandes : photos envoyées par les clients (dépôt public, gestion admins)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('produits', 'produits', true, 5242880, array['image/webp', 'image/png', 'image/jpeg']),
  ('demandes', 'demandes', true, 5242880, array['image/webp', 'image/png', 'image/jpeg'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "produits : admins ajoutent" on storage.objects;
create policy "produits : admins ajoutent" on storage.objects for insert to authenticated
  with check (bucket_id = 'produits' and public.est_admin());
drop policy if exists "produits : admins lisent" on storage.objects;
create policy "produits : admins lisent" on storage.objects for select to authenticated
  using (bucket_id = 'produits' and public.est_admin());
drop policy if exists "produits : admins modifient" on storage.objects;
create policy "produits : admins modifient" on storage.objects for update to authenticated
  using (bucket_id = 'produits' and public.est_admin());
drop policy if exists "produits : admins suppriment" on storage.objects;
create policy "produits : admins suppriment" on storage.objects for delete to authenticated
  using (bucket_id = 'produits' and public.est_admin());

drop policy if exists "demandes : depot public" on storage.objects;
create policy "demandes : depot public" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'demandes' and name ~ '^[a-z0-9-]{8,64}\.(webp|jpg|jpeg|png)$');
drop policy if exists "demandes : admins lisent" on storage.objects;
create policy "demandes : admins lisent" on storage.objects for select to authenticated
  using (bucket_id = 'demandes' and public.est_admin());
drop policy if exists "demandes : admins suppriment" on storage.objects;
create policy "demandes : admins suppriment" on storage.objects for delete to authenticated
  using (bucket_id = 'demandes' and public.est_admin());
