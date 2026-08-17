-- Fichier GÉNÉRÉ par scripts/generate-seed-sql.mjs — ne pas modifier à la main.
-- Amorçage du contenu du cpannel depuis les données du dépôt.

-- Articles de blog : contenu réel, publié directement (is_visible = true)
-- puisque ces articles sont déjà en ligne sur le site aujourd'hui.
insert into public.articles
  (slug, category, title, excerpt, content, author_name, author_initials,
   reading_time, gradient, published_at, is_visible)
values
  ('puissance-de-la-foi-resume-culte-dominical', 'Résumé de culte', 'La puissance de la foi — Résumé du culte dominical',
   'Retour sur l''enseignement du dimanche 28 juillet 2026, par le Prophète Garry KENGE. Un message puissant sur la foi qui déplace les montagnes.',
   ARRAY['Dimanche 28 juillet, l''assemblée s''est réunie dans une ferveur particulière pour recevoir un enseignement sur l''un des piliers de la vie chrétienne : la foi. Le Prophète Garry KENGE a ouvert le message par une lecture de Marc 11:22-24, rappelant que Jésus lui-même a présenté la foi non comme un sentiment, mais comme une force active capable de déplacer des montagnes.',
    '« La foi n''est pas l''absence de doute, a-t-il rappelé, c''est le choix de croire la Parole de Dieu plus que ce que nos yeux voient. » Cette distinction a marqué toute la suite du culte : la foi biblique ne nie pas les circonstances, elle les soumet à une autorité supérieure, celle de la promesse divine.',
    'L''enseignement s''est ensuite articulé autour de trois points. Premièrement, la foi commence par l''écoute : « La foi vient de ce qu''on entend, et ce qu''on entend vient de la parole de Christ » (Romains 10:17). Sans une exposition régulière à la Parole, la foi s''étiole. Deuxièmement, la foi s''exprime par la parole : parler avec autorité ce que l''on croit, plutôt que de se laisser dicter ses mots par les circonstances. Troisièmement, la foi persévère : elle ne s''éteint pas au premier obstacle, mais tient ferme jusqu''à la manifestation de la promesse.',
    'Le Prophète a partagé plusieurs témoignages tirés de son propre ministère, illustrant comment des situations humainement bloquées se sont dénouées lorsque des membres de l''Église ont choisi de tenir ferme dans la foi plutôt que de céder au découragement. « Dieu n''a jamais manqué à sa parole, a-t-il insisté, c''est nous qui manquons parfois de la tenir jusqu''au bout. »',
    'Le culte s''est conclu par un temps de prière collective, durant lequel chaque fidèle a été invité à formuler une décision de foi précise pour les mois à venir. L''assemblée a également été encouragée à intégrer une lecture quotidienne de la Parole comme discipline pour nourrir sa foi.',
    '« Que cette semaine soit celle où vous choisissez de croire au-delà de ce que vous voyez », a conclu le Prophète Garry KENGE avant la bénédiction finale. Un message qui restera, pour beaucoup, un point de repère dans leur marche avec Dieu.']::text[],
   'Prophète Garry KENGE', 'GK', '5 min de lecture',
   'linear-gradient(135deg,#0b0b0b,#1c1c8c)', '2026-07-28'::date, true),
  ('vivre-sa-foi-en-milieu-professionnel', 'Article', 'Vivre sa foi en milieu professionnel',
   'Comment concilier engagement professionnel et vie de foi ? Des pistes concrètes pour être un ambassadeur au travail.',
   ARRAY['Le lieu de travail est, pour la majorité des croyants, l''endroit où ils passent le plus de temps hors de leur foyer et de l''église. C''est pourtant souvent là que la tentation de « mettre sa foi de côté » se fait le plus sentir, entre pression des résultats, culture d''entreprise éloignée des valeurs bibliques et peur du regard des collègues.',
    'L''apôtre Paul écrivait aux Colossiens : « Tout ce que vous faites, faites-le de bon cœur, comme pour le Seigneur et non pour des hommes » (Colossiens 3:23). Ce verset déplace le centre de gravité : notre travail n''est pas d''abord destiné à notre employeur, mais à Dieu lui-même. Cette perspective change radicalement notre rapport à l''excellence, à l''intégrité et à la persévérance dans les tâches, même les plus ingrates.',
    'Être ambassadeur au travail ne signifie pas prêcher à chaque pause café, mais incarner un caractère différent : ponctualité, honnêteté dans les rapports, refus de la médisance, respect de la hiérarchie sans flatterie. C''est souvent ce témoignage silencieux, tenu dans la durée, qui ouvre des portes pour partager sa foi plus explicitement, au moment opportun.',
    'Beaucoup de membres de notre communauté témoignent d''une même expérience : les périodes de difficulté professionnelle — restructuration, conflit avec un supérieur, échec d''un projet — sont souvent celles où leur foi a été la plus visible aux yeux de leurs collègues, précisément parce qu''ils ont choisi de garder la paix et l''espérance là où d''autres cédaient à l''anxiété.',
    'Concrètement, quelques disciplines aident à tenir cette posture dans la durée : commencer sa journée par un temps bref de prière ou de lecture, se fixer une limite claire entre ce qui relève de la conscience et ce qui n''en relève pas, et rechercher la compagnie d''autres croyants — dans l''église ou ailleurs — pour ne pas porter seul les tensions du quotidien professionnel.',
    'Enfin, rappelons-nous que notre vocation professionnelle, quelle qu''elle soit, s''inscrit dans le mandat plus large que Dieu nous a confié : être ses ambassadeurs, en tout lieu et en toute saison (2 Corinthiens 5:20). Le bureau, l''atelier ou le chantier sont, eux aussi, un champ de mission.']::text[],
   'Pasteur David KALALA', 'DK', '6 min de lecture',
   'linear-gradient(135deg,#1C1C8C,#1C1C8C)', NULL, true),
  ('dieu-a-transforme-ma-vie', 'Témoignage', '« Dieu a transformé ma vie »',
   'Le témoignage poignant de Marie, membre de l''extension de Bruxelles, qui raconte comment la foi a changé son parcours.',
   ARRAY['Je m''appelle Marie, je fais partie de l''extension de Bruxelles depuis maintenant trois ans. On m''a demandé de partager mon parcours, et j''ai longtemps hésité — parler de soi n''est jamais simple — mais je crois que mon histoire peut encourager quelqu''un qui traverse aujourd''hui ce que j''ai traversé.',
    'Il y a quelques années, j''étais arrivée à un point où je n''attendais plus rien de la vie. Un divorce difficile, une perte d''emploi, l''éloignement de ma famille restée au pays : tout s''est enchaîné en l''espace de quelques mois. Je fonctionnais, mais je ne vivais plus vraiment.',
    'C''est une collègue de travail, membre de notre église, qui m''a invitée à un culte un dimanche où je n''avais, honnêtement, rien de mieux à faire. Je ne m''attendais à rien de particulier. Mais dès les premiers chants, quelque chose s''est passé en moi que je ne saurais expliquer autrement que par la présence de Dieu.',
    'Ce qui m''a le plus marquée, ce n''est pas un miracle spectaculaire, mais la constance. Semaine après semaine, à travers les enseignements, la prière et l''accompagnement de l''équipe pastorale, j''ai appris à poser mes fardeaux plutôt qu''à les porter seule. J''ai réappris à espérer.',
    'Aujourd''hui, mon emploi s''est stabilisé, mes relations familiales se reconstruisent lentement, et surtout, j''ai retrouvé une paix intérieure que je pensais avoir perdue pour toujours. Je ne dis pas que tout est parfait — la vie continue d''avoir ses épreuves — mais je ne les traverse plus seule.',
    'Si vous lisez ce témoignage et que vous traversez une saison difficile, sachez que Dieu n''a pas fini d''écrire votre histoire. Il ne l''avait pas fini pour moi non plus.']::text[],
   'Marie NGOYI', 'MN', '4 min de lecture',
   'linear-gradient(135deg,#0B0B0B,#1C1C8C)', NULL, true),
  ('marcher-dans-la-grace-resume', 'Résumé', 'Marcher dans la grâce — Résumé',
   'Les points essentiels de l''enseignement du mercredi sur la grâce et la miséricorde divine.',
   ARRAY['L''enseignement du mercredi 24 juillet a porté sur un thème central de la vie chrétienne : la grâce. Trop souvent réduite à un simple « pardon des péchés », la grâce biblique est en réalité une puissance qui transforme, soutient et fait avancer le croyant bien au-delà de ses propres forces.',
    'Le point de départ de l''enseignement était Éphésiens 2:8-9 : « C''est par la grâce que vous êtes sauvés, par le moyen de la foi. Et cela ne vient pas de vous, c''est le don de Dieu. » La grâce précède toujours nos efforts ; elle n''est jamais une récompense méritée, mais un cadeau reçu.',
    'Marcher dans la grâce, ce n''est donc pas vivre dans le laxisme spirituel, comme certains le pensent parfois à tort, mais au contraire puiser dans une ressource divine pour vivre une vie de sainteté sans s''épuiser dans ses propres forces. « La grâce ne nous dispense pas de l''effort, elle le rend possible », a résumé le prédicateur.',
    'Un second point a marqué l''assemblée : la grâce s''accompagne toujours de miséricorde. Là où la grâce donne ce que nous ne méritons pas, la miséricorde retient ce que nous méritons. Ensemble, elles forment le socle de la relation que Dieu propose à chacun de nous : une relation qui ne dépend pas de notre perfection, mais de sa fidélité.',
    'L''enseignement s''est terminé par un appel à recevoir cette grâce sans culpabilité ni honte, particulièrement pour ceux qui portent le poids d''échecs récents. « Ne laissez personne, pas même vous-même, vous convaincre que vous êtes trop loin pour la grâce de Dieu », a conclu le Prophète Garry KENGE.']::text[],
   'Prophète Garry KENGE', 'GK', '5 min de lecture',
   'linear-gradient(135deg,#1C1C8C,rgba(255,255,255,.55))', NULL, true),
  ('rda-2026-premieres-annonces', 'Actualité', 'RDA 2026 : les premières annonces',
   'Le prochain Rassemblement des Aigles se prépare ! Découvrez les premières informations sur l''édition 2026.',
   ARRAY['L''équipe d''organisation du Rassemblement des Aigles (RDA) a le plaisir d''annoncer les premières informations concernant l''édition 2026 de cet événement annuel désormais incontournable pour toute la communauté A.P.C, en République Démocratique du Congo comme dans nos extensions à travers le monde.',
    'Cette nouvelle édition marquera une étape importante puisqu''elle prolonge une tradition d''enseignements prophétiques initiée il y a plusieurs années par le Prophète Garry KENGE. Chaque année, le RDA rassemble des fidèles venus de Kinshasa, mais aussi de Paris, Bruxelles, Nairobi, Luanda et Lisbonne, pour un temps fort de communion, d''enseignement et de prière.',
    'Si le programme détaillé — dates précises, thème de l''année, intervenants invités — sera communiqué dans les semaines à venir, l''équipe d''organisation confirme d''ores et déjà que l''édition 2026 s''inscrira dans la continuité de l''Oracle de l''année, avec un accent particulier mis sur la préparation spirituelle des participants en amont de l''événement.',
    'Les membres des différentes extensions sont invités à se rapprocher de leurs responsables locaux pour connaître les modalités d''inscription et, le cas échéant, d''organisation du déplacement vers Kinshasa. Comme chaque année, une attention particulière sera portée à l''accueil des délégations venues de l''étranger.',
    'Nous vous invitons à rester connectés à ce blog et aux canaux habituels de communication de l''église pour ne manquer aucune annonce concernant cette édition qui s''annonce, une fois de plus, comme un rendez-vous marquant pour toute la famille A.P.C.']::text[],
   'Rédaction A.P.C', 'AC', '3 min de lecture',
   'linear-gradient(135deg,#1C1C8C,#0B0B0B)', NULL, true),
  ('appel-du-disciple-resume', 'Résumé', 'L''appel du disciple — Résumé',
   'Retour sur l''enseignement puissant du dimanche 21 juillet sur l''appel et l''engagement du disciple.',
   ARRAY['Le culte du dimanche 21 juillet a été consacré à un enseignement fondamental sur la notion de disciple, à partir de Luc 9:23 : « Si quelqu''un veut venir après moi, qu''il renonce à lui-même, qu''il se charge chaque jour de sa croix, et qu''il me suive. » Un verset exigeant, que le Prophète Garry KENGE a pris soin de replacer dans son contexte avant d''en tirer les implications pratiques.',
    'Être disciple, a-t-il rappelé, ne se résume pas à assister régulièrement au culte ni même à connaître beaucoup de versets bibliques. C''est avant tout une posture du cœur : celle d''un apprenti qui suit son maître, prêt à être corrigé, façonné et envoyé. « On ne devient pas disciple par accident, on le devient par décision », a-t-il insisté.',
    'Trois marques du disciple ont structuré l''enseignement. D''abord, le renoncement à soi : accepter que ses propres plans passent après ceux de Dieu. Ensuite, la constance dans l''épreuve, symbolisée par « la croix portée chaque jour » — non pas un fardeau ponctuel, mais un engagement quotidien renouvelé. Enfin, la disponibilité à suivre, c''est-à-dire à obéir même lorsque la direction n''est pas entièrement comprise.',
    'Le Prophète a également souligné que l''appel au discipulat n''est jamais une affaire strictement individuelle : il s''exerce dans une communauté, au sein de l''Église, où l''on est à la fois formé et appelé à former d''autres. « Un disciple qui ne fait pas de disciples n''a pas fini de comprendre son appel », a-t-il déclaré, en écho au mandat de Matthieu 28:19.',
    'L''assemblée a été invitée à un temps de consécration personnelle, chacun étant encouragé à identifier concrètement une zone de sa vie où le renoncement à soi devait encore progresser. Un enseignement qui a résonné comme un appel renouvelé à l''engagement, au-delà des habitudes religieuses.']::text[],
   'Prophète Garry KENGE', 'GK', '5 min de lecture',
   'linear-gradient(135deg,#1C1C8C,#0B0B0B)', NULL, true),
  ('la-priere-arme-du-croyant', 'Article', 'La prière : arme du croyant',
   'Pourquoi la prière est au cœur de la vie de l''ambassadeur. Redécouvrez sa puissance et sa nécessité.',
   ARRAY['Dans la vie de l''église, peu de disciplines sont autant recommandées — et pourtant autant négligées — que la prière. Nous la savons essentielle, nous l''enseignons volontiers aux autres, mais elle reste souvent la première chose sacrifiée lorsque nos journées se remplissent. Cet article se veut un rappel simple : la prière n''est pas une option pour le croyant, c''est une arme.',
    'L''apôtre Paul, dans sa lettre aux Éphésiens, dresse la liste de l''armure du chrétien — la vérité, la justice, la foi, le salut, la Parole — avant de conclure par un appel à « prier en tout temps par l''Esprit » (Éphésiens 6:18). La prière n''est pas une pièce d''armure supplémentaire parmi d''autres : elle est ce qui active et maintient en mouvement toutes les autres.',
    'Notre église organise chaque semaine une réunion de prière matinale, du lundi au vendredi, de 5h50 à 6h50. Ce choix n''est pas anodin. Prier tôt, avant que la journée ne nous submerge de sollicitations, permet de fixer notre cœur sur Dieu avant de le fixer sur nos préoccupations. C''est une discipline exigeante, mais ceux qui la pratiquent avec constance en témoignent : elle change la trajectoire de la journée entière.',
    'La prière n''est pas seulement une demande adressée à Dieu ; c''est avant tout une relation entretenue. Trop souvent, nous limitons la prière à des moments de crise, alors qu''elle est conçue pour être un dialogue continu — comme le suggère l''exhortation de Paul aux Thessaloniciens de « prier sans cesse » (1 Thessaloniciens 5:17).',
    'Sur le plan spirituel, la prière est aussi un acte de combat. Elle ne se contente pas de nous rassurer psychologiquement ; elle s''attaque, dans l''invisible, à ce qui s''oppose aux desseins de Dieu pour notre vie, notre famille et notre église. C''est pourquoi les temps de jeûne et de prière collective occupent une place particulière dans notre calendrier, notamment lors des veillées et du Rassemblement des Aigles.',
    'Concrètement, comment progresser dans cette discipline ? Commencer petit, mais avec régularité, vaut mieux qu''une ambition immédiate difficile à tenir. Se joindre à un groupe de prière permet également de porter ensemble ce qui serait lourd à porter seul. Enfin, tenir un carnet de prière — notant sujets et réponses reçues — aide à mesurer, avec le temps, la fidélité de Dieu.',
    'Que cette réflexion soit une invitation, non à la culpabilité, mais au renouvellement : et si, cette semaine, nous redonnions à la prière la place centrale qui lui revient dans notre marche de disciple ?']::text[],
   'Pasteur David KALALA', 'DK', '7 min de lecture',
   'linear-gradient(135deg,rgba(255,255,255,.55),#1C1C8C)', NULL, true)
on conflict (slug) do nothing;

-- Éditions RDA : 18 éditions passées.
-- Aucune donnée réelle (titres, lieux, dates) n'a été fournie : les lignes
-- sont créées à compléter depuis le cpannel, et restent masquées tant
-- qu'elles ne contiennent pas d'information vérifiée. Inventer des dates
-- ou des lieux pour un historique d'église tromperait les visiteurs.
insert into public.rda_editions (edition_number, title, is_visible)
select n, 'Édition ' || n || ' — à compléter', false
  from generate_series(1, 18) as n
on conflict (edition_number) do nothing;
