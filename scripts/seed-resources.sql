-- ============================================================
-- Contenu de la page Ressources : livres et application mobile.
--
-- Reprise des valeurs jusqu'ici codées en dur dans le front, avec une
-- correction de fond : la page annonçait une « Application A.P.C » comme
-- « Disponible maintenant », avec des boutons de téléchargement inertes,
-- alors qu'elle n'existe pas. C'est Campus APC qui est en cours de
-- publication. Aucune URL de store n'est donc renseignée, et l'interface
-- n'affichera aucun bouton de téléchargement tant qu'il n'y en aura pas.
--
-- Rejouable : insertions idempotentes, triggers de publication neutralisés
-- le temps de la transaction.
-- ============================================================

begin;

alter table public.book_statuses disable trigger trg_book_statuses_publish_right;
alter table public.books         disable trigger trg_books_publish_right;
alter table public.mobile_apps   disable trigger trg_mobile_apps_publish_right;

insert into public.book_statuses (name, position, is_visible) values
  ('En rédaction', 1, true),
  ('Bientôt',      2, true),
  ('Disponible',   3, true)
on conflict (name) do nothing;

insert into public.books (title, description, status_id, cover_gradient, position, is_visible)
select v.title, v.description, s.id, v.gradient, v.position, true
  from (values
    (
      'La Marche du Disciple',
      'Un guide pratique pour vivre sa foi au quotidien et grandir en tant qu''ambassadeur du Christ.',
      'En rédaction',
      'linear-gradient(145deg,#1C1C8C,#FFE600)',
      1::smallint
    ),
    (
      'L''Appel de l''Ambassadeur',
      'Comprendre et embrasser l''appel à être ambassadeur du Christ dans le monde d''aujourd''hui.',
      'En rédaction',
      'linear-gradient(145deg,#FFE600,#1C1C8C)',
      2::smallint
    ),
    (
      'Prières et Méditations',
      'Un recueil de prières et méditations pour accompagner votre vie spirituelle au quotidien.',
      'Bientôt',
      'linear-gradient(145deg,#1C1C8C,#1C1C8C)',
      3::smallint
    )
  ) as v(title, description, status_name, gradient, position)
  left join public.book_statuses s on s.name = v.status_name
 where not exists (select 1 from public.books b where b.title = v.title);

insert into public.mobile_apps
  (name, tagline, description, status_label, features, position, is_visible)
select
  'Campus APC',
  'L''application de la communauté',
  'Restez connecté avec votre communauté où que vous soyez : cultes, programme de la semaine et actualités de l''église depuis votre téléphone.',
  'En cours de publication',
  array[
    'Cultes en direct et replays',
    'Programme de la semaine',
    'Notifications et actualités'
  ]::text[],
  1,
  true
 where not exists (select 1 from public.mobile_apps where name = 'Campus APC');

alter table public.book_statuses enable trigger trg_book_statuses_publish_right;
alter table public.books         enable trigger trg_books_publish_right;
alter table public.mobile_apps   enable trigger trg_mobile_apps_publish_right;

commit;
