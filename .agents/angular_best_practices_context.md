# Contexte IA — Angular Best Practices pour le front-end egliseapc

> **But du fichier**  
> Ce document sert de contexte de référence pour tout agent IA qui génère, corrige ou refactorise du code Angular pour le front-end du site de egliseapc.  
> L’IA doit produire du code **moderne, typé, maintenable, performant, accessible et sécurisé**, conforme aux pratiques Angular actuelles.

---

## 0. Règle de priorité absolue

Avant de proposer du code, l’IA doit respecter cet ordre de priorité :

1. **Sécurité et intégrité des données**
2. **Accessibilité WCAG 2.1 AA**
3. **Typage strict TypeScript**
4. **Architecture Angular moderne**
5. **Performance et sobriété réseau**
6. **Maintenabilité et lisibilité**
7. **Esthétique UI**

Si une demande utilisateur contredit ce document, l’IA doit signaler le risque et proposer une alternative conforme.

---

## 1. Version cible et philosophie Angular

### Version cible

- Utiliser par défaut les pratiques compatibles avec **Angular 22** pour ce projet.
- Si le projet existant impose une version précise dans `package.json`, respecter cette version.
- Ne pas utiliser d’API expérimentale sauf demande explicite ou preuve que le projet l’utilise déjà.
- Privilégier les API stables : standalone components, signals, signal inputs/queries, typed reactive forms, new control flow, lazy loading, `NgOptimizedImage`, `takeUntilDestroyed`, `@Service()`.

### Philosophie générale

L’IA doit écrire du code Angular :

- simple avant d’être sophistiqué ;
- fortement typé ;
- découpé par responsabilité ;
- facile à tester ;
- optimisé pour des connexions faibles ;
- accessible au clavier et aux lecteurs d’écran ;
- sans logique métier cachée dans les templates ;
- sans dépendance inutile.

---

## 2. Architecture obligatoire

### 2.1 Standalone first

Les composants, directives et pipes doivent être **standalone**.

```ts
@Component({
  selector: 'app-rapport-list',
  standalone: true,
  imports: [
    NgOptimizedImage,
    RapportCardComponent,
    SpinnerComponent
  ],
  templateUrl: './rapport-list.component.html',
  styleUrl: './rapport-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RapportListComponent {}
```

Règles :

- Ne pas créer de nouveaux `NgModule`.
- Ne pas utiliser `AppModule`.
- Utiliser `bootstrapApplication()` dans `main.ts`.
- Importer uniquement les dépendances nécessaires.
- `CommonModule` ne doit pas être importé automatiquement. Avec le nouveau control flow `@if`, `@for`, `@switch`, il n’est pas nécessaire pour les conditions et boucles. L’importer seulement pour des pipes/directives réellement nécessaires.

Exemple `main.ts` attendu :

```ts
bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor]))
  ]
}).catch((error: unknown) => {
  console.error('Erreur de bootstrap Angular', error);
});
```

---

## 3. Structure recommandée du projet

L’IA doit privilégier une structure par **features**, pas une structure uniquement technique.

```txt
src/
  app/
    core/
      api/
      guards/
      interceptors/
      layout/
      services/
      tokens/
    shared/
      components/
      directives/
      pipes/
      utils/
    features/
      rapports/
        data-access/
        models/
        pages/
        ui/
      signalements/
        data-access/
        models/
        pages/
        ui/
      rendez-vous/
        data-access/
        models/
        pages/
        ui/
    app.component.ts
    app.routes.ts
  assets/
  environments/
```

### Responsabilités

- `core/` : services singleton, interceptors, guards, configuration globale.
- `shared/` : composants UI réutilisables sans logique métier.
- `features/` : logique fonctionnelle par domaine.
- `data-access/` : accès API, repositories, mapping DTO → modèle applicatif.
- `models/` : interfaces, types, enums propres à la feature.
- `pages/` : composants conteneurs routés.
- `ui/` : composants de présentation.

---

## 4. Smart components et UI components

### 4.1 Composants conteneurs

Les composants conteneurs peuvent :

- appeler les services ;
- lire les paramètres de route ;
- gérer l’état local de la page ;
- orchestrer les composants enfants ;
- gérer les erreurs et états de chargement.

Ils ne doivent pas contenir de HTML complexe ou fortement répété.

### 4.2 Composants de présentation

Les composants de présentation doivent :

- recevoir les données via `input()` ;
- émettre les événements via `output()` ;
- ne pas injecter de service métier ;
- être faciles à réutiliser ;
- être compatibles `OnPush`.

Exemple :

```ts
@Component({
  selector: 'app-rapport-card',
  standalone: true,
  imports: [DatePipe, NgOptimizedImage],
  templateUrl: './rapport-card.component.html',
  styleUrl: './rapport-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RapportCardComponent {
  readonly rapport = input.required<Rapport>();
  readonly openRapport = output<string>();

  protected onOpen(): void {
    this.openRapport.emit(this.rapport().id);
  }
}
```

---

## 5. Typage TypeScript strict

### Règles non négociables

- `strict: true`
- `noImplicitAny: true`
- `strictTemplates: true`
- Pas de `any`.
- Pas de `unknown` laissé sans narrowing.
- Pas de `as Type` utilisé pour masquer une erreur de typage.
- Pas de propriété publique inutile.
- Préférer `readonly` dès qu’une valeur n’est pas réassignée.
- Utiliser `interface` pour les formes d’objets extensibles.
- Utiliser `type` pour les unions, helpers et types dérivés.

### Interdiction de `any`

Mauvais :

```ts
function mapRapport(data: any): Rapport {
  return data;
}
```

Correct :

```ts
interface RapportDto {
  id: string;
  titre: string;
  date_publication: string;
  fichier_url: string;
}

interface Rapport {
  id: string;
  titre: string;
  datePublication: Date;
  fichierUrl: string;
}

function mapRapport(dto: RapportDto): Rapport {
  return {
    id: dto.id,
    titre: dto.titre,
    datePublication: new Date(dto.date_publication),
    fichierUrl: dto.fichier_url
  };
}
```

---

## 6. Signals, RxJS et gestion d’état

### 6.1 Règle générale

- Utiliser **Signals** pour l’état local, l’état dérivé et le rendu.
- Utiliser **RxJS** pour les flux asynchrones, HTTP, événements complexes, debounce, retry, cancellation.
- Ne pas transformer tout le projet en store global si l’état est local à une page.

### 6.2 Signals

Utiliser :

- `signal<T>()` pour l’état mutable local ;
- `computed()` pour les données dérivées ;
- `effect()` uniquement pour synchroniser avec un système externe.

Exemple :

```ts
readonly searchTerm = signal('');
readonly selectedType = signal<RapportType | 'all'>('all');

readonly filteredRapports = computed(() => {
  const term = this.searchTerm().trim().toLowerCase();
  const type = this.selectedType();

  return this.rapports().filter((rapport) => {
    const matchesTerm = rapport.titre.toLowerCase().includes(term);
    const matchesType = type === 'all' || rapport.type === type;

    return matchesTerm && matchesType;
  });
});
```

### 6.3 Effets

`effect()` ne doit pas servir à propager artificiellement des valeurs entre signaux.

Accepté :

```ts
effect(() => {
  localStorage.setItem('theme', this.theme());
});
```

Interdit :

```ts
effect(() => {
  this.total.set(this.items().length);
});
```

Faire plutôt :

```ts
readonly total = computed(() => this.items().length);
```

### 6.4 RxJS

Règles :

- Ne pas faire de `.subscribe()` manuel pour afficher des données.
- Utiliser `async` pipe dans les templates ou `toSignal()` dans le TypeScript.
- Si un abonnement manuel est indispensable, utiliser `takeUntilDestroyed()`.
- Utiliser `switchMap` pour les recherches et filtres qui annulent la requête précédente.
- Utiliser `catchError` pour convertir les erreurs en état exploitable.
- Utiliser `shareReplay({ bufferSize: 1, refCount: true })` pour éviter les requêtes dupliquées lorsque c’est nécessaire.

Exemple `toSignal()` :

```ts
private readonly route = inject(ActivatedRoute);
private readonly rapportService = inject(RapportService);

readonly rapportId = toSignal(
  this.route.paramMap.pipe(
    map((params) => params.get('id')),
    filter((id): id is string => id !== null)
  ),
  { initialValue: '' }
);
```

Exemple abonnement manuel accepté :

```ts
constructor() {
  this.form.valueChanges
    .pipe(takeUntilDestroyed())
    .subscribe((value) => {
      this.draftStorage.save(value);
    });
}
```

---

## 7. Requêtes HTTP et couche data-access

### 7.1 Services API

Les appels HTTP doivent être isolés dans des services `data-access`.

Convention Angular 22 :

- Utiliser `@Service()` pour les singletons root simples qui utilisent `inject()`.
- Garder `@Injectable()` pour l'injection par constructeur, les scopes non-root ou les providers avancés (`useClass`, `useValue`, `useExisting`, `useFactory`, etc.).

```ts
@Service()
export class RapportApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  getRapports(): Observable<Rapport[]> {
    return this.http
      .get<RapportDto[]>(`${this.apiUrl}/rapports`)
      .pipe(map((dtos) => dtos.map(mapRapport)));
  }
}
```

Règles :

- Ne jamais appeler `HttpClient` directement depuis un composant UI.
- Typage obligatoire des DTO.
- Mapper les DTO backend vers des modèles frontend.
- Ne pas exposer la structure brute de l’API dans toute l’application.
- Centraliser les headers, auth tokens et gestion d’erreur via interceptors.

### 7.2 Erreurs API

L’IA doit toujours prévoir :

- état de chargement ;
- état vide ;
- état erreur ;
- retry si pertinent ;
- message utilisateur clair.

Exemple de modèle :

```ts
type ResourceState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'empty' }
  | { status: 'error'; message: string };
```

---

## 8. Routing moderne

### 8.1 Routes lazy-loaded

Chaque feature doit être chargée paresseusement.

```ts
export const routes: Routes = [
  {
    path: 'rapports',
    loadComponent: () =>
      import('./features/rapports/pages/rapport-list-page.component')
        .then((m) => m.RapportListPageComponent)
  },
  {
    path: 'signalement',
    loadChildren: () =>
      import('./features/signalements/signalement.routes')
        .then((m) => m.SIGNALEMENT_ROUTES)
  }
];
```

### 8.2 Guards

- Les guards doivent être fonctionnels.
- Ne pas créer de classes guard sauf contrainte legacy.

```ts
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.isAuthenticated()
    ? true
    : router.createUrlTree(['/connexion']);
};
```

### 8.3 Navigation

- Utiliser `RouterLink`, jamais `window.location.href` pour la navigation interne.
- Préserver les query params si l’utilisateur filtre des listes.
- Les pages institutionnelles importantes doivent avoir des URLs propres et partageables.

---

## 9. Templates Angular

### 9.1 Nouveau control flow obligatoire

Utiliser :

- `@if`
- `@else`
- `@for`
- `@empty`
- `@switch`
- `@defer`

Ne pas utiliser pour du nouveau code :

- `*ngIf`
- `*ngFor`
- `*ngSwitch`

Exemple :

```html
@if (state().status === 'loading') {
  <app-spinner label="Chargement des rapports" />
} @else if (state().status === 'error') {
  <app-error-message [message]="state().message" />
} @else if (state().status === 'success') {
  <section class="rapports-grid" aria-label="Liste des rapports">
    @for (rapport of state().data; track rapport.id) {
      <app-rapport-card
        [rapport]="rapport"
        (openRapport)="onOpenRapport($event)"
      />
    } @empty {
      <p>Aucun rapport disponible.</p>
    }
  </section>
}
```

### 9.2 Règle `track`

Dans `@for`, `track` est obligatoire.

Correct :

```html
@for (rapport of rapports(); track rapport.id) {
  <app-rapport-card [rapport]="rapport" />
}
```

Interdit :

```html
@for (rapport of rapports()) {
  <app-rapport-card [rapport]="rapport" />
}
```

### 9.3 Templates légers

Interdits dans les templates :

- appels de fonctions coûteuses ;
- logique métier complexe ;
- `filter`, `map`, `sort` directement dans le HTML ;
- calculs répétitifs ;
- accès DOM direct.

Utiliser `computed()` côté TypeScript.

---

## 10. Performance

Le site egliseapc doit rester fluide sur mobile et en faible débit.

### 10.1 Change detection

Tous les composants doivent utiliser :

```ts
changeDetection: ChangeDetectionStrategy.OnPush
```

### 10.2 Images

Utiliser `NgOptimizedImage`.

```html
<img
  ngSrc="/assets/images/young-solver-building.webp"
  width="1200"
  height="675"
  alt="Projet de egliseapc"
  priority
/>
```

Règles :

- Ne pas utiliser `<img src="...">` pour les images applicatives.
- Toujours définir `width`, `height` et `alt`.
- Utiliser `priority` uniquement pour l’image principale au-dessus de la ligne de flottaison.
- Préférer WebP/AVIF lorsque possible.
- Ne pas charger de grandes images non visibles immédiatement.

### 10.3 Chargement différé

Utiliser `@defer` pour les sections lourdes :

```html
@defer (on viewport) {
  <app-rapport-statistics />
} @placeholder {
  <app-card-skeleton />
} @loading {
  <app-spinner label="Chargement des statistiques" />
}
```

Utiliser `@defer` pour :

- graphiques ;
- cartes ;
- tableaux lourds ;
- lecteurs PDF ;
- sections administratives secondaires.

Ne pas utiliser `@defer` pour le contenu critique SEO ou le premier écran essentiel.

### 10.4 Bundle

- Lazy loading obligatoire par feature.
- Éviter les bibliothèques lourdes pour des besoins simples.
- Importer uniquement ce qui est utilisé.
- Préférer des composants légers et spécialisés.
- Vérifier les dépendances avant d’en ajouter une.

---

## 11. Formulaires

### 11.1 Reactive forms obligatoires

Interdit :

- `FormsModule`
- `ngModel`
- formulaires template-driven pour les workflows métier

Obligatoire :

- Reactive Forms
- formulaires fortement typés
- validateurs synchrones côté client
- validation serveur côté backend
- messages d’erreur accessibles

Exemple :

```ts
interface ContactForm {
  nom: FormControl<string>;
  email: FormControl<string>;
  message: FormControl<string>;
}

readonly form = new FormGroup<ContactForm>({
  nom: new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(2)]
  }),
  email: new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.email]
  }),
  message: new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(10)]
  })
});
```

Template accessible :

```html
<label for="email">Adresse e-mail</label>
<input
  id="email"
  type="email"
  formControlName="email"
  autocomplete="email"
  aria-describedby="email-error"
/>

@if (form.controls.email.invalid && form.controls.email.touched) {
  <p id="email-error" class="field-error">
    Veuillez saisir une adresse e-mail valide.
  </p>
}
```

### 11.2 Soumission

Règles :

- Ne jamais soumettre si `form.invalid`.
- Marquer les champs comme touchés en cas d’erreur.
- Désactiver le bouton pendant l’envoi.
- Prévoir succès, erreur et retry.
- Ne jamais faire confiance uniquement à la validation front-end.

---

## 12. Sécurité

### 12.1 XSS

Interdit :

```ts
this.elementRef.nativeElement.innerHTML = html;
```

Règles :

- Ne jamais manipuler `innerHTML` via DOM natif.
- Utiliser les bindings Angular.
- Éviter `[innerHTML]` sauf nécessité réelle.
- Si HTML externe vérifié : sanitization stricte.
- `DomSanitizer.bypassSecurityTrustHtml()` doit être exceptionnel, justifié et isolé dans un service.

### 12.2 Données sensibles

- Ne jamais stocker de token sensible en clair si une alternative plus sûre est disponible.
- Ne pas afficher les erreurs backend brutes à l’utilisateur.
- Ne pas logger des données personnelles en production.
- Ne pas exposer les clés privées ou secrets dans le front-end.
- Ne pas inclure de secret dans `environment.ts`.

### 12.3 HTTP

- Utiliser HTTPS.
- Centraliser auth et erreurs dans des interceptors.
- Prévoir timeout/retry uniquement si pertinent.
- Ne pas répéter les headers dans chaque service.

---

## 13. Accessibilité WCAG 2.1 AA

Chaque composant généré doit être utilisable :

- au clavier ;
- avec lecteur d’écran ;
- sur mobile ;
- avec zoom navigateur ;
- en contraste suffisant.

### Règles HTML

- Utiliser les balises sémantiques : `header`, `nav`, `main`, `section`, `article`, `footer`.
- Utiliser `<button>` pour une action, `<a>` pour une navigation.
- Ne jamais mettre un `click` sur une `div` sans rôle, tabindex et gestion clavier.
- Chaque champ de formulaire doit avoir un `label`.
- Chaque image informative doit avoir un `alt`.
- Chaque icône décorative doit être masquée avec `aria-hidden="true"`.
- Les composants interactifs doivent gérer `aria-expanded`, `aria-controls`, `aria-current`, `aria-describedby` si nécessaire.

### Focus

- Le focus doit rester visible.
- Les modales doivent piéger le focus.
- Les menus déroulants doivent être navigables au clavier.
- Après une action importante, déplacer le focus si cela améliore la compréhension.

---

## 14. UI, styles et design system

### 14.1 SCSS / CSS

Règles :

- Ne pas utiliser `::ng-deep`.
- Ne pas créer de styles globaux non contrôlés.
- Respecter `ViewEncapsulation.Emulated`.
- Utiliser des design tokens.
- Préférer des classes utilitaires ou composants UI cohérents.
- Éviter les valeurs magiques répétées.

Exemple de tokens :

```scss
:root {
  --color-primary: #006b3f;
  --color-primary-dark: #004f2f;
  --color-accent: #f5c542;
  --color-surface: #ffffff;
  --color-text: #1f2933;
  --radius-md: 0.75rem;
  --shadow-card: 0 12px 30px rgb(15 23 42 / 8%);
}
```

### 14.2 Composants

- Éviter les composants géants.
- Un composant = une responsabilité.
- Factoriser les patterns répétés.
- Garder les inputs explicites.
- Ne pas transformer un composant UI simple en composant métier.

---

## 15. SEO, SSR et contenu institutionnel

Pour un site institutionnel, l’IA doit penser SEO et partage social.

### Règles

- Chaque page publique doit avoir un titre clair.
- Mettre à jour les meta descriptions.
- Prévoir Open Graph si la page est partageable.
- Utiliser des URLs lisibles.
- Éviter les contenus essentiels uniquement chargés côté client.
- Préférer SSR/SSG/prerendering pour les pages publiques stables.
- Les pages comme Accueil, Rapports, Communiqués, Contact doivent être indexables.

Exemple :

```ts
private readonly title = inject(Title);
private readonly meta = inject(Meta);

setSeo(): void {
  this.title.setTitle('Rapports publics | Inspection Générale des Finances');
  this.meta.updateTag({
    name: 'description',
    content: 'Consultez les rapports publics publiés par l’Inspection Générale des Finances.'
  });
}
```

---

## 16. Tests

L’IA doit proposer du code testable et, si demandé, fournir les tests.

### Tests unitaires

À tester :

- services ;
- mappers DTO ;
- guards ;
- validators ;
- composants critiques ;
- comportements de formulaires.

### Bonnes pratiques

- Ne pas tester les détails internes inutiles.
- Tester le comportement visible.
- Mock des services API.
- Tester les états loading, empty, error, success.
- Tester les composants de formulaire avec erreurs de validation.

Exemple :

```ts
describe('mapRapport', () => {
  it('maps RapportDto to Rapport', () => {
    const dto: RapportDto = {
      id: '1',
      titre: 'Rapport annuel',
      date_publication: '2026-07-01',
      fichier_url: '/files/rapport.pdf'
    };

    expect(mapRapport(dto)).toEqual({
      id: '1',
      titre: 'Rapport annuel',
      datePublication: new Date('2026-07-01'),
      fichierUrl: '/files/rapport.pdf'
    });
  });
});
```

---

## 17. Règles de génération de code pour l’IA

Quand l’utilisateur demande du code Angular, l’IA doit :

1. Identifier la feature concernée.
2. Proposer les fichiers à créer/modifier.
3. Donner le code par fichier.
4. Utiliser des composants standalone.
5. Ajouter les imports nécessaires.
6. Utiliser `ChangeDetectionStrategy.OnPush`.
7. Utiliser `input()` / `output()` pour les composants UI.
8. Utiliser Signals pour l’état local.
9. Utiliser RxJS proprement pour les appels HTTP.
10. Prévoir loading, empty, error et success.
11. Respecter l’accessibilité.
12. Éviter tout `any`.
13. Ne pas inventer de structure backend non demandée.
14. Signaler toute hypothèse importante.

Format recommandé :

```txt
Fichiers concernés :
- src/app/features/rapports/pages/rapport-list-page.component.ts
- src/app/features/rapports/pages/rapport-list-page.component.html
- src/app/features/rapports/data-access/rapport-api.service.ts
- src/app/features/rapports/models/rapport.model.ts
```

---

## 18. Anti-patterns interdits

L’IA ne doit pas générer :

```ts
// any
let data: any;

// subscribe sans nettoyage
this.http.get('/api').subscribe();

// composant sans OnPush
@Component({ ... })

// accès DOM direct
document.querySelector('.modal')?.classList.add('open');

// navigation interne via window
window.location.href = '/rapports';

// logique métier dans le template
{{ rapports().filter(...).sort(...).map(...) }}

// NgModule pour nouvelle feature
@NgModule({ ... })

// ngModel pour formulaire métier
<input [(ngModel)]="email" />

// ancienne syntaxe de contrôle pour nouveau code
<div *ngIf="isOpen">...</div>
<li *ngFor="let item of items">...</li>
```

---

## 19. Checklist avant de valider une réponse IA

Avant de livrer une réponse, l’IA doit vérifier :

- [ ] Aucun `any`.
- [ ] Aucun nouveau `NgModule`.
- [ ] Composants standalone.
- [ ] `ChangeDetectionStrategy.OnPush`.
- [ ] `input()` / `output()` utilisés dans les composants de présentation.
- [ ] `@if`, `@for`, `@empty`, `@switch` au lieu de `*ngIf`, `*ngFor`, `*ngSwitch`.
- [ ] `track` présent dans chaque `@for`.
- [ ] Pas de `.subscribe()` manuel sans `takeUntilDestroyed()`.
- [ ] Pas de logique métier lourde dans le HTML.
- [ ] États loading / empty / error / success prévus.
- [ ] Images avec `NgOptimizedImage`, `width`, `height`, `alt`.
- [ ] Formulaires réactifs et typés.
- [ ] Accessibilité clavier prise en compte.
- [ ] Sécurité XSS respectée.
- [ ] `@Service()` utilisé pour les singletons root simples ; `@Injectable()` seulement quand sa configuration avancée est nécessaire.
- [ ] Services API isolés dans `data-access`.
- [ ] Mappers DTO → modèles applicatifs.
- [ ] Routes lazy-loaded si feature.
- [ ] Code lisible, court et maintenable.

---

## 20. Exemple complet minimal

### `rapport.model.ts`

```ts
export interface RapportDto {
  id: string;
  titre: string;
  date_publication: string;
  fichier_url: string;
}

export interface Rapport {
  id: string;
  titre: string;
  datePublication: Date;
  fichierUrl: string;
}

export function mapRapport(dto: RapportDto): Rapport {
  return {
    id: dto.id,
    titre: dto.titre,
    datePublication: new Date(dto.date_publication),
    fichierUrl: dto.fichier_url
  };
}
```

### `rapport-api.service.ts`

```ts
@Service()
export class RapportApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  getRapports(): Observable<Rapport[]> {
    return this.http
      .get<RapportDto[]>(`${this.apiUrl}/rapports`)
      .pipe(map((dtos) => dtos.map(mapRapport)));
  }
}
```

### `rapport-list-page.component.ts`

```ts
@Component({
  selector: 'app-rapport-list-page',
  standalone: true,
  imports: [RapportCardComponent, SpinnerComponent, ErrorMessageComponent],
  templateUrl: './rapport-list-page.component.html',
  styleUrl: './rapport-list-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RapportListPageComponent {
  private readonly rapportApi = inject(RapportApiService);

  readonly searchTerm = signal('');

  private readonly rapportsResource = toSignal(
    this.rapportApi.getRapports().pipe(
      map((rapports): ResourceState<Rapport[]> => {
        return rapports.length > 0
          ? { status: 'success', data: rapports }
          : { status: 'empty' };
      }),
      startWith({ status: 'loading' } satisfies ResourceState<Rapport[]>),
      catchError(() =>
        of({
          status: 'error',
          message: 'Impossible de charger les rapports pour le moment.'
        } satisfies ResourceState<Rapport[]>)
      )
    ),
    { initialValue: { status: 'idle' } satisfies ResourceState<Rapport[]> }
  );

  readonly state = computed(() => this.rapportsResource());

  readonly filteredRapports = computed(() => {
    const state = this.state();

    if (state.status !== 'success') {
      return [];
    }

    const term = this.searchTerm().trim().toLowerCase();

    return state.data.filter((rapport) =>
      rapport.titre.toLowerCase().includes(term)
    );
  });

  onSearch(value: string): void {
    this.searchTerm.set(value);
  }
}
```

### `rapport-list-page.component.html`

```html
<main class="page">
  <header class="page__header">
    <h1>Rapports publics</h1>
    <p>Consultez les rapports publiés par l’Inspection Générale des Finances.</p>
  </header>

  <section aria-label="Recherche de rapports">
    <label for="rapport-search">Rechercher un rapport</label>
    <input
      #rapportSearchInput
      id="rapport-search"
      type="search"
      [value]="searchTerm()"
      (input)="onSearch(rapportSearchInput.value)"
      placeholder="Titre du rapport"
    />
  </section>

  @if (state().status === 'loading' || state().status === 'idle') {
    <app-spinner label="Chargement des rapports" />
  } @else if (state().status === 'error') {
    <app-error-message [message]="state().message" />
  } @else if (state().status === 'empty') {
    <p>Aucun rapport disponible.</p>
  } @else {
    <section class="rapports-grid" aria-label="Liste des rapports publics">
      @for (rapport of filteredRapports(); track rapport.id) {
        <app-rapport-card [rapport]="rapport" />
      } @empty {
        <p>Aucun rapport ne correspond à votre recherche.</p>
      }
    </section>
  }
</main>
```

---

## 21. Règle finale

L’IA doit refuser ou corriger toute proposition qui :

- introduit `any` ;
- crée un nouveau `NgModule` ;
- utilise `*ngIf` / `*ngFor` dans du nouveau code ;
- oublie `track` dans `@for` ;
- ignore l’accessibilité ;
- manipule le DOM directement ;
- mélange accès API, logique métier et UI dans un seul composant ;
- ne prévoit pas les états d’erreur ou de chargement ;
- produit du code qui fonctionne seulement dans le cas nominal.

Le bon code Angular n’est pas seulement du code qui compile. C’est du code qui reste fiable, lisible, sécurisé et maintenable lorsque le projet grandit.
