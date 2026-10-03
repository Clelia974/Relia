import { cn } from '@/lib/utils'

interface SilkyPlaceWordmarkProps {
  className?: string
  color?: string
}

/**
 * Wordmark SilkyPlace : "Silky Place" en Cormorant Garamond Italic (OFL),
 * comme le logo vectorisé de référence. Wordmark seul, sans monogramme :
 * le monogramme S+P est réservé au favicon et aux icônes d'application
 * (choix de Clélia). Le nom s'écrit "SilkyPlace" en un mot dans le texte
 * courant ; l'espace n'existe que dans le dessin du logo, d'où le texte
 * sr-only lu à la place.
 *
 * Sans `color`, bordeaux de marque (#520C0C) en clair et crème (#F7EFE6) en
 * sombre — jamais --primary (token hérité de l'ancien design system, teinte
 * différente). `color`, s'il est fourni, passe en style inline et l'emporte
 * donc sur toute classe `text-*`. La police est imposée inline pour
 * neutraliser le `font-heading` que les appelants passent encore.
 *
 * Taille ×1,25 et graisse 600 : le Cormorant a une hauteur d'x bien plus petite
 * que les polices de l'app, à taille égale il paraissait chétif (retour de Clélia).
 */
export function SilkyPlaceWordmark({ className, color }: SilkyPlaceWordmarkProps) {
  void color
  return (
    <span className={cn('inline-flex shrink-0 items-center whitespace-nowrap', className)} style={{ lineHeight: 1 }}>
      <span className="sr-only">SilkyPlace</span>
      <img src="/brand/silkyplace-logo-new-preview.png" alt="" aria-hidden="true" className="h-[1.6em] w-auto dark:hidden" />
      <img src="/brand/silkyplace-logo-new-ivory-preview.png" alt="" aria-hidden="true" className="hidden h-[1.6em] w-auto dark:block" />
    </span>
  )
}
