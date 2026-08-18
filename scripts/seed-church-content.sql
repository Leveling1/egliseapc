-- ============================================================
-- Contenu réel de l'église : oracles, programmes, extensions, thèmes RDA.
--
-- Sources :
--   — oracles et thèmes des rassemblements : document fourni par l'église
--   — programmes et villes : valeurs jusqu'ici codées en dur dans le front
--     (sections « Rejoignez-nous » et « Notre présence »)
--
-- Rejouable : les insertions sont idempotentes. Les triggers de contrôle de
-- publication sont neutralisés le temps de la transaction, une migration
-- n'ayant pas d'administrateur connecté.
-- ============================================================

begin;

alter table public.oracles     disable trigger trg_oracles_publish_right;
alter table public.programmes  disable trigger trg_programmes_publish_right;
alter table public.extensions  disable trigger trg_extensions_publish_right;
alter table public.rda_editions disable trigger trg_rda_editions_publish_right;

-- ------------------------------------------------------------
-- Oracles / thèmes de l'année
--
-- 2001, 2002 et 2025 sont absents du document fourni : on ne crée pas de
-- ligne vide pour les combler, une année sans oracle valant mieux qu'un
-- oracle inventé.
-- ------------------------------------------------------------
insert into public.oracles (year, title, is_visible) values
  (2000, 'Sonnez de la trompette', true),
  (2003, 'La course', true),
  (2004, 'La conquête', true),
  (2005, 'Le combat spirituel', true),
  (2006, 'Dominer', true),
  (2007, 'Le règne', true),
  (2008, 'L''accomplissement', true),
  (2009, 'Le germe', true),
  (2010, 'La visitation', true),
  (2011, 'Fais-moi voir ta gloire', true),
  (2012, 'La manifestation de la puissance de Dieu', true),
  (2013, 'La faveur divine', true),
  (2014, 'Le temps des saisons', true),
  (2015, 'Le temps des vignes', true),
  (2016, 'Dépasse tes limites', true),
  (2017, 'Fais vivre ta vision pour une nouvelle dimension', true),
  (2018, 'Recommence, car c''est le temps des alliances', true),
  (2019, 'Les réparateurs des brèches', true),
  (2020, 'Lève-toi, sois éclairée', true),
  (2021, 'Marche dans une nouvelle onction', true),
  (2022, 'Vous avez assez demeuré dans cette montagne. Maintenant, avancez !', true),
  (2023, 'La possession de notre héritage', true),
  (2024, 'Étends la dimension de mon héritage', true)
on conflict (year) do nothing;

-- Oracle en cours, repris de la section « Rejoignez-nous » du site.
insert into public.oracles (year, title, verse_reference, verse_text, is_visible)
values (
  2026,
  'Monte Ici',
  'Apocalypse 4:1',
  'Après cela, je regardai, et voici, une porte était ouverte dans le ciel… Monte ici, et je te ferai voir ce qui doit arriver dans la suite.',
  true
)
on conflict (year) do update
   set title           = excluded.title,
       verse_reference = excluded.verse_reference,
       verse_text      = excluded.verse_text,
       is_visible      = true;

-- ------------------------------------------------------------
-- Programmes hebdomadaires
-- 0 = dimanche … 6 = samedi
-- ------------------------------------------------------------
insert into public.programmes
  (name, kind, days_of_week, start_time, end_time, is_featured, is_visible)
values
  ('Culte d''enseignement',                'recurrent', array[1]::smallint[],             '17:00', '19:00', false, true),
  ('Réunion des femmes',                   'recurrent', array[3]::smallint[],             '16:30', '18:30', false, true),
  ('Culte d''intercession',                'recurrent', array[4]::smallint[],             '16:30', '19:00', false, true),
  ('Culte de louange et d''action de grâce','recurrent', array[0]::smallint[],             '08:00', '10:30', true,  true),
  ('Prière matinale',                      'recurrent', array[1,2,3,4,5]::smallint[],     '05:50', '06:50', false, true)
on conflict do nothing;

-- ------------------------------------------------------------
-- Extensions : villes de la carte « Notre présence »
-- ------------------------------------------------------------
insert into public.extensions (name, city, country, latitude, longitude, is_visible) values
  ('A.P.C Kinshasa',  'Kinshasa',  'République Démocratique du Congo', -4.4419, 15.2663, true),
  ('A.P.C Paris',     'Paris',     'France',                            48.8566,  2.3522, true),
  ('A.P.C Bruxelles', 'Bruxelles', 'Belgique',                          50.8503,  4.3517, true),
  ('A.P.C Lisbonne',  'Lisbonne',  'Portugal',                          38.7223, -9.1393, true),
  ('A.P.C Luanda',    'Luanda',    'Angola',                            -8.8390, 13.2894, true),
  ('A.P.C Nairobi',   'Nairobi',   'Kenya',                             -1.2921, 36.8219, true)
on conflict do nothing;

-- ------------------------------------------------------------
-- Thèmes des Rassemblements des Aigles
--
-- Le document fournit une année et un thème, sans numéro d'édition. Les
-- lignes existantes sont donc renseignées dans l'ordre chronologique.
-- ATTENTION : la correspondance « édition n° N = Nième année connue » est
-- une hypothèse. Ce qui s'affiche (année et thème) est exact ; seul le
-- numéro reste à confirmer. Les éditions sans thème connu restent masquées.
-- Tous ces rassemblements se sont tenus à Kinshasa.
-- ------------------------------------------------------------
with connus (rang, annee, theme) as (
  values
    (1,  2002, 'Ouvrier de la dernière heure'),
    (2,  2007, 'Le vin nouveau'),
    (3,  2008, 'L''esprit d''Élie en ce temps'),
    (4,  2009, 'De l''Épervier, du Faucon et de l''aigle, qui est le vrai'),
    (5,  2010, 'Ici gît un géant endormi, s''il se réveillait rien ne pourrait l''arrêter'),
    (6,  2011, 'Que ton royaume descende'),
    (7,  2012, 'Commence la conquête, fais-lui la guerre'),
    (8,  2013, 'La guerre des adorateurs'),
    (9,  2014, 'La pluie de l''arrière saison'),
    (10, 2015, 'Le réveil de l''Épouse'),
    (11, 2018, 'La dernière génération'),
    (12, 2019, 'Dieu a une armée qui se lève'),
    (13, 2020, 'Deux races s''affrontent'),
    (14, 2022, 'La lampe brûle encore')
)
update public.rda_editions e
   set year       = c.annee,
       title      = c.theme,
       theme      = c.theme,
       location   = 'Kinshasa',
       is_visible = true
  from connus c
 where e.edition_number = c.rang;

alter table public.oracles     enable trigger trg_oracles_publish_right;
alter table public.programmes  enable trigger trg_programmes_publish_right;
alter table public.extensions  enable trigger trg_extensions_publish_right;
alter table public.rda_editions enable trigger trg_rda_editions_publish_right;

commit;
