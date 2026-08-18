import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  afterNextRender,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import type Quill from 'quill';

/**
 * Surface de rédaction inspirée de Medium : pas de barre d'outils permanente,
 * mais une barre flottante qui apparaît sur la sélection (thème « bubble »),
 * et un bouton « + » sur les lignes vides pour insérer une image.
 *
 * Adapté de l'éditeur du projet IGF, avec deux différences :
 *  — l'envoi d'image renvoie une promesse plutôt qu'un Observable, ce projet
 *    n'utilisant pas RxJS pour ses appels Supabase ;
 *  — la sortie est du HTML et du texte brut plutôt qu'un Delta Quill, car
 *    c'est le HTML que le site public doit rendre.
 *
 * Quill est importé dynamiquement : il touche `document` dès son chargement,
 * ce qui casserait la compilation du bundle serveur du rendu SSR.
 */
@Component({
  selector: 'app-article-editor',
  standalone: true,
  template: `
    <div class="ae-root" #root>
      <div #editor></div>
    </div>
  `,
  styleUrl: './article-editor.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArticleEditorComponent implements OnDestroy {
  readonly initialHtml = input<string>('');
  readonly placeholder = input<string>('Racontez votre histoire…');
  /** Renvoie le chemin public de l'image envoyée. */
  readonly imageUpload = input<(file: File) => Promise<string>>();

  readonly htmlChange = output<string>();
  /** Texte brut, un paragraphe par entrée : sert à générer le chapô. */
  readonly textChange = output<string[]>();

  private readonly rootEl = viewChild.required<ElementRef<HTMLDivElement>>('root');
  private readonly editorEl = viewChild.required<ElementRef<HTMLDivElement>>('editor');
  private readonly zone = inject(NgZone);

  private quill: Quill | null = null;
  private inserter: HTMLElement | null = null;
  private menu: HTMLElement | null = null;
  private fileInput: HTMLInputElement | null = null;
  private menuOpen = false;
  private outsideHandler: ((event: Event) => void) | null = null;

  constructor() {
    afterNextRender(() => void this.bootstrap());
  }

  private async bootstrap(): Promise<void> {
    const { default: QuillCtor } = await import('quill');

    this.zone.runOutsideAngular(() => {
      this.quill = new QuillCtor(this.editorEl().nativeElement, {
        theme: 'bubble',
        placeholder: this.placeholder(),
        modules: {
          toolbar: [
            ['bold', 'italic'],
            [{ header: 2 }, { header: 3 }],
            ['blockquote', 'link'],
            [{ list: 'ordered' }, { list: 'bullet' }],
          ],
        },
      });

      const html = this.initialHtml();
      if (html) {
        this.quill.clipboard.dangerouslyPasteHTML(html);
      }

      this.quill.on('text-change', () => this.emit());
      this.buildInserter();
      this.quill.on('editor-change', () =>
        requestAnimationFrame(() => this.positionInserter()),
      );
    });
  }

  private emit(): void {
    if (!this.quill) return;

    const html = this.quill.root.innerHTML;
    const paragraphs = this.quill
      .getText()
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean);

    this.zone.run(() => {
      // Quill laisse un paragraphe vide dans un document vierge : on ne veut
      // pas enregistrer ce résidu comme du contenu.
      this.htmlChange.emit(paragraphs.length ? html : '');
      this.textChange.emit(paragraphs);
    });
  }

  /* ---------- Bouton « + » latéral ---------- */

  private buildInserter(): void {
    const root = this.rootEl().nativeElement;

    this.inserter = document.createElement('div');
    this.inserter.className = 'ae-inserter';
    this.inserter.style.display = 'none';

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'ae-inserter__btn';
    toggle.setAttribute('aria-label', 'Insérer un élément');
    toggle.innerHTML =
      '<svg width="19" height="19" viewBox="0 0 19 19"><path d="M9.5 2v15M2 9.5h15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/></svg>';
    toggle.addEventListener('click', (event) => {
      event.stopPropagation();
      if (this.menuOpen) {
        this.closeMenu();
      } else {
        this.openMenu();
      }
    });

    this.menu = document.createElement('div');
    this.menu.className = 'ae-inserter__menu';
    this.menu.style.display = 'none';

    const imageBtn = document.createElement('button');
    imageBtn.type = 'button';
    imageBtn.title = 'Image';
    imageBtn.setAttribute('aria-label', 'Ajouter une image');
    imageBtn.innerHTML =
      '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="18" height="18" rx="2.5"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>';
    imageBtn.addEventListener('click', () => {
      this.fileInput?.click();
      this.closeMenu();
    });

    this.menu.appendChild(imageBtn);
    this.inserter.append(toggle, this.menu);
    root.appendChild(this.inserter);

    this.fileInput = document.createElement('input');
    this.fileInput.type = 'file';
    this.fileInput.accept = 'image/*';
    this.fileInput.style.display = 'none';
    this.fileInput.addEventListener('change', (event) => void this.handleFile(event));
    root.appendChild(this.fileInput);

    this.outsideHandler = (event: Event) => {
      if (this.menuOpen && !this.inserter?.contains(event.target as Node)) this.closeMenu();
    };
    document.addEventListener('mousedown', this.outsideHandler);
  }

  /** Le « + » ne s'affiche que sur une ligne vide, comme sur Medium. */
  private positionInserter(): void {
    if (!this.quill || !this.inserter) return;

    const selection = this.quill.getSelection();
    if (!selection) {
      this.hideInserter();
      return;
    }

    const [line] = this.quill.getLine(selection.index);
    if (!line || line.length() > 1) {
      this.hideInserter();
      return;
    }

    const bounds = this.quill.getBounds(selection.index);
    if (!bounds) {
      this.hideInserter();
      return;
    }

    this.inserter.style.display = 'flex';
    this.inserter.style.top = `${bounds.top}px`;
  }

  private hideInserter(): void {
    if (this.inserter) this.inserter.style.display = 'none';
    this.closeMenu();
  }

  private openMenu(): void {
    if (!this.menu) return;
    this.menuOpen = true;
    this.menu.style.display = 'flex';
  }

  private closeMenu(): void {
    if (!this.menu) return;
    this.menuOpen = false;
    this.menu.style.display = 'none';
  }

  private async handleFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file || !this.quill) return;

    const index = this.quill.getSelection(true)?.index ?? 0;
    const upload = this.imageUpload();

    // Sans fonction d'envoi, on retombe sur une image encodée dans le
    // document : utilisable pour une prévisualisation, mais elle alourdit
    // l'article, d'où l'envoi vers le stockage dès qu'il est disponible.
    const source = upload
      ? await upload(file)
      : await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

    this.quill.insertEmbed(index, 'image', source);
    this.quill.setSelection(index + 1);
  }

  ngOnDestroy(): void {
    if (this.outsideHandler) document.removeEventListener('mousedown', this.outsideHandler);
    this.inserter?.remove();
    this.fileInput?.remove();
    this.quill = null;
  }
}
