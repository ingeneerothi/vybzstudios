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
