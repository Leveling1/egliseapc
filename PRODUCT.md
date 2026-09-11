# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Trois publics servis à égalité, sans hiérarchie (confirmé) :

- **La personne en recherche / le nouvel arrivant** – ne connaît pas l'église, veut savoir où, quand et comment venir. Consulte presque toujours sur téléphone.
- **Les membres et fidèles** – viennent pour les horaires, le programme, les vidéos de cultes, le blog, les éditions du Rassemblement des Aigles.
- **La diaspora et les extensions** – fidèles éloignés qui suivent l'église à distance et cherchent l'extension la plus proche (coordonnées, WhatsApp, itinéraire).

Un quatrième usager, interne : **l'administrateur unique** du back-office « cpannel », qui publie tout le contenu. Les droits par module (articles, RDA, programmes, extensions, livres, applications, galerie…) existent pour l'avenir, pas pour une équipe actuelle.

## Product Purpose

Site vitrine de l'église **Ambassadeurs pour Christ** (A.P.C), Kinshasa, République démocratique du Congo, avec son back-office de publication.

Quatre réussites comptent, toutes confirmées comme importantes :

1. **Venir à un culte** – trouver l'adresse, l'horaire, se déplacer.
2. **Prendre contact** – appel, WhatsApp ou e-mail vers l'église mère ou une extension.
3. **Rester en lien** – newsletter, blog, vidéos de cultes, éditions du Rassemblement des Aigles.
4. **Comprendre la vision** – qui sont les Ambassadeurs pour Christ, le Prophète Garry KENGE MBULU, le Rassemblement des Aigles.

## Positioning

Une église dont le nom est un mandat biblique littéral – *« Nous faisons donc les fonctions d'ambassadeurs pour Christ »* (2 Corinthiens 5:20) – et dont la mission est « réconcilier le monde avec Dieu ». Son signe distinctif : le **Rassemblement des Aigles (RDA)**, vision révélée au Prophète Garry KENGE MBULU en 2002 d'après Job 39, devenu le rendez-vous annuel de l'église et le contenu que nulle autre ne peut porter. Alliance : **« Sainteté à l'Éternel »**.

## Operating Context

- **Kinshasa, téléphone, connexion lente** (confirmé) : la majorité consulte sur Android avec un débit limité. Le poids des pages et surtout des images est déterminant ; chaque écran doit rester utile avant que les photos aient fini de charger.
- **Hébergement statique** (o2switch, FTP) : site Angular prérendu, aucun serveur Node en production ; le back-office est rendu côté client uniquement. Les données publiques sont lues directement dans Supabase depuis le navigateur.
- **Rituels de l'église** : cultes réguliers (programmes récurrents), activités spéciales (dont la Journée du Parfum), le Rassemblement des Aigles annuel avec ses éditions archivées, les extensions (églises filles) avec leurs responsables.
- **Publication** : un seul administrateur, connecté via Google, alimente le cpannel ; les photos passent par un service média externe (API Express sur o2switch) qui renvoie une URL publique.

## Capabilities and Constraints

Fonctionnalités confirmées côté public : accueil, À propos (histoire en chapitres, fondements, verset fondateur), Nos cultes (vidéos), Nos activités (RDA + Journée du Parfum), Ressources (livres, application mobile), Galerie (mur de photos paginé), Blog (articles par catégorie), Contact (extensions avec téléphone, WhatsApp, e-mail, horaires, itinéraire), newsletter avec consentement.

Côté cpannel : tableau de bord, articles avec éditeur, éditions RDA, programmes, extensions, oracles, ressources (livres + applications), galerie avec envoi par lot, journal d'activité, droits par module.

Contraintes durables, décidées par le propriétaire :

- **Sécurité par conception.** Chaque fonction du back-office vérifie l'authentification puis l'autorisation par module ; le front ne reçoit et n'affiche que les colonnes destinées à être affichées.
- **Jamais de suppression réelle** : tout retrait est un passage à l'état invisible.
- **Connexion Google uniquement** pour le cpannel.
- **Nommage des Edge Functions** : `METHOD-NAME[-pannel]`.
- **Pagination** de toute liste de photos, côté public comme côté cpannel.
- **Terminologie** : « A.P.C », « Rassemblement des Aigles » / « RDA », « extension » (église fille), « Prophète Garry KENGE MBULU », « cpannel » (back-office), « Journée du Parfum ».

Non décidé : le retrait d'une photo côté service média (suppression distante ou simple invisibilité) ; l'accueil des photos réelles dans la galerie une fois le service média opérationnel.

## Brand Commitments

- **Nom** : Ambassadeurs pour Christ. **Alliance** : « Sainteté à l'Éternel ». **Valeurs (charte)** : Foi • Espérance • Amour • Unité • Mission.
- **Versets** : 2 Corinthiens 5:20 et Matthieu 28:19 – toujours cités avec leur référence.
- **Ton (charte)** : inspirant, bienveillant, engagé, universel ; chaleureux et accessible, jamais commercial ni agressif.
- **Charte graphique v1.0** : document officiel, résumé dans `.agents/ui-design-system-compact.md` (logo et ses règles de zone de protection et de taille minimale, palette bleu/orange/jaune, Poppins + Open Sans). Le logo ne doit jamais être redessiné ni modifié.
- **Cpannel** : bleu primaire, pas de jaune, rouge réservé aux boutons de suppression.

## Evidence on Hand

- Charte graphique v1.0 et logo officiel (confirmés disponibles).
- Photos réelles de cultes, du RDA et du temple (confirmées disponibles) : `public/images/home/hero_*.jpg`, `public/images/galerie/`, `public/images/rda/`.
- Histoire de l'église rédigée en chapitres dans `src/app/features/about/` (fondation, temple dédicacé le 30 juin 2007, RDA depuis 2002).
- Contenu vivant dans Supabase (articles, éditions RDA, programmes, extensions, livres, application, photos).
- Absences à ne pas combler par invention : témoignages, chiffres de fréquentation, dates de la prochaine Journée du Parfum (fournie par le cpannel).

## Product Principles

1. **Utile avant d'être chargé** – sur téléphone à débit lent, l'information de venue et de contact doit être lisible avant toute image.
2. **Trois publics, une seule porte** – nouvel arrivant, fidèle et diaspora trouvent chacun leur chemin sans qu'un public écrase les autres.
3. **La Parole au premier plan** – les versets et la vision (RDA, réconciliation) sont le contenu de marque, pas un ornement.
4. **Rien n'est jamais perdu** – suppression logique, historique conservé, contenu publié toujours retrouvable.
5. **Un administrateur, pas de friction** – le cpannel est conçu pour une personne seule qui publie vite et sûrement.

## Accessibility & Inclusion

Public majoritairement sur Android à débit limité : images dimensionnées et chargées paresseusement, contenu textuel prioritaire, aucune fonctionnalité qui dépende d'une animation ou d'un chargement lourd (l'animation d'accueil ne se joue qu'une fois par session ; mouvement réduit respecté).
