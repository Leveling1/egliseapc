# ui-design-system-compact.md

## Design System — Ambassadeurs pour Christ (Site Vitrine)

Référence visuelle extraite de la **Charte Graphique officielle** (v1.0) de l'église Ambassadeurs pour Christ. Tout composant Angular du site vitrine doit respecter ces tokens et conventions.

Les tokens marqués **[charte]** viennent directement du document officiel. Les tokens marqués **[dérivé]** sont des conventions UI nécessaires à l'implémentation web, déduites de la charte mais non explicitement chiffrées dans celle-ci — à valider avec le client si besoin.

---

## 0. Identité de marque

- **Nom** : Ambassadeurs pour Christ
- **Alliance** : *« Sainteté à l'Éternel »*
- **Baseline / valeurs [charte]** : Foi • Espérance • Amour • Unité • Mission
- **Versets de base** :
  - *« Nous faisons donc les fonctions d'ambassadeurs pour Christ… »* — 2 Corinthiens 5:20
  - *« Aller, faire de toutes les nations des disciples… »* — Matthieu 28:19 [charte]
- **Ton de communication [charte]** :
  | Trait | Description |
  | --- | --- |
  | Inspirante | Transmettre l'espérance et la foi |
  | Bienveillante | Être à l'écoute et proche des personnes |
  | Engagée | Agir avec foi pour un impact positif |
  | Universelle | Ouverte à tous, sans distinction |

Conséquence UI : rédaction chaleureuse et accessible, jamais commerciale ni agressive ; citations bibliques mises en avant comme éléments de réassurance (encadré accent, guillemets typographiques, référence en petite capitale).

---

## 1. Logo

- **Composition [charte]** : globe (bleu, effet réseau/monde) + croix en bois + livre ouvert (Bible) posés devant le globe + rayonnement soleil orange/jaune en arrière-plan.
- **Fichier source** : logo fourni en illustration vectorielle/raster complexe (pas un simple SVG de lignes) — utiliser l'asset officiel exporté (SVG/PNG haute résolution), ne jamais le redessiner en version simplifiée.
- **Règles d'utilisation [charte]** :
  - Version originale uniquement, aucune modification (couleurs, proportions, éléments, orientation).
  - Toujours lisible et visible sur tous les supports.
- **Zone de protection [charte]** : zone minimale autour du logo = hauteur de la croix (unité « X »). Aucun élément graphique, texte ou visuel ne doit empiéter dans cette zone.
- **Taille minimale [charte]** :
  | Support | Taille min |
  | --- | --- |
  | Impression | 20 mm |
  | Numérique | 80 px |
- **Déclinaisons sur fonds [charte]** : validé sur fond clair, fond bleu, fond dégradé bleu, fond foncé/noir. Toujours vérifier lisibilité et contraste.
- **Usage web [dérivé]** : header 32–40px de hauteur ; favicon = version recadrée serrée (globe + croix) lisible à 16–32px ; footer = logo + wordmark empilés ou côte à côte.

---

## 2. Typographie

### Polices [charte]

| Rôle | Famille | Fallback |
| --- | --- | --- |
| Titres (principale) | `Poppins` | `sans-serif` |
| Texte courant (secondaire) | `Open Sans` | `sans-serif` |

### Usages [charte]

- Titres / H1 : **Poppins Bold**
- Sous-titres / H2 : **Poppins SemiBold**
- Textes courants : **Open Sans Regular**
- Accent / mise en avant : **Poppins Medium ou Bold**

### Poids utilisés [dérivé]

- Poppins : 500 (Medium), 600 (SemiBold), 700 (Bold)
- Open Sans : 400 (Regular), 600 (SemiBold), 700 (Bold)

### Échelle typographique [dérivé — à valider]

| Usage | Taille | Famille / Poids | Line-height |
| --- | --- | --- | --- |
| Hero H1 | `clamp(2.2rem, 5.6vw, 4.4rem)` | Poppins 700 | 1.08 |
| Section H2 | `clamp(1.8rem, 3.4vw, 2.6rem)` | Poppins 600 | 1.15 |
| Section H3 / carte | `clamp(1.2rem, 2vw, 1.5rem)` | Poppins 600 | 1.2 |
| Sous-titre / accroche | `clamp(1.15rem, 2.4vw, 1.5rem)` | Poppins 500 | 1.4 |
| Corps de texte | `16px` | Open Sans 400 | 1.65 |
| Corps de texte (large) | `18px` | Open Sans 400 | 1.65 |
| Citation biblique | `clamp(1.3rem, 2.4vw, 1.8rem)` | Poppins 600 | 1.35 |
| Référence citation | `13px` | Open Sans 700, uppercase | — |
| Overline / label | `13px` | Poppins 700, uppercase, tracking 0.06em | — |
| Nav link | `14.5px` | Open Sans 600 | — |
| Bouton | `15px` | Poppins 600 | — |
| Petit texte / footer | `14px` | Open Sans 400 | — |

### Conventions texte

- Overlines/labels : `text-transform: uppercase`
- `-webkit-font-smoothing: antialiased` sur body
- Citations bibliques toujours accompagnées de leur référence (livre, chapitre, verset)

---

## 3. Couleurs

### Palette officielle [charte]

| Token | Hex | Nom charte | Usage recommandé |
| --- | --- | --- | --- |
| `--apc-blue-dark` | `#1C1C8C` | Bleu foncé | Fonds foncés, texte sur fond clair, hover accent |
| `--apc-blue` | `#3B39FF` | Bleu vif | Couleur primaire : boutons, liens, badges |
| `--apc-blue-light` | `#B3B6FF` | Bleu clair | Accents secondaires, icônes sur fond foncé |
| `--apc-blue-pale` | `#F2F3FF` | Blanc / Bleu très clair | Fonds de section clairs, cartes |
| `--apc-orange` | `#FF6A00` | Orange | Accent chaleureux : CTA ponctuel, highlights, rayonnement logo |
| `--apc-yellow` | `#FFE600` | Jaune | Accent lumineux : détails, badges événements, rayonnement logo |
| `--apc-brown` | `#8B5A2B` | Marron | Détails croix / livre uniquement (usage iconographique, pas UI générale) |
| `--apc-beige` | `#D9B27A` | Beige | Détails livre uniquement (usage iconographique, pas UI générale) |
| `--apc-black` | `#0B0B0B` | Noir | Texte principal, détails, fonds très foncés |
| `--apc-white` | `#FFFFFF` | — | Fonds clairs, texte sur fond foncé |

### Dégradé [charte]

`--apc-gradient-blue: linear-gradient(135deg, #1C1C8C 0%, #3B39FF 55%, #B3B6FF 100%)`
Usage : fonds de section (hero, contact), boutons principaux, éléments graphiques décoratifs.

### Rôle des couleurs [dérivé]

- **Primaire (actions, liens, focus)** : `--apc-blue` (#3B39FF), hover `--apc-blue-dark` (#1C1C8C)
- **Fond clair par défaut** : `#FFFFFF` / `--apc-blue-pale` (#F2F3FF) pour sections alternées
- **Fond foncé (hero, footer, CTA fort)** : `--apc-blue-dark` (#1C1C8C) ou dégradé `--apc-gradient-blue`
- **Accents événementiels / mise en avant ponctuelle** : `--apc-orange`, `--apc-yellow` — à utiliser avec modération (badges, icône "nouveau", surlignage), jamais en grande surface
- **Marron / beige** : réservés aux illustrations liées à la croix et à la Bible, ne pas les utiliser comme couleurs UI (boutons, fonds, textes)
- **Texte principal sur fond clair** : `--apc-black` (#0B0B0B) ou `--apc-blue-dark`
- **Texte principal sur fond foncé** : `--apc-white` ou `--apc-blue-pale`

### Opacités récurrentes [dérivé]

| Usage | Valeur |
| --- | --- |
| Texte secondaire (fond clair) | `rgba(11,11,11,0.65)` |
| Texte tertiaire (fond clair) | `rgba(11,11,11,0.5)` |
| Texte secondaire (fond foncé) | `rgba(255,255,255,0.75)` |
| Texte tertiaire (fond foncé) | `rgba(255,255,255,0.55)` |
| Bordures (fond clair) | `rgba(28,28,140,0.14)` |
| Bordures (fond foncé) | `rgba(255,255,255,0.16)` |
| Overlay image (fond foncé) | `rgba(28,28,140,0.55)` |

### Tags / badges [dérivé]

| Contexte | Fond | Texte |
| --- | --- | --- |
| Badge standard | `--apc-blue-pale` (#F2F3FF) | `--apc-blue` (#3B39FF) |
| Badge événement / highlight | `--apc-orange` ou `--apc-yellow` (10–15% opacité) | `--apc-orange` / texte noir |
| Badge sur fond foncé | `rgba(179,182,255,0.16)` | `--apc-blue-light` (#B3B6FF) |

---

## 4. Iconographie [charte]

Style : icônes ligne simples, formes arrondies, un seul niveau de détail, pas de remplissage lourd.

| Icône | Signification |
| --- | --- |
| Église (bâtiment) | Église / Communauté |
| Mains jointes | Foi / Prière |
| Croix | Jésus-Christ |
| Globe | Mission / Monde |
| Cœur | Amour |
| Personnes | Unité / Fraternité |
| Livre ouvert | Parole de Dieu |
| Flamme | Esprit Saint |
| Étoile | Espérance |

Règles [charte] :
- Utiliser des formes arrondies et harmonieuses
- Privilégier les icônes simples et significatives
- Éléments décoratifs (lignes, rayons, halos lumineux) à appliquer avec modération pour garder la clarté visuelle

Usage web [dérivé] : icônes 20–24px en ligne de texte, 40×40px dans un icon-box `--apc-blue-pale` radius `--radius-sm` pour les cartes de section (ministères, valeurs, services).

---

## 5. Éléments graphiques [charte]

- Globe, colombe, livre ouvert, personnes, mains en prière — utilisés comme illustrations ou pictos de section
- Formes arrondies et harmonieuses privilégiées partout (boutons, cartes, images)
- Décors : barre / pastille en dégradé bleu, halo lumineux doux, rayons de soleil (repris du logo) en élément décoratif discret sur fond foncé
- Styles décoratifs à appliquer **avec modération** pour ne pas nuire à la lisibilité

---

## 6. Espacements [dérivé]

### Padding sections

| Section | Padding vertical | Padding horizontal |
| --- | --- | --- |
| Header | fixe, hauteur 76px | `clamp(20px,5vw,64px)` |
| Hero | `clamp(64px,10vw,120px)` | `clamp(20px,5vw,64px)` |
| À propos / Vision-Mission | `clamp(64px,10vw,120px)` | `clamp(20px,5vw,64px)` |
| Ministères / Services | `clamp(56px,9vw,104px)` | `clamp(20px,5vw,64px)` |
| Horaires des cultes | `clamp(48px,8vw,96px)` | `clamp(20px,5vw,64px)` |
| Prédications / Médias | `clamp(56px,9vw,104px)` | `clamp(20px,5vw,64px)` |
| Événements | `clamp(56px,9vw,104px)` | `clamp(20px,5vw,64px)` |
| Témoignages | `clamp(56px,9vw,104px)` | `clamp(20px,5vw,64px)` |
| Don / Soutenir | `clamp(56px,9vw,104px)` | `clamp(20px,5vw,64px)` |
| Contact | `clamp(56px,9vw,104px)` | `clamp(20px,5vw,64px)` |
| Footer | `clamp(48px,7vw,72px)` top, `28px` bottom | `clamp(20px,5vw,64px)` |

### Max-widths

| Contexte | Valeur |
| --- | --- |
| Conteneur principal | `1280px` |
| Texte / paragraphe centré | `760px` |
| Citation biblique | `680px` |
| Formulaire contact | `560px` |

---

## 7. Rayons de bordure [dérivé]

| Token | Valeur | Usage |
| --- | --- | --- |
| `--radius-sm` | `10px` | Inputs, icon-box, boutons secondaires |
| `--radius-md` | `14px` | Cartes (ministères, événements, témoignages) |
| `--radius-lg` | `20px` | Blocs images, encadrés citation |
| `--radius-pill` | `100px` | Boutons principaux, badges, tags |

Cohérent avec la consigne charte « privilégier les formes arrondies et harmonieuses ».

---

## 8. Ombres [dérivé]

| Usage | Valeur |
| --- | --- |
| Carte au repos | `0 4px 16px rgba(28,28,140,0.08)` |
| Carte hover | `0 12px 28px rgba(28,28,140,0.14)` |
| Bouton primaire hover | `0 8px 20px rgba(59,57,255,0.28)` |
| Focus ring inputs | `0 0 0 3px rgba(59,57,255,0.18)` |
| Halo décoratif (logo/rayons) | `0 0 60px rgba(255,106,0,0.25)` |

---

## 9. Animations [dérivé]

### Keyframes

```css
@keyframes apcFadeUp {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes apcGlow {
  0%, 100% { opacity: 0.6; }
  50%      { opacity: 1; }
}
```

### Transitions récurrentes

| Usage | Durée | Easing |
| --- | --- | --- |
| Hover boutons / liens | `0.25s` | `ease` |
| Header au scroll | `0.3s` | `ease` |
| Apparition section au scroll | `0.6s` | `ease-out` |
| Accordéon (FAQ, horaires) | `0.35s` | `ease` |

---

## 10. Composants

### Header

- Fixed, fond blanc/transparent → blanc avec ombre légère au scroll
- Logo (32–40px) + wordmark Poppins 700 uppercase, tracking 0.06em, couleur `--apc-blue-dark`
- Nav desktop : liens Open Sans 600 14.5px, indicateur actif = trait 2px `--apc-blue`
- CTA header : bouton pill `--apc-blue`, texte blanc (ex. "Nous rejoindre" / "Faire un don")
- Mobile (`< 900px`) : hamburger 44×44, menu plein écran ou panneau, fond `--apc-blue-pale`

### Hero

- Fond `--apc-gradient-blue` ou `--apc-blue-dark`, min-height 90vh
- Overline `--apc-blue-light` uppercase 13px
- H1 Poppins 700, blanc, max 16ch
- Sous-titre Open Sans 400, `rgba(255,255,255,0.8)`, max 46ch
- CTA principal : bouton pill `--apc-orange` ou blanc, texte `--apc-blue-dark`
- Élément décoratif : halo/rayons discrets inspirés du logo en arrière-plan

### Section À propos / Vision-Mission

- Fond blanc ou `--apc-blue-pale`
- Overline `--apc-blue`, H2 Poppins 600
- Bloc citation biblique mis en avant : fond `--apc-blue-pale`, bordure gauche 3px `--apc-blue`, radius `--radius-md`

### Section Ministères / Services

- Grille de cartes (2–3 colonnes desktop, 1 mobile)
- Carte : fond blanc, bordure `rgba(28,28,140,0.1)`, radius `--radius-md`, icon-box 40×40 `--apc-blue-pale` radius `--radius-sm`
- Hover : ombre carte hover, légère translation `-4px`

### Section Horaires des cultes

- Fond `--apc-blue-dark` ou `--apc-blue-pale`
- Liste jour / horaire / lieu, séparateurs fins
- Accent jour courant : pastille `--apc-orange`

### Section Prédications / Médias

- Cartes vidéo/audio 16:9, radius `--radius-md`, overlay play button rond `--apc-blue`
- Tag date/série : badge standard

### Section Événements

- Cartes avec date en évidence (bloc carré `--apc-blue-dark`, jour/mois en Poppins 700 blanc)
- Badge "à venir" en `--apc-orange`/`--apc-yellow`

### Section Témoignages

- Carte texte + nom, fond `--apc-blue-pale`, guillemets décoratifs `--apc-blue-light`
- Carrousel ou grille 2–3 colonnes

### Section Don / Soutenir

- Fond `--apc-gradient-blue`
- Message engageant (ton « Engagée » de la charte), CTA pill blanc/orange
- Icônes moyens de don (carte, virement) en ligne blanche

### Section Contact

- Fond blanc ou `--apc-blue-pale`
- Colonne infos (adresse, téléphone, email, icônes 34×34 `--apc-blue-pale` radius `--radius-sm`)
- Formulaire : inputs fond blanc, bordure `rgba(28,28,140,0.14)`, radius `--radius-sm`, focus ring `--apc-blue`
- Bouton submit : `--apc-blue`, hover `--apc-blue-dark`, radius `--radius-pill`

### Footer

- Fond `--apc-blue-dark`, texte `--apc-blue-pale` / blanc
- Logo + baseline, colonnes liens (À propos, Ministères, Événements, Contact), réseaux sociaux
- Séparateur `rgba(255,255,255,0.16)`, copyright 14px

---

## 11. Breakpoints

| Nom | Seuil | Comportement |
| --- | --- | --- |
| Mobile | `< 640px` | 1 colonne, nav plein écran |
| Tablette | `640–900px` | 2 colonnes, nav plein écran |
| Desktop | `≥ 900px` | Nav complète, grilles 2–3 colonnes |

---

## 12. Scrollbar [dérivé]

```css
* { scrollbar-width: thin; scrollbar-color: rgba(28,28,140,0.3) transparent; }
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-thumb { background: rgba(28,28,140,0.3); border-radius: 100px; }
```

Sur fonds foncés :
```css
scrollbar-color: rgba(255,255,255,0.28) transparent;
```

---

## 13. Points à valider avec le client

- Fichier logo source (vecteur) haute résolution + déclinaisons (favicon, monochrome)
- Contenu réel des sections (ministères, horaires de cultes, prédicateurs, moyens de don) — la structure ci-dessus est une proposition basée sur des sites d'église classiques, à confirmer
- Charte typographique web : licences Poppins/Open Sans via Google Fonts (gratuites, déjà compatibles usage web)
