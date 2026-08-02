import { ChangeDetectionStrategy, Component } from '@angular/core';

interface GalleryTile {
  readonly label: string;
  readonly gradient: string;
  readonly spanTwoRows?: boolean;
}

@Component({
  selector: 'app-rda-gallery',
  standalone: true,
  templateUrl: './rda-gallery.component.html',
  styleUrl: './rda-gallery.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RdaGalleryComponent {
  protected readonly tiles: readonly GalleryTile[] = [
    { label: 'photo RDA', gradient: 'linear-gradient(135deg,#1C1C8C,#1C1C8C)', spanTwoRows: true },
    { label: 'photo', gradient: 'linear-gradient(135deg,#1C1C8C,rgba(255,255,255,.55))' },
    { label: 'photo', gradient: 'linear-gradient(135deg,#0B0B0B,#1C1C8C)' },
    { label: 'photo', gradient: 'linear-gradient(135deg,rgba(255,255,255,.55),#1C1C8C)' },
    { label: 'photo', gradient: 'linear-gradient(135deg,#1C1C8C,#0B0B0B)' },
  ];
}
