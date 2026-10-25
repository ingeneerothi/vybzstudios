-- =====================================================================
-- Vertical Store — INSTALLATION COMPLÈTE, en un seul copier-coller
-- Supabase > SQL Editor > New query : coller tout ce fichier, puis « Run ».
-- Contient schema.sql puis seed.sql (généré par scripts/generer-seed.mjs : ne pas modifier à la main).
-- Peut être relancé sans risque : rien n'est supprimé ni dupliqué.
-- =====================================================================

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
-- Phrase ajoutée en haut des commandes envoyées à ce numéro (ex. « Bonjour c'est Ange »).
-- Vide pour le numéro principal de la boutique.
alter table public.numeros_whatsapp add column if not exists intro text
  check (intro is null or char_length(intro) between 1 and 120);

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
  v_intro text;
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

  select numero, intro into v_numero, v_intro from public.numeros_whatsapp where actif limit 1;
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
    'whatsapp', v_numero,
    'intro', v_intro
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


-- =====================================================================
-- Vertical Store — données de départ (généré par scripts/generer-seed.mjs)
-- À lancer APRÈS schema.sql. Peut être relancé : rien n'est dupliqué.
-- =====================================================================

-- Zones de livraison (seulement si aucune zone n'existe encore)
insert into public.zones_livraison (nom, frais, details, position)
select * from (values
  ('Abidjan', 2000, 'commune_quartier', 0),
  ('Grand-Bassam', 3000, 'quartier', 1),
  ('Songon', 3000, 'quartier', 2),
  ('Expédition à l''intérieur du pays', 3000, 'ville', 3)
) as v(nom, frais, details, position)
where not exists (select 1 from public.zones_livraison);

-- Numéro WhatsApp de départ (seulement si aucun numéro n'existe encore)
insert into public.numeros_whatsapp (libelle, numero, actif)
select * from (values
  ('Boutique', '2250506523816', true)
) as v(libelle, numero, actif)
where not exists (select 1 from public.numeros_whatsapp);

-- ASICS Gel-Kayano 14 Noir Argent
insert into public.chaussures (slug, nom, marque, couleur, description, prix, prix_promo, fin_promo, cree_le)
values ('asics-gel-kayano-14-noir-argent', 'Gel-Kayano 14 Noir Argent', 'ASICS', 'Noir / argent', 'La Gel-Kayano 14 en noir total, relevée de lignes argentées. Une silhouette running des années 2000, sobre et facile à porter avec tout.', 22000, null, null, now() - interval '0 minutes')
on conflict (slug) do nothing;
insert into public.chaussure_images (chaussure_id, url, position)
select c.id, v.url, v.position from public.chaussures c, (values
  ('/chaussures/asics-gel-kayano-14-noir-argent/01.webp', 0),
  ('/chaussures/asics-gel-kayano-14-noir-argent/02.webp', 1),
  ('/chaussures/asics-gel-kayano-14-noir-argent/03.webp', 2),
  ('/chaussures/asics-gel-kayano-14-noir-argent/04.webp', 3),
  ('/chaussures/asics-gel-kayano-14-noir-argent/05.webp', 4)
) as v(url, position)
where c.slug = 'asics-gel-kayano-14-noir-argent'
  and not exists (select 1 from public.chaussure_images i where i.chaussure_id = c.id);
insert into public.chaussure_pointures (chaussure_id, pointure)
select c.id, p from public.chaussures c, unnest(array[39, 40, 41, 42, 43, 44, 45, 46, 47]) as p
where c.slug = 'asics-gel-kayano-14-noir-argent'
on conflict do nothing;

-- Nike Zoom Vomero 5 Triple Noir
insert into public.chaussures (slug, nom, marque, couleur, description, prix, prix_promo, fin_promo, cree_le)
values ('nike-zoom-vomero-5-noir', 'Zoom Vomero 5 Triple Noir', 'Nike', 'Noir', 'La Zoom Vomero 5 entièrement noire : mesh, empiècements superposés et talon ajouré. Un look running rétro discret qui va partout.', 22000, null, null, now() - interval '1 minutes')
on conflict (slug) do nothing;
insert into public.chaussure_images (chaussure_id, url, position)
select c.id, v.url, v.position from public.chaussures c, (values
  ('/chaussures/nike-zoom-vomero-5-noir/01.webp', 0),
  ('/chaussures/nike-zoom-vomero-5-noir/02.webp', 1),
  ('/chaussures/nike-zoom-vomero-5-noir/03.webp', 2)
) as v(url, position)
where c.slug = 'nike-zoom-vomero-5-noir'
  and not exists (select 1 from public.chaussure_images i where i.chaussure_id = c.id);
insert into public.chaussure_pointures (chaussure_id, pointure)
select c.id, p from public.chaussures c, unnest(array[39, 40, 41, 42, 43, 44, 45, 46, 47]) as p
where c.slug = 'nike-zoom-vomero-5-noir'
on conflict do nothing;

-- Vans Style 36 Cloutée Bleu
insert into public.chaussures (slug, nom, marque, couleur, description, prix, prix_promo, fin_promo, cree_le)
values ('vans-style-36-cloutee-bleu', 'Style 36 Cloutée Bleu', 'Vans', 'Bleu / noir', 'La Style 36 revisitée : toile bleue, daim noir et bande latérale ornée de clous et de perles. Sa semelle effet vieilli lui donne un style déjà porté, très streetwear.', 28000, null, null, now() - interval '2 minutes')
on conflict (slug) do nothing;
insert into public.chaussure_images (chaussure_id, url, position)
select c.id, v.url, v.position from public.chaussures c, (values
  ('/chaussures/vans-style-36-cloutee-bleu/01.webp', 0),
  ('/chaussures/vans-style-36-cloutee-bleu/02.webp', 1),
  ('/chaussures/vans-style-36-cloutee-bleu/03.webp', 2)
) as v(url, position)
where c.slug = 'vans-style-36-cloutee-bleu'
  and not exists (select 1 from public.chaussure_images i where i.chaussure_id = c.id);
insert into public.chaussure_pointures (chaussure_id, pointure)
select c.id, p from public.chaussures c, unnest(array[39, 40, 41, 42, 43, 44, 45, 46, 47]) as p
where c.slug = 'vans-style-36-cloutee-bleu'
on conflict do nothing;

-- Vans Style 36 Cloutée Camel
insert into public.chaussures (slug, nom, marque, couleur, description, prix, prix_promo, fin_promo, cree_le)
values ('vans-style-36-cloutee-marron', 'Style 36 Cloutée Camel', 'Vans', 'Camel / marron', 'La Style 36 cloutée en camel et marron, avec sa bande latérale blanche perlée. Semelle effet vieilli : une paire chaude et originale.', 28000, null, null, now() - interval '3 minutes')
on conflict (slug) do nothing;
insert into public.chaussure_images (chaussure_id, url, position)
select c.id, v.url, v.position from public.chaussures c, (values
  ('/chaussures/vans-style-36-cloutee-marron/01.webp', 0),
  ('/chaussures/vans-style-36-cloutee-marron/02.webp', 1)
) as v(url, position)
where c.slug = 'vans-style-36-cloutee-marron'
  and not exists (select 1 from public.chaussure_images i where i.chaussure_id = c.id);
insert into public.chaussure_pointures (chaussure_id, pointure)
select c.id, p from public.chaussures c, unnest(array[39, 40, 41, 42, 43, 44, 45, 46, 47]) as p
where c.slug = 'vans-style-36-cloutee-marron'
on conflict do nothing;

-- Numeris Numeris Noir
insert into public.chaussures (slug, nom, marque, couleur, description, prix, prix_promo, fin_promo, cree_le)
values ('numeris-noir', 'Numeris Noir', 'Numeris', 'Noir', 'Une sneaker basse tout en noir, coutures blanches contrastées et gros lacets épais. Sa semelle crantée épaisse lui donne une allure affirmée.', 35000, null, null, now() - interval '4 minutes')
on conflict (slug) do nothing;
insert into public.chaussure_images (chaussure_id, url, position)
select c.id, v.url, v.position from public.chaussures c, (values
  ('/chaussures/numeris-noir/01.webp', 0),
  ('/chaussures/numeris-noir/02.webp', 1)
) as v(url, position)
where c.slug = 'numeris-noir'
  and not exists (select 1 from public.chaussure_images i where i.chaussure_id = c.id);
insert into public.chaussure_pointures (chaussure_id, pointure)
select c.id, p from public.chaussures c, unnest(array[39, 40, 41, 42, 43, 44, 45, 46, 47]) as p
where c.slug = 'numeris-noir'
on conflict do nothing;

-- Nike Air Force 1 Triple Noir
insert into public.chaussures (slug, nom, marque, couleur, description, prix, prix_promo, fin_promo, cree_le)
values ('nike-air-force-1-noir', 'Air Force 1 Triple Noir', 'Nike', 'Noir', 'L''Air Force 1 en version triple noir, de la semelle aux lacets. Un classique indémodable, simple et efficace.', 13000, null, null, now() - interval '5 minutes')
on conflict (slug) do nothing;
insert into public.chaussure_images (chaussure_id, url, position)
select c.id, v.url, v.position from public.chaussures c, (values
  ('/chaussures/nike-air-force-1-noir/01.webp', 0),
  ('/chaussures/nike-air-force-1-noir/02.webp', 1)
) as v(url, position)
where c.slug = 'nike-air-force-1-noir'
  and not exists (select 1 from public.chaussure_images i where i.chaussure_id = c.id);
insert into public.chaussure_pointures (chaussure_id, pointure)
select c.id, p from public.chaussures c, unnest(array[39, 40, 41, 42, 43, 44, 45, 46, 47]) as p
where c.slug = 'nike-air-force-1-noir'
on conflict do nothing;

-- ASICS Gel-NYC Marine
insert into public.chaussures (slug, nom, marque, couleur, description, prix, prix_promo, fin_promo, cree_le)
values ('asics-gel-nyc-marine', 'Gel-NYC Marine', 'ASICS', 'Bleu marine / gris', 'La Gel-NYC mélange daim bleu marine, mesh clair et empiècements argentés. Une running rétro élégante, facile à associer.', 22000, null, null, now() - interval '6 minutes')
on conflict (slug) do nothing;
insert into public.chaussure_images (chaussure_id, url, position)
select c.id, v.url, v.position from public.chaussures c, (values
  ('/chaussures/asics-gel-nyc-marine/01.webp', 0),
  ('/chaussures/asics-gel-nyc-marine/02.webp', 1),
  ('/chaussures/asics-gel-nyc-marine/03.webp', 2),
  ('/chaussures/asics-gel-nyc-marine/04.webp', 3),
  ('/chaussures/asics-gel-nyc-marine/05.webp', 4)
) as v(url, position)
where c.slug = 'asics-gel-nyc-marine'
  and not exists (select 1 from public.chaussure_images i where i.chaussure_id = c.id);
insert into public.chaussure_pointures (chaussure_id, pointure)
select c.id, p from public.chaussures c, unnest(array[39, 40, 41, 42, 43, 44, 45, 46, 47]) as p
where c.slug = 'asics-gel-nyc-marine'
on conflict do nothing;

-- ASICS Gel-Kayano 14 Rouge
insert into public.chaussures (slug, nom, marque, couleur, description, prix, prix_promo, fin_promo, cree_le)
values ('asics-gel-kayano-14-rouge', 'Gel-Kayano 14 Rouge', 'ASICS', 'Blanc / argent / rouge', 'Blanc, argent et reflets rouges : la Gel-Kayano 14 dans un coloris qui attire l''œil. L''esprit running des années 2000, version brillante.', 21000, null, null, now() - interval '7 minutes')
on conflict (slug) do nothing;
insert into public.chaussure_images (chaussure_id, url, position)
select c.id, v.url, v.position from public.chaussures c, (values
  ('/chaussures/asics-gel-kayano-14-rouge/01.webp', 0),
  ('/chaussures/asics-gel-kayano-14-rouge/02.webp', 1)
) as v(url, position)
where c.slug = 'asics-gel-kayano-14-rouge'
  and not exists (select 1 from public.chaussure_images i where i.chaussure_id = c.id);
insert into public.chaussure_pointures (chaussure_id, pointure)
select c.id, p from public.chaussures c, unnest(array[39, 40, 41, 42, 43, 44, 45, 46, 47]) as p
where c.slug = 'asics-gel-kayano-14-rouge'
on conflict do nothing;

-- ASICS Gel-Kayano 14 Vert
insert into public.chaussures (slug, nom, marque, couleur, description, prix, prix_promo, fin_promo, cree_le)
values ('asics-gel-kayano-14-vert', 'Gel-Kayano 14 Vert', 'ASICS', 'Blanc / argent / vert', 'La Gel-Kayano 14 en blanc et argent, rehaussée de vert vif au talon et sur la semelle. Fraîche, lumineuse, impossible à rater.', 21000, null, null, now() - interval '8 minutes')
on conflict (slug) do nothing;
insert into public.chaussure_images (chaussure_id, url, position)
select c.id, v.url, v.position from public.chaussures c, (values
  ('/chaussures/asics-gel-kayano-14-vert/01.webp', 0),
  ('/chaussures/asics-gel-kayano-14-vert/02.webp', 1),
  ('/chaussures/asics-gel-kayano-14-vert/03.webp', 2),
  ('/chaussures/asics-gel-kayano-14-vert/04.webp', 3),
  ('/chaussures/asics-gel-kayano-14-vert/05.webp', 4),
  ('/chaussures/asics-gel-kayano-14-vert/06.webp', 5)
) as v(url, position)
where c.slug = 'asics-gel-kayano-14-vert'
  and not exists (select 1 from public.chaussure_images i where i.chaussure_id = c.id);
insert into public.chaussure_pointures (chaussure_id, pointure)
select c.id, p from public.chaussures c, unnest(array[39, 40, 41, 42, 43, 44, 45, 46, 47]) as p
where c.slug = 'asics-gel-kayano-14-vert'
on conflict do nothing;

-- Numeris Numeris Camo
insert into public.chaussures (slug, nom, marque, couleur, description, prix, prix_promo, fin_promo, cree_le)
values ('numeris-camo', 'Numeris Camo', 'Numeris', 'Noir / gris', 'Tige en toile à motif camouflage noir et gris, bout et talon blancs, gros lacets blancs. Une paire qui se remarque sans en faire trop.', 35000, null, null, now() - interval '9 minutes')
on conflict (slug) do nothing;
insert into public.chaussure_images (chaussure_id, url, position)
select c.id, v.url, v.position from public.chaussures c, (values
  ('/chaussures/numeris-camo/01.webp', 0),
  ('/chaussures/numeris-camo/02.webp', 1),
  ('/chaussures/numeris-camo/03.webp', 2)
) as v(url, position)
where c.slug = 'numeris-camo'
  and not exists (select 1 from public.chaussure_images i where i.chaussure_id = c.id);
insert into public.chaussure_pointures (chaussure_id, pointure)
select c.id, p from public.chaussures c, unnest(array[39, 40, 41, 42, 43, 44, 45, 46, 47]) as p
where c.slug = 'numeris-camo'
on conflict do nothing;

-- Nike Shox TL Noir
insert into public.chaussures (slug, nom, marque, couleur, description, prix, prix_promo, fin_promo, cree_le)
values ('nike-shox-tl-noir', 'Shox TL Noir', 'Nike', 'Noir', 'La Shox TL entièrement noire, avec ses colonnes Shox apparentes sur toute la longueur. Un look futuriste et imposant.', 22000, null, null, now() - interval '10 minutes')
on conflict (slug) do nothing;
insert into public.chaussure_images (chaussure_id, url, position)
select c.id, v.url, v.position from public.chaussures c, (values
  ('/chaussures/nike-shox-tl-noir/01.webp', 0),
  ('/chaussures/nike-shox-tl-noir/02.webp', 1),
  ('/chaussures/nike-shox-tl-noir/03.webp', 2),
  ('/chaussures/nike-shox-tl-noir/04.webp', 3)
) as v(url, position)
where c.slug = 'nike-shox-tl-noir'
  and not exists (select 1 from public.chaussure_images i where i.chaussure_id = c.id);
insert into public.chaussure_pointures (chaussure_id, pointure)
select c.id, p from public.chaussures c, unnest(array[39, 40, 41, 42, 43, 44, 45, 46, 47]) as p
where c.slug = 'nike-shox-tl-noir'
on conflict do nothing;

-- Numeris Numeris Denim Rose
insert into public.chaussures (slug, nom, marque, couleur, description, prix, prix_promo, fin_promo, cree_le)
values ('numeris-denim-rose', 'Numeris Denim Rose', 'Numeris', 'Denim noir / rose', 'Denim noir effet usé, gros lacets roses et semelle blanche crantée. Une paire originale, à la fois brute et douce.', 35000, null, null, now() - interval '11 minutes')
on conflict (slug) do nothing;
insert into public.chaussure_images (chaussure_id, url, position)
select c.id, v.url, v.position from public.chaussures c, (values
  ('/chaussures/numeris-denim-rose/01.webp', 0),
  ('/chaussures/numeris-denim-rose/02.webp', 1),
  ('/chaussures/numeris-denim-rose/03.webp', 2)
) as v(url, position)
where c.slug = 'numeris-denim-rose'
  and not exists (select 1 from public.chaussure_images i where i.chaussure_id = c.id);
insert into public.chaussure_pointures (chaussure_id, pointure)
select c.id, p from public.chaussures c, unnest(array[39, 40, 41, 42, 43, 44, 45, 46, 47]) as p
where c.slug = 'numeris-denim-rose'
on conflict do nothing;

-- ASICS Gel-Kayano 14 Bleu
insert into public.chaussures (slug, nom, marque, couleur, description, prix, prix_promo, fin_promo, cree_le)
values ('asics-gel-kayano-14-bleu', 'Gel-Kayano 14 Bleu', 'ASICS', 'Blanc / bleu', 'La Gel-Kayano 14 en blanc, avec des empiècements bleu roi brillants au talon et sur la semelle. Sportive et nette.', 21000, null, null, now() - interval '12 minutes')
on conflict (slug) do nothing;
insert into public.chaussure_images (chaussure_id, url, position)
select c.id, v.url, v.position from public.chaussures c, (values
  ('/chaussures/asics-gel-kayano-14-bleu/01.webp', 0),
  ('/chaussures/asics-gel-kayano-14-bleu/02.webp', 1),
  ('/chaussures/asics-gel-kayano-14-bleu/03.webp', 2),
  ('/chaussures/asics-gel-kayano-14-bleu/04.webp', 3),
  ('/chaussures/asics-gel-kayano-14-bleu/05.webp', 4),
  ('/chaussures/asics-gel-kayano-14-bleu/06.webp', 5)
) as v(url, position)
where c.slug = 'asics-gel-kayano-14-bleu'
  and not exists (select 1 from public.chaussure_images i where i.chaussure_id = c.id);
insert into public.chaussure_pointures (chaussure_id, pointure)
select c.id, p from public.chaussures c, unnest(array[39, 40, 41, 42, 43, 44, 45, 46, 47]) as p
where c.slug = 'asics-gel-kayano-14-bleu'
on conflict do nothing;

-- ASICS Gel-Kayano 14 Rose
insert into public.chaussures (slug, nom, marque, couleur, description, prix, prix_promo, fin_promo, cree_le)
values ('asics-gel-kayano-14-rose', 'Gel-Kayano 14 Rose', 'ASICS', 'Crème / argent / rose', 'Crème, argent et touches de rose sur la semelle : une Gel-Kayano 14 douce et lumineuse. Le look running rétro, version tendre.', 22000, null, null, now() - interval '13 minutes')
on conflict (slug) do nothing;
insert into public.chaussure_images (chaussure_id, url, position)
select c.id, v.url, v.position from public.chaussures c, (values
  ('/chaussures/asics-gel-kayano-14-rose/01.webp', 0),
  ('/chaussures/asics-gel-kayano-14-rose/02.webp', 1),
  ('/chaussures/asics-gel-kayano-14-rose/03.webp', 2)
) as v(url, position)
where c.slug = 'asics-gel-kayano-14-rose'
  and not exists (select 1 from public.chaussure_images i where i.chaussure_id = c.id);
insert into public.chaussure_pointures (chaussure_id, pointure)
select c.id, p from public.chaussures c, unnest(array[39, 40, 41, 42, 43, 44, 45, 46, 47]) as p
where c.slug = 'asics-gel-kayano-14-rose'
on conflict do nothing;

-- Dior B30 Noir
insert into public.chaussures (slug, nom, marque, couleur, description, prix, prix_promo, fin_promo, cree_le)
values ('dior-b30-noir', 'B30 Noir', 'Dior', 'Noir / gris', 'La B30 en noir avec le grand logo CD gris métallisé sur le côté. Sa semelle épaisse couleur crème signe une silhouette moderne.', 23000, null, null, now() - interval '14 minutes')
on conflict (slug) do nothing;
insert into public.chaussure_images (chaussure_id, url, position)
select c.id, v.url, v.position from public.chaussures c, (values
  ('/chaussures/dior-b30-noir/01.webp', 0)
) as v(url, position)
where c.slug = 'dior-b30-noir'
  and not exists (select 1 from public.chaussure_images i where i.chaussure_id = c.id);
insert into public.chaussure_pointures (chaussure_id, pointure)
select c.id, p from public.chaussures c, unnest(array[39, 40, 41, 42, 43, 44, 45, 46, 47]) as p
where c.slug = 'dior-b30-noir'
on conflict do nothing;

-- Jordan Air Jordan 1 Low x Travis Scott Noir
insert into public.chaussures (slug, nom, marque, couleur, description, prix, prix_promo, fin_promo, cree_le)
values ('jordan-1-low-travis-scott-noir', 'Air Jordan 1 Low x Travis Scott Noir', 'Jordan', 'Noir', 'L''Air Jordan 1 Low Travis Scott en noir total, swoosh inversé et coutures blanches contrastées. Aspect daim mat pour un rendu chic.', 18000, null, null, now() - interval '15 minutes')
on conflict (slug) do nothing;
insert into public.chaussure_images (chaussure_id, url, position)
select c.id, v.url, v.position from public.chaussures c, (values
  ('/chaussures/jordan-1-low-travis-scott-noir/01.webp', 0),
  ('/chaussures/jordan-1-low-travis-scott-noir/02.webp', 1),
  ('/chaussures/jordan-1-low-travis-scott-noir/03.webp', 2)
) as v(url, position)
where c.slug = 'jordan-1-low-travis-scott-noir'
  and not exists (select 1 from public.chaussure_images i where i.chaussure_id = c.id);
insert into public.chaussure_pointures (chaussure_id, pointure)
select c.id, p from public.chaussures c, unnest(array[39, 40, 41, 42, 43, 44, 45, 46, 47]) as p
where c.slug = 'jordan-1-low-travis-scott-noir'
on conflict do nothing;

-- ASICS Gel-NYC Rose
insert into public.chaussures (slug, nom, marque, couleur, description, prix, prix_promo, fin_promo, cree_le)
values ('asics-gel-nyc-rose', 'Gel-NYC Rose', 'ASICS', 'Rose / crème', 'Rose, crème et argent : la Gel-NYC dans un coloris doux et lumineux. Daim et mesh pour un look rétro très frais.', 22000, null, null, now() - interval '16 minutes')
on conflict (slug) do nothing;
insert into public.chaussure_images (chaussure_id, url, position)
select c.id, v.url, v.position from public.chaussures c, (values
  ('/chaussures/asics-gel-nyc-rose/01.webp', 0),
  ('/chaussures/asics-gel-nyc-rose/02.webp', 1),
  ('/chaussures/asics-gel-nyc-rose/03.webp', 2),
  ('/chaussures/asics-gel-nyc-rose/04.webp', 3)
) as v(url, position)
where c.slug = 'asics-gel-nyc-rose'
  and not exists (select 1 from public.chaussure_images i where i.chaussure_id = c.id);
insert into public.chaussure_pointures (chaussure_id, pointure)
select c.id, p from public.chaussures c, unnest(array[39, 40, 41, 42, 43, 44, 45, 46, 47]) as p
where c.slug = 'asics-gel-nyc-rose'
on conflict do nothing;

-- Jordan Air Jordan 1 Low x Travis Scott Marron
insert into public.chaussures (slug, nom, marque, couleur, description, prix, prix_promo, fin_promo, cree_le)
values ('jordan-1-low-travis-scott-marron', 'Air Jordan 1 Low x Travis Scott Marron', 'Jordan', 'Marron', 'L''Air Jordan 1 Low Travis Scott en marron chocolat, swoosh inversé noir en cuir grainé. Une paire sobre et élégante.', 18000, null, null, now() - interval '17 minutes')
on conflict (slug) do nothing;
insert into public.chaussure_images (chaussure_id, url, position)
select c.id, v.url, v.position from public.chaussures c, (values
  ('/chaussures/jordan-1-low-travis-scott-marron/01.webp', 0),
  ('/chaussures/jordan-1-low-travis-scott-marron/02.webp', 1),
  ('/chaussures/jordan-1-low-travis-scott-marron/03.webp', 2),
  ('/chaussures/jordan-1-low-travis-scott-marron/04.webp', 3),
  ('/chaussures/jordan-1-low-travis-scott-marron/05.webp', 4)
) as v(url, position)
where c.slug = 'jordan-1-low-travis-scott-marron'
  and not exists (select 1 from public.chaussure_images i where i.chaussure_id = c.id);
insert into public.chaussure_pointures (chaussure_id, pointure)
select c.id, p from public.chaussures c, unnest(array[39, 40, 41, 42, 43, 44, 45, 46, 47]) as p
where c.slug = 'jordan-1-low-travis-scott-marron'
on conflict do nothing;

-- Nike Air Max 95 x Corteiz Kaki
insert into public.chaussures (slug, nom, marque, couleur, description, prix, prix_promo, fin_promo, cree_le)
values ('nike-air-max-95-corteiz-kaki', 'Air Max 95 x Corteiz Kaki', 'Nike', 'Kaki / olive / jaune', 'La Air Max 95 signée Corteiz en kaki et olive, avec logos brodés jaunes. Bulles d''air visibles et lignes ondulées emblématiques.', 22000, null, null, now() - interval '18 minutes')
on conflict (slug) do nothing;
insert into public.chaussure_images (chaussure_id, url, position)
select c.id, v.url, v.position from public.chaussures c, (values
  ('/chaussures/nike-air-max-95-corteiz-kaki/01.webp', 0),
  ('/chaussures/nike-air-max-95-corteiz-kaki/02.webp', 1),
  ('/chaussures/nike-air-max-95-corteiz-kaki/03.webp', 2),
  ('/chaussures/nike-air-max-95-corteiz-kaki/04.webp', 3)
) as v(url, position)
where c.slug = 'nike-air-max-95-corteiz-kaki'
  and not exists (select 1 from public.chaussure_images i where i.chaussure_id = c.id);
insert into public.chaussure_pointures (chaussure_id, pointure)
select c.id, p from public.chaussures c, unnest(array[39, 40, 41, 42, 43, 44, 45, 46, 47]) as p
where c.slug = 'nike-air-max-95-corteiz-kaki'
on conflict do nothing;

-- Nike Shox TL Blanc
insert into public.chaussures (slug, nom, marque, couleur, description, prix, prix_promo, fin_promo, cree_le)
values ('nike-shox-tl-blanc', 'Shox TL Blanc', 'Nike', 'Blanc / argent', 'La Shox TL en blanc et argent, colonnes Shox apparentes et logo rouge au talon. Un look futuriste et très propre.', 22000, null, null, now() - interval '19 minutes')
on conflict (slug) do nothing;
insert into public.chaussure_images (chaussure_id, url, position)
select c.id, v.url, v.position from public.chaussures c, (values
  ('/chaussures/nike-shox-tl-blanc/01.webp', 0),
  ('/chaussures/nike-shox-tl-blanc/02.webp', 1),
  ('/chaussures/nike-shox-tl-blanc/03.webp', 2),
  ('/chaussures/nike-shox-tl-blanc/04.webp', 3)
) as v(url, position)
where c.slug = 'nike-shox-tl-blanc'
  and not exists (select 1 from public.chaussure_images i where i.chaussure_id = c.id);
insert into public.chaussure_pointures (chaussure_id, pointure)
select c.id, p from public.chaussures c, unnest(array[39, 40, 41, 42, 43, 44, 45, 46, 47]) as p
where c.slug = 'nike-shox-tl-blanc'
on conflict do nothing;

-- Nike P-6000 Argent
insert into public.chaussures (slug, nom, marque, couleur, description, prix, prix_promo, fin_promo, cree_le)
values ('nike-p-6000-argent', 'P-6000 Argent', 'Nike', 'Argent métallisé', 'La P-6000 tout en argent métallisé, superpositions brillantes et semelle blanche et noire. Le style running des années 2000 qui brille.', 22000, null, null, now() - interval '20 minutes')
on conflict (slug) do nothing;
insert into public.chaussure_images (chaussure_id, url, position)
select c.id, v.url, v.position from public.chaussures c, (values
  ('/chaussures/nike-p-6000-argent/01.webp', 0),
  ('/chaussures/nike-p-6000-argent/02.webp', 1),
  ('/chaussures/nike-p-6000-argent/03.webp', 2),
  ('/chaussures/nike-p-6000-argent/04.webp', 3)
) as v(url, position)
where c.slug = 'nike-p-6000-argent'
  and not exists (select 1 from public.chaussure_images i where i.chaussure_id = c.id);
insert into public.chaussure_pointures (chaussure_id, pointure)
select c.id, p from public.chaussures c, unnest(array[39, 40, 41, 42, 43, 44, 45, 46, 47]) as p
where c.slug = 'nike-p-6000-argent'
on conflict do nothing;

-- Réglages de la boutique
update public.reglages set
  slogan = 'Le style commence par les pieds.',
  mode_paiement = 'À la livraison',
  chaussure_vedette_id = (select id from public.chaussures where slug = 'nike-air-max-95-corteiz-kaki')
where id = 1;
