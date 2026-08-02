import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

import { HeaderComponent } from '../../../core/layout/header/header.component';
import { FooterComponent } from '../../../core/layout/footer/footer.component';
import { AboutHeroComponent } from '../ui/about-hero/about-hero.component';
import { StoryChapterComponent } from '../ui/story-chapter/story-chapter.component';
import { AboutTodayComponent } from '../ui/about-today/about-today.component';
import { FoundationsComponent } from '../ui/foundations/foundations.component';
import { FoundingVerseComponent } from '../ui/founding-verse/founding-verse.component';

interface StoryChapterData {
  readonly chapterNumber: number;
  readonly title: string;
  readonly paragraphs: readonly string[];
  readonly imagePlaceholderLabel: string;
  readonly imageGradient: string;
  readonly reversed: boolean;
  readonly background: 'white' | 'gray';
}

@Component({
  selector: 'app-about-page',
  standalone: true,
  imports: [
    HeaderComponent,
    FooterComponent,
    AboutHeroComponent,
    StoryChapterComponent,
    AboutTodayComponent,
    FoundationsComponent,
    FoundingVerseComponent,
  ],
  templateUrl: './about-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutPageComponent implements OnInit {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  protected readonly chapters: readonly StoryChapterData[] = [
    {
      chapterNumber: 1,
      title: 'Les Débuts',
      paragraphs: [
        "Tout commence dans le jardin de maman NSONA, une habitante du quartier qui réunissait les adolescents sous une paillote pour prier, chanter et les encadrer. Partant pour l'Europe, elle confie ce petit groupe à mademoiselle Arlette MAYENGA, membre de l'église La Borne, qui s'y attache peu à peu et finit par s'y donner entièrement.",
        "Elle baptise le groupe « Jeunes Ambassadeurs du Christ » (J.A.C.) et sollicite l'aide du frère Garry KENGE, qui y enseigne et l'accompagne dans sa croissance. Mais début 1992, des divergences doctrinales avec maman NSONA poussent le groupe à quitter les lieux.",
      ],
      imagePlaceholderLabel: "photo de la fondation\nde l'église",
      imageGradient: 'linear-gradient(135deg,#1C1C8C,#1C1C8C)',
      reversed: false,
      background: 'white',
    },
    {
      chapterNumber: 2,
      title: "Vers la naissance de l'A.P.C",
      paragraphs: [
        "Le groupe trouve refuge dans un ancien garage de la concession de papa MAZAZA, grâce à l'intercession de sa fille Jeanine. Ne pouvant plus le diriger, sœur Arlette en confie la conduite au frère Garry KENGE, qui accepte après un temps de prière : il donne au groupe une vision nouvelle et le rebaptise « les Ambassadeurs Pour Christ » (A.P.C).",
        'Trois ans plus tard, papa MAZAZA vend sa parcelle et le groupe se retrouve sans lieu où se réunir — certaines réunions de prière se tiennent même dans la rue.',
      ],
      imagePlaceholderLabel: 'photo de la croissance\nde la communauté',
      imageGradient: 'linear-gradient(135deg,#1C1C8C,rgba(255,255,255,.55))',
      reversed: true,
      background: 'gray',
    },
    {
      chapterNumber: 3,
      title: 'Une Identité Affirmée',
      paragraphs: [
        "Le 25 avril 1994, papa MENGI accorde au groupe le droit de se réunir dans sa concession. Le 28 août 1995, l'A.P.C célèbre son tout premier culte dominical — jusqu'alors, le groupe ne se réunissait que les lundis et jeudis, selon le modèle des « groupes de prière » de l'époque.",
        "Sous la conduite du frère Garry KENGE, le groupe affirme son identité et prend le nom d'Église les Ambassadeurs Pour Christ.",
      ],
      imagePlaceholderLabel: "photo de l'expansion\ninternationale",
      imageGradient: 'linear-gradient(135deg,#0B0B0B,#1C1C8C)',
      reversed: false,
      background: 'white',
    },
  ];

  ngOnInit(): void {
    this.title.setTitle('Notre Histoire | Ambassadeurs Pour Christ (A.P.C)');
    this.meta.updateTag({
      name: 'description',
      content:
        "De la fondation à aujourd'hui : l'histoire, la vision et les fondements de l'Église les Ambassadeurs Pour Christ (A.P.C).",
    });
  }
}
