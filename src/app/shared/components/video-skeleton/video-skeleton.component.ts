import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Silhouette d'une vidéo en attente de ses données.
 *
 * Même gabarit que la carte qu'elle remplace - vignette 16/9 puis deux lignes
 * de texte - pour que rien ne bouge quand la vraie carte arrive : seule la
 * matière change. Un reflet traverse lentement la silhouette pour dire que
 * quelque chose se passe ; il s'arrête si le visiteur préfère moins de
 * mouvement.
 *
 * `variant` :
 *   'card'     - une carte de la grille (vignette 16/9, titre, date) ;
 *   'featured' - la vidéo à la une, large, légende posée sur la vignette ;
 *   'tile'     - vignette de hauteur fixe (200 px), comme l'accueil.
 */
@Component({
  selector: 'app-video-skeleton',
  standalone: true,
  templateUrl: './video-skeleton.component.html',
  styleUrl: './video-skeleton.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.apc-skeleton--card]': "variant() === 'card'",
    '[class.apc-skeleton--featured]': "variant() === 'featured'",
    '[class.apc-skeleton--tile]': "variant() === 'tile'",
    'aria-hidden': 'true',
  },
})
export class VideoSkeletonComponent {
  readonly variant = input<'card' | 'featured' | 'tile'>('card');
}
