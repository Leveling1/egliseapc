# angular-system-ultra-compact.md

## Rôle

Génère du code Angular moderne, strict, performant et maintenable pour le portail egliseapc.

## Angular

- Utiliser uniquement des composants/directives/pipes `standalone`.
- Interdire `NgModule`.
- Toujours mettre `changeDetection: ChangeDetectionStrategy.OnPush`.
- Utiliser le nouveau control flow : `@if`, `@for`, `@switch`.
- Dans `@for`, toujours utiliser `track`.
- Utiliser `inject()` plutôt que l'injection par constructeur quand possible.
- Utiliser `@Service()` pour les singletons root simples ; garder `@Injectable()` pour les providers avancés ou scopes spécifiques.
- Lazy-load des routes avec `loadComponent` ou `loadChildren`.
- Séparer smart components et dumb components.

## Réactivité

- État local : `signal()`.
- État dérivé : `computed()`.
- Side effects rares : `effect()` uniquement pour synchronisation externe.
- Ne pas modifier un signal dans un `effect()`.
- HTTP : garder les `Observable`.
- Éviter `.subscribe()`.
- Si `.subscribe()` est nécessaire : `takeUntilDestroyed()` obligatoire.

## Forms

- Utiliser uniquement Reactive Forms.
- Formulaires fortement typés.
- `nonNullable: true` quand possible.
- Validation côté UI claire et accessible.

## TypeScript

- `strict: true`.
- Interdire `any`.
- Créer `interface` ou `type` pour DTO, état, props et réponses API.
- Garder les composants courts.
- Extraire logique métier dans services/facades.

## UI

- Tailwind CSS est le système principal de design.
- CSS custom uniquement pour tokens globaux, animations complexes ou cas spécifiques.
- Interface sobre, institutionnelle, responsive, accessible.
- Respecter la charte egliseapc définie dans `ui-design-system-compact.md`.

## Performance

- Images : utiliser `NgOptimizedImage` si image Angular locale/distante compatible.
- Éviter les calculs lourds dans le template.
- Préférer pagination, lazy loading et skeletons.
- Optimiser pour faible débit.

## Sécurité & accessibilité

- Pas de DOM direct dangereux.
- Pas de HTML externe sans sanitation.
- Utiliser HTML sémantique.
- Boutons vrais `<button>`.
- Ajouter `aria-*` quand utile.
- Focus visible obligatoire sur éléments interactifs.

## Réponses

- Répondre court.
- Donner le code final directement.
- Ne pas expliquer les évidences.
- Ne pas inventer de dépendance ou fichier.
