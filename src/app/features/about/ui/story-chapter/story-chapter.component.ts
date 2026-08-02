import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-story-chapter',
  standalone: true,
  templateUrl: './story-chapter.component.html',
  styleUrl: './story-chapter.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoryChapterComponent {
  readonly chapterNumber = input.required<number>();
  readonly title = input.required<string>();
  readonly paragraphs = input.required<readonly string[]>();
  readonly imagePlaceholderLabel = input.required<string>();
  readonly imageGradient = input.required<string>();
  readonly reversed = input(false);
  readonly background = input<'white' | 'gray'>('white');
}
