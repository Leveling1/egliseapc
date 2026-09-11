---
name: Ambassadeurs pour Christ
description: Affiche de nuit pour le site public – noir profond, capitales blanches, trait jaune à la main – et back-office clair au seul accent bleu.
colors:
  night-black: "#0b0b0b"
  deep-blue: "#1c1c8c"
  highlighter-yellow: "#ffe600"
  paper-white: "#ffffff"
  section-gray: "#f5f5f5"
  ink-soft: "#444444"
  ink-secondary: "#666666"
  ink-faint: "#6f6f6f"
  ember-orange: "#e05e00"
  cp-accent: "#1c1c8c"
  cp-accent-hover: "#2a2ab0"
  cp-accent-soft: "#ececf7"
  cp-accent-softer: "#f5f5fb"
  cp-accent-border: "#c9c9e6"
  cp-canvas: "#eeeef2"
  cp-surface: "#ffffff"
  cp-surface-muted: "#f7f7fa"
  cp-ink: "#0b0b0b"
  cp-ink-soft: "#53535f"
  cp-ink-muted: "#696978"
  cp-line: "#e6e6ec"
  cp-positive: "#177344"
  cp-positive-soft: "#e6f4ec"
  cp-neutral-stat: "#6b6b78"
  cp-neutral-stat-soft: "#eeeef1"
  cp-danger: "#b4231f"
  cp-danger-hover: "#911b18"
  cp-danger-soft: "#fbeceb"
typography:
  poster:
    fontFamily: "Helvetica, Arial, sans-serif"
    fontSize: "clamp(13px, calc((100vw - 96px) / 18.6), 48px)"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "0.02em"
  display:
    fontFamily: "Poppins, sans-serif"
    fontSize: "56px"
    fontWeight: 700
    lineHeight: 1.1
  headline:
    fontFamily: "Poppins, sans-serif"
    fontSize: "40px"
    fontWeight: 700
    lineHeight: 1.2
  title:
    fontFamily: "Poppins, sans-serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Open Sans, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
  quote:
    fontFamily: "Open Sans, sans-serif"
    fontSize: "19px"
    fontWeight: 400
    lineHeight: 1.7
  label:
    fontFamily: "Poppins, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    letterSpacing: "2px"
  script:
    fontFamily: "Dancing Script, cursive"
    fontSize: "34px"
    fontWeight: 600
  cp-control:
    fontFamily: "Poppins, sans-serif"
    fontSize: "13px"
    fontWeight: 500
  cp-body:
    fontFamily: "Open Sans, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.6
  cp-column:
    fontFamily: "Poppins, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    letterSpacing: "0.6px"
rounded:
  none: "0"
  sm: "4px"
  md: "6px"
  pill: "999px"
  circle: "50%"
  cp-control: "10px"
  cp-card: "18px"
  cp-rail: "34px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "40px"
  section-sm: "56px"
  section: "80px"
  section-lg: "100px"
  gutter: "24px"
  header: "80px"
components:
  hero-link:
    backgroundColor: "transparent"
    textColor: "{colors.paper-white}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 0 5px"
  hero-link-hover:
    textColor: "{colors.highlighter-yellow}"
  newsletter-submit:
    backgroundColor: "{colors.highlighter-yellow}"
    textColor: "{colors.night-black}"
    typography: "{typography.cp-control}"
    rounded: "{rounded.sm}"
    padding: "14px 28px"
  newsletter-submit-hover:
    backgroundColor: "{colors.ember-orange}"
  card:
    backgroundColor: "{colors.paper-white}"
    textColor: "{colors.night-black}"
    rounded: "{rounded.sm}"
    padding: "20px 24px 24px"
  badge-yellow:
    backgroundColor: "{colors.highlighter-yellow}"
    textColor: "{colors.night-black}"
    rounded: "{rounded.md}"
    padding: "4px 12px"
  nav-link:
    backgroundColor: "transparent"
    textColor: "{colors.paper-white}"
    typography: "{typography.label}"
    padding: "0 0 4px"
  cp-button-primary:
    backgroundColor: "{colors.cp-accent}"
    textColor: "{colors.cp-surface}"
    typography: "{typography.cp-control}"
    rounded: "{rounded.cp-control}"
    padding: "9px 16px"
  cp-button-primary-hover:
    backgroundColor: "{colors.cp-accent-hover}"
  cp-button-ghost:
    backgroundColor: "{colors.cp-surface-muted}"
    textColor: "{colors.cp-ink}"
    typography: "{typography.cp-control}"
    rounded: "{rounded.cp-control}"
    padding: "9px 16px"
  cp-button-ghost-hover:
    backgroundColor: "{colors.cp-accent-soft}"
    textColor: "{colors.cp-accent}"
  cp-button-danger:
    backgroundColor: "{colors.cp-danger-soft}"
    textColor: "{colors.cp-danger}"
    typography: "{typography.cp-control}"
    rounded: "{rounded.cp-control}"
    padding: "9px 16px"
  cp-button-danger-hover:
    backgroundColor: "{colors.cp-danger}"
    textColor: "{colors.cp-surface}"
  cp-input:
    backgroundColor: "{colors.cp-surface}"
    textColor: "{colors.cp-ink}"
    typography: "{typography.cp-body}"
    rounded: "{rounded.cp-control}"
    padding: "10px 14px"
  cp-card:
    backgroundColor: "{colors.cp-surface}"
    textColor: "{colors.cp-ink}"
    rounded: "{rounded.cp-card}"
  cp-badge-online:
    backgroundColor: "{colors.cp-positive-soft}"
    textColor: "{colors.cp-positive}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
  cp-badge-neutral:
    backgroundColor: "{colors.cp-neutral-stat-soft}"
    textColor: "{colors.cp-neutral-stat}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
---

# Design System: Ambassadeurs pour Christ

## Overview

**Creative North Star: "L'Affiche de nuit"**

Le site public est une affiche d'événement collée dans la nuit de Kinshasa, qui s'anime quand on la regarde. Tout part de là : un noir profond qui n'est jamais gris, une photo réelle toujours voilée derrière ce noir pour rester texture et non second sujet, des capitales blanches serrées sur une seule ligne comme un titre d'affiche, et par-dessus, un mot écrit à la main au marqueur jaune. Le mouvement est cinématographique – rideau qui se lève, carrousel traversé, mur de photos qui se pose – mais il ne sert qu'une fois, à l'arrivée ; ensuite l'affiche est là, immobile, lisible. Solennel et chaleureux à la fois : la solennité vient du noir et des capitales, la chaleur du trait jaune, de l'écriture manuscrite et des visages sur les photos.

Sur les pages claires (Ressources, Blog, Contact) l'affiche se retourne : fond blanc ou gris très clair, encre noire, le bleu profond de la charte prend le rôle du jaune pour les surlignements. La densité est faible partout – sections de 100 px, colonnes de lecture à 560–760 px – et les composants sont discrets et nets : des liens soulignés d'un trait plutôt que des boutons pleins, des cartes blanches à coins de 4 px, aucune ombre qu'on remarque.

Le back-office « cpannel » est un second monde, volontairement distinct : un canevas gris-bleu clair, des cartes blanches à grand rayon séparées par le blanc et une ombre à peine perceptible, et un seul accent – le bleu profond – décliné en teintes très claires. Aucun jaune n'y entre ; le rouge n'y a qu'un sens, la suppression.

**Key Characteristics:**
- Noir de nuit (#0b0b0b) comme fond principal du site public ; photos toujours sous un voile noir de 55 à 82 %.
- Le jaune est un trait : soulignement, bordure gauche, badge, mot manuscrit – jamais une surface plus grande qu'un bouton.
- Deux familles de titrage : Helvetica grasse pour l'affiche (hero, filigrane, nav de l'accueil) ; Poppins pour tout le reste du site.
- Plat par défaut : la profondeur vient des voiles et des plans, pas des ombres.
- Le cpannel est clair, bleu, sans jaune ; le rouge signifie uniquement « supprimer ».
- Le mouvement est réservé à l'arrivée (accueil, hero, galerie) et respecte `prefers-reduced-motion`.

## Colors

Une palette de nuit – noir, blanc, un jaune de marqueur – tenue par le bleu profond de la charte, qui prend le relais sur fond clair.

### Primary
- **Noir de nuit** (`night-black`) : fond du hero, du pied de page, des sections à photo voilée ; encre principale sur fond clair. Ce n'est pas un gris anthracite : le contraste avec le blanc doit rester total.
- **Bleu profond** (`deep-blue`) : couleur des liens, des surlignements et des overlines sur fond clair ; icône « lecture » des vidéos ; extrémité du dégradé `linear-gradient(135deg, #0b0b0b, #1c1c8c)` qui habille newsletter, couvertures de livres et vignettes sans image. Sur fond noir, il n'apparaît qu'en halo radial très faible derrière le hero (`rgb(28 28 140 / 22%)`).

### Secondary
- **Jaune Surligneur** (`highlighter-yellow`) : le trait de marqueur de l'affiche. Écriture manuscrite « Bienvenue chez », soulignement du lien actif et des liens du hero, bordure gauche de la citation-oracle, overline de la newsletter, référence biblique du thème de l'année, badge « nouveau » sur les livres, séparateur du slogan du pied de page. Il survient toujours sur fond noir ou sur blanc pur ; jamais sur gris.
- **Orange braise** (`ember-orange`) : une seule apparition, le survol du bouton d'envoi jaune de la newsletter – le marqueur qui chauffe. Écho à l'orange du logo, sans autre usage.

### Neutral
- **Blanc papier** (`paper-white`) : texte sur fond noir, fond des cartes et des pages claires.
- **Gris de section** (`section-gray`) : fond des sections alternées sur pages claires (sermons, listes).
- **Encre douce** (`ink-soft`) : paragraphes longs sur fond clair (histoire, fondements, article).
- **Encre secondaire** (`ink-secondary`) : introductions et extraits sur fond clair.
- **Encre pâle** (`ink-faint`) : dates, métadonnées, placeholders. La plus claire des encres reste à 4,6:1 sur le gris de section : sur un téléphone au soleil, une date doit encore se lire.
- **Blanc voilé** : sur fond noir, le texte secondaire est du blanc à 70–85 % (`rgba(255,255,255,0.7)` pour les introductions, `0.75–0.85` pour les liens de navigation, `0.5` pour le slogan du pied de page) – jamais un gris opaque.

### Cpannel
- **Accent** (`cp-accent`, survol `cp-accent-hover`) : boutons principaux, icône active du rail, carte mise en avant, astérisque des champs requis. Déclinaisons `cp-accent-soft` (fonds de badge, survol des boutons fantômes), `cp-accent-softer` (anneau de focus, encarts d'information), `cp-accent-border` (bordure de focus).
- **Canevas** (`cp-canvas`) : fond de toute l'interface. **Surface** (`cp-surface`) : cartes, rail, modales, champs. **Surface atténuée** (`cp-surface-muted`) : boutons fantômes, survol des lignes de tableau.
- **Encres** : `cp-ink` pour le texte, `cp-ink-soft` pour les descriptions, `cp-ink-muted` pour en-têtes de colonnes, aide de champ, lignes masquées, icônes inactives. **Filet** (`cp-line`) : séparation des lignes de tableau et bordure des champs au repos.
- **Positif** (`cp-positive` / `cp-positive-soft`) : pastille « en ligne ». **Neutre** (`cp-neutral-stat` / `cp-neutral-stat-soft`) : pastille « masqué » et statistiques en baisse.
- **Danger** (`cp-danger`, survol `cp-danger-hover`, fond `cp-danger-soft`) : boutons de suppression, alertes d'erreur, avertissements de modale.

### Named Rules
**The Veil Rule.** Aucune photo n'est posée nue sous du texte. Elle passe sous un voile noir : 55 % (thème de l'année, hero RDA), 62 % (scrim du hero), 72 % (programmes), jusqu'à 82 % (fond du hero). Le texte reste blanc pur ; la photo reste une texture.

**The Yellow Line Rule.** Le jaune trace, il ne remplit pas. Un trait de 2–3 px, un mot, un badge, un bouton d'envoi – jamais un fond de section ni une carte. Sa rareté est ce qui le fait lire comme un geste à la main.

**The Blue Turnover Rule.** Sur fond clair, le bleu profond reprend exactement les rôles du jaune : soulignement du lien actif (`--color-apc-blue-dark`), overline de section, lien « Lire ». Le jaune ne suit pas sur le blanc cassé.

**The Red Means Delete Rule.** Dans le cpannel, le rouge n'apparaît que sur une action destructrice ou son avertissement. Une statistique en baisse ou un contenu masqué passent en gris neutre.

**The No Yellow Backstage Rule.** Aucun jaune dans le cpannel. Son seul accent est le bleu profond, décliné en teintes claires.

**The Readable Gray Rule.** Une encre « atténuée » porte encore de l'information - une date, un en-tête de colonne, une aide de champ - donc elle passe 4,5:1 sur toutes les surfaces où elle apparaît. Le gris qui ne passe pas n'est pas une encre, c'est un filet ou un fond.

## Typography

**Poster Font:** Helvetica (avec Arial, sans-serif)
**Display Font:** Poppins (avec sans-serif)
**Body Font:** Open Sans (avec sans-serif)
**Script Font:** Dancing Script (avec cursive) ; le mot « Bienvenue chez » du hero est un SVG de lettrage, pas une police.

**Character :** une grotesque grasse pour crier le nom sur l'affiche, une géométrique ronde et bienveillante pour parler, une humaniste sobre pour lire. L'écriture manuscrite – SVG jaune dans le hero, Dancing Script sur le thème de l'année – est la main qui a signé l'affiche.

### Hierarchy
- **Poster** (Helvetica 700, `clamp(13px, calc((100vw - 96px) / 18.6), 48px)`, 1.15, espacement 0.02 em, capitales) : le nom de l'église sur une seule ligne dans le hero. La formule garantit que « LES AMBASSADEURS POUR CHRIST » tient sans repli ; sous 700 px, `clamp(19px, 6.2vw, 32px)` centré et replié.
- **Display** (Poppins 700, 56 px, 1.1) : titre des pages à hero photo (RDA, cultes). Le thème de l'année monte à 64 px.
- **Headline** (Poppins 700, 40 px, 1.2) : titre de section, toujours précédé d'un overline et centré.
- **Title** (Poppins 600, 16–22 px, 1.3–1.4) : titres de cartes (17 px article, 16 px vidéo, 20 px livre, 22 px vidéo à la une).
- **Body** (Open Sans 400, 16 px, 1.6) : introductions de section, limitées à 560 px. Dans les cartes : 14 px / 1.6 en encre secondaire.
- **Quote** (Open Sans italique, 15–19 px, 1.7) : citations bibliques et oracles, en blanc à 75–80 % sur fond noir, max 620–640 px.
- **Label** (Poppins 600, 13 px, capitales, espacement 2 px) : overlines de section – bleu profond sur clair, blanc ou jaune sur noir. Slogan du pied de page : 12 px, espacement 2 px.
- **Nav** (Poppins 400/500, 14 px ; Helvetica sur l'accueil) : liens d'en-tête, actif en 500 souligné.
- **Script** (Dancing Script 600, 34 px) : overline manuscrit du thème de l'année, en jaune.
- **Cpannel** : contrôles et libellés en Poppins 500 13 px ; corps en Open Sans 14 px / 1.6 ; en-têtes de colonnes en Poppins 500 12 px capitales espacées de 0.6 px ; titres de modale en Poppins 600 17 px ; aide de champ en Open Sans 11.5 px atténuée.

### Named Rules
**The Poster Exception Rule.** Helvetica n'existe qu'à trois endroits : le lockup du hero, le filigrane « APC » du pied de page (700, `clamp(120px, 42vw, 360px)`, 6 % de blanc) et la navigation de la page d'accueil. Partout ailleurs, Poppins titre et Open Sans lit.

**The Reference Rule.** Une citation biblique porte toujours sa référence, en Poppins 600 sous le texte – jaune sur noir, bleu sur clair. Jamais de verset orphelin.

**The One Line Rule.** Le nom de l'église dans le hero ne se replie jamais au-dessus de 700 px ; la taille se calcule sur la largeur disponible plutôt que de laisser le titre casser.

## Layout

Conteneur de 1200 px centré, gouttières de 24 px. Les colonnes de lecture sont plus étroites : 560 px pour une introduction, 620–640 px pour une citation, 700 px pour la newsletter, 760 px pour le pied de page, 900 px pour la grille des programmes.

Les sections publiques respirent à 100 px vertical (80 px pour la newsletter et le thème de l'année ; 56 px sous 480 px). Chaque section suit le même ordre : overline, headline, introduction centrée, puis contenu. L'en-tête mesure 80 px, posé en absolu sur le hero (transparent, texte blanc ombré) ou sur fond blanc en variante « light » (texte noir, soulignement bleu).

Le hero de l'accueil est épinglé sur 300 vh : 100 vh d'écran collé pendant que le carrousel est traversé puis que le portrait du visionnaire s'installe. Les autres heros font 100 vh minimum avec photo fixe (`background-attachment: fixed`, désactivé sous 768 px).

Grilles : cartes en `flex-wrap` avec `min-width: 280px` et gap 24 px ; mur de la galerie en colonnes de maçonnerie, 3 colonnes au-dessus de 700 px, 2 en dessous, plafonné à 1280 px.

Points de rupture observés : 860 px (menu hamburger), 768 px (photos fixes → défilantes, carte d'application empilée), 700 px (hero centré, galerie à 2 colonnes), 640 px (modales et tableaux du cpannel), 480 px (newsletter empilée).

Cpannel : rail fixe de 68 px à gauche (216 px au survol, par-dessus le contenu), contenu à 108 px du bord, marge de 20 px tout autour ; cartes à 18 px de rayon, tableaux à cellules de 14 px, champs espacés de 18 px.

## Elevation & Depth

Plat par défaut. Le site public ne construit sa profondeur que par des plans – voile noir sur photo, rideau, scrim, carrousel en perspective – et jamais par des ombres portées. L'unique ombre des cartes, `0 1px 2px rgba(0,0,0,0.06)`, est là pour décoller un blanc d'un blanc, pas pour être vue ; au survol, la carte monte de 2 à 4 px sans que l'ombre grossisse.

Le cpannel sépare par le blanc : cartes blanches sur canevas gris-bleu, avec `--cp-shadow` (`0 1px 2px rgb(11 11 11 / 4%), 0 8px 24px rgb(11 11 11 / 4%)`) si douce qu'elle se lit comme un léger relief. Les ombres franches sont réservées aux couches flottantes.

### Shadow Vocabulary
- **Feuille** (`box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06)`) : cartes publiques, couvertures, bouton lecture.
- **Relief cpannel** (`box-shadow: 0 1px 2px rgb(11 11 11 / 4%), 0 8px 24px rgb(11 11 11 / 4%)`) : cartes, rail replié.
- **Rail ouvert** (`box-shadow: 0 8px 40px rgb(11 11 11 / 12%)`) : rail élargi au survol.
- **Modale** (`box-shadow: 0 20px 60px rgb(11 11 11 / 22%)`) : panneau de modale sur voile `rgb(11 11 11 / 40%)`.
- **Menu mobile clair** (`box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1)`) : tiroir de navigation en variante light.

### Named Rules
**The Flat-By-Default Rule.** Une surface au repos est plate. La profondeur vient d'un voile, d'un plan ou d'un dégradé noir→bleu, jamais d'une ombre qu'on remarque. Seules les couches flottantes (modale, rail ouvert, menu) portent une ombre visible.

## Shapes

Coins presque droits sur le site public : 4 px sur les cartes, couvertures, vignettes et champs ; 6 px sur les badges et étiquettes ; 999 px sur les pastilles ; cercles parfaits pour les boutons de lecture, les icônes sociales et la fermeture de modale. Les bordures sont des filets à 1 px de blanc à 10–15 % sur noir, ou de bleu à 4 % sur blanc – présentes, jamais lues.

Le trait jaune est la forme signature : 2 px sous un lien, 3 px à gauche d'une citation, un mot manuscrit qui déborde du bloc de capitales.

Le cpannel arrondit davantage : 10 px pour tout contrôle (boutons, champs, alertes), 18 px pour les cartes et modales, 34 px pour le rail-pilule et 21 px pour ses éléments.

## Components

### Buttons
Discrets et nets. Le site public préfère le lien souligné au bouton plein.
- **Lien d'affiche** (`hero-link`) : texte blanc Helvetica 600 15 px, trait jaune de 2 px dessous, 5 px d'espace ; survol → texte jaune. Utilisé pour les appels à l'action du hero.
- **Lien de carte** : Poppins 500–600 13 px, bleu profond, souligné au survol.
- **Bouton d'envoi** (`newsletter-submit`) : fond jaune, texte noir Poppins 600 14 px, 14 × 28 px, accolé au champ (rayon 0 10 10 0) ; survol → orange braise. Seul bouton plein du site public.
- **Bouton de lecture** : disque blanc à 95 % (72 px à la une, 48 px en carte), triangle bleu profond ; grossit de 10 % au survol.

### Cards / Containers
- **Corner Style :** 4 px.
- **Background :** blanc papier ; vignette sans image en dégradé `135deg #0b0b0b → #1c1c8c`.
- **Shadow Strategy :** feuille (6 %) ; survol `translateY(-2px à -4px)`.
- **Border :** `1px solid rgba(28, 28, 140, 0.04)` sur les cartes d'article et de livre.
- **Internal Padding :** 20 px (vidéo), 20 × 24 px (article), 32 px (livre).
- **Étiquette flottante** : capsule noire à 50 % floutée (`backdrop-filter: blur(8px)`), Poppins 500 11 px blanc, rayon 5 px, en haut à gauche du média.

### Badges
- **Jaune** (`badge-yellow`) : fond jaune, texte noir Poppins 600 11 px capitales espacées de 1 px, rayon 6 px – « nouveau », mise en avant.
- **Clair** : blanc à 55 %, texte bleu profond – variante sur fond photo.

### Inputs / Fields
- **Newsletter** : champ blanc à 12 % sur fond dégradé, filet blanc à 15 %, texte blanc, placeholder à 40 %, 14 × 16 px ; sous 480 px le champ et le bouton s'empilent avec 4 px de rayon chacun.
- **Consentement** : 12 px, blanc à 72 % – lisible sur le fond sombre.

### Navigation
- **En-tête** : absolu sur 80 px, logo 40 px + wordmark Poppins 700 18 px espacé de 1 px. Liens Poppins 400 14 px blanc à 75 % (ombre `0 1px 6px rgba(0,0,0,0.4)`), actif en 500 blanc souligné jaune 2 px. Variante « light » : encre noire, pas d'ombre, soulignement bleu. Sur l'accueil, tout passe en Helvetica et blanc à 85 %.
- **Mobile (< 860 px)** : hamburger 3 barres de 24 px, tiroir noir à 97 % (blanc + ombre en light), liens de 14 px de haut séparés par un filet blanc à 12 % ; l'actif porte une bordure gauche de 3 px jaune (bleue en light).
- **Pied de page** : noir, centré, logo + wordmark Poppins 700 20 px, slogan 12 px capitales à 50 % avec séparateurs jaunes, liens Poppins 500 14 px blanc à 70 % (jaune au survol) sous un filet blanc à 10 %, icônes sociales dans des disques blancs à 8 %, filigrane « APC » Helvetica géant à 6 %.

### Section Quote
Citation biblique ou oracle sur fond noir voilé : Open Sans italique 15–19 px blanc à 75–80 %, référence Poppins 600 jaune dessous ; en variante « oracle », bordure gauche jaune de 3 px et nom de l'oracle en Poppins 600 jaune.

### Hero d'affiche (signature)
Fond noir, photo à 82 % de voile, rideau noir qui se lève après 2,4 s. Lockup : SVG manuscrit jaune « Bienvenue chez » révélé lettre à lettre en 2 418 ms par balayage linéaire, chevauchant le bloc de capitales Helvetica qui apparaît pendant la levée du stylo (flou 0.2 em → net, 1 000 ms). Puis tagline jaune Helvetica 600 15 px espacée de 3 px, et liens d'affiche. L'accueil ne se joue qu'une fois par session ; sous `prefers-reduced-motion`, tout est posé d'emblée.

### Mur de photos (signature)
Maçonnerie de colonnes où chaque photo garde ses proportions ; à l'arrivée, le mur est incliné (15°, 20°), remonté, agrandi (×2.4) et effacé, puis ressorts (raideur 300, amortissement 30) le posent en place sur une hauteur d'écran de défilement. La progression ne redescend jamais. Pagination noire sous le mur.

### Cpannel – Boutons
- **Primaire** (`cp-button-primary`) : bleu accent, texte blanc, Poppins 500 13 px, 9 × 16 px, rayon 10 px ; survol bleu plus vif. Désactivé à 60 %.
- **Fantôme** (`cp-button-ghost`) : surface atténuée, encre ; survol fond bleu très clair et texte bleu.
- **Danger** (`cp-button-danger`) : fond rouge très clair, texte rouge ; survol rouge plein, texte blanc. Uniquement pour supprimer.

### Cpannel – Champs
- **Input** (`cp-input`) : blanc, filet `cp-line`, rayon 10 px, 10 × 14 px, Open Sans 14 px ; focus → bordure `cp-accent-border` et anneau de 3 px `cp-accent-softer`. Libellé Poppins 500 13 px, requis marqué d'un astérisque bleu, aide en Open Sans 11.5 px atténuée précédée d'une pastille « i ».

### Cpannel – Cartes, pastilles, tableaux, modales
- **Carte** (`cp-card`) : blanc, rayon 18 px, relief cpannel.
- **Pastilles** : capsules Poppins 500 12 px – `cp-badge-online` vert, `cp-badge-neutral` gris (« masqué » n'est pas une erreur), accent bleu clair.
- **Tableau** : en-têtes Poppins 500 12 px capitales atténuées, cellules 14 px séparées par un filet, ligne survolée en surface atténuée, ligne masquée en encre atténuée ; actions alignées à droite.
- **Modale** : voile noir à 40 %, panneau blanc 640 px (440 px en étroit) à 18 px de rayon, ombre modale, titre Poppins 600 17 px, fermeture en disque de 34 px.
- **Rail** : pilule blanche fixe de 68 px, icônes atténuées, élément actif bleu ; s'élargit à 216 px au survol pour révéler les libellés (jamais sur écran tactile).

## Do's and Don'ts

### Do:
- **Do** poser toute photo sous un voile noir de 55 à 82 % avant d'y écrire en blanc.
- **Do** réserver le jaune à des traits, des mots, des badges et l'unique bouton d'envoi – 2 px sous un lien, 3 px à gauche d'une citation.
- **Do** basculer le jaune vers le bleu profond (#1c1c8c) dès que le fond est clair : lien actif, overline, lien de carte.
- **Do** ouvrir chaque section par un overline Poppins 600 13 px capitales espacées de 2 px, puis un headline Poppins 700 40 px, puis une introduction de 560 px max.
- **Do** garder les cartes à 4 px de rayon, ombre à 6 %, montée de 2–4 px au survol.
- **Do** citer chaque verset avec sa référence en Poppins 600 sous le texte.
- **Do** jouer le mouvement une seule fois, à l'arrivée, et le retirer entièrement sous `prefers-reduced-motion`.
- **Do** dans le cpannel : bleu pour l'action, gris neutre pour « masqué » ou « en baisse », rouge pour supprimer et rien d'autre.

### Don't:
- **Don't** utiliser Helvetica hors du lockup du hero, du filigrane du pied de page et de la navigation de l'accueil.
- **Don't** remplir une surface de jaune ni le poser sur un gris.
- **Don't** faire entrer du jaune, ni un second accent, dans le cpannel.
- **Don't** signaler un contenu masqué ou une baisse en rouge.
- **Don't** ajouter une ombre visible à une surface au repos ; la profondeur vient des voiles et des plans.
- **Don't** remplacer le noir de nuit (#0b0b0b) par un gris anthracite, ni le blanc voilé par un gris opaque sur fond noir.
- **Don't** laisser le nom de l'église se replier sur deux lignes au-dessus de 700 px.
- **Don't** afficher une photo brute derrière du texte, ni faire dépendre une information de la fin d'une animation.
