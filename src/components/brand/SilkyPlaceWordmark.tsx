import { cn } from '@/lib/utils'

interface SilkyPlaceWordmarkProps {
  className?: string
  color?: string
  /** Masque le monogramme S+P (ex. dans un pied de page où il ferait doublon). */
  hideMonogram?: boolean
}

/** Tracé du monogramme S+P ("Courbe bis", validé par Clélia le 2026-09-30), simplifié à 0,1 près. */
const MONOGRAM_PATH =
  'M125.2 248C93.2 255.5 60.6 253.4 31.9 221.2C21.5 209.4 13.7 196 8.4 181.1C-5.7 155.4 1.9 121 3.1 115.9C23.8 14.2 141.7 -10.5 185.4 3.7C187.7 4.4 185 12.6 182.7 11.8C141.6 0.5 57.2 23.4 40.3 104.3C38.6 112.1 26.3 169.4 65.2 201.8C99.7 220.9 154.5 201.9 169.6 197C218.8 181.9 260.9 173.5 297.5 214.9C342.6 268.2 323.9 329.2 303.7 360.5C265.7 423.7 174.7 442.1 135.3 428.4C133 427.6 135.8 419.5 138.2 420.4C178.9 432.4 263.9 411 282.3 330.6C284.3 321.9 299.9 255 247.5 224.2C217.7 218.5 167.5 235.9 164.9 236.7C162.4 237.5 160 238.3 157.5 239.1C155.8 244.1 154.2 250 152.6 256.8L89.8 543C89.2 546.1 82.5 578.5 95.6 581.9C106.2 584.7 117.4 585.1 128 587.9L127.7 595.4C117.6 594.9 1.9 589.3 1.9 589.2C1.1 587.5 1.8 582.7 3.6 582.6C27.2 581.5 50.6 590.3 61 541.8L123.8 254.4C124.3 252.2 124.8 250.1 125.2 248Z'

/**
 * Wordmark SilkyPlace : monogramme S+P + "Silky Place" en Cormorant Garamond
 * Italic (OFL), comme le logo vectorisé de référence. Le nom s'écrit
 * "SilkyPlace" en un mot dans le texte courant ; l'espace n'existe que dans
 * le dessin du logo, d'où le texte sr-only lu à la place.
 *
 * Sans `color`, bordeaux de marque (#520C0C) en clair et crème (#F7EFE6) en
 * sombre — jamais --primary (token hérité de l'ancien design system, teinte
 * différente). `color`, s'il est fourni, passe en style inline et l'emporte
 * donc sur toute classe `text-*`. Le monogramme suit via currentColor. La police est imposée inline pour
 * neutraliser le `font-heading` que les appelants passent encore.
 */
export function SilkyPlaceWordmark({ className, color, hideMonogram = false }: SilkyPlaceWordmarkProps) {
  return (
    <span
      className={cn('inline-flex items-center gap-[0.3em]', !color && 'text-[#520C0C] dark:text-[#F7EFE6]', className)}
      style={{ color, lineHeight: 1, fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic', fontWeight: 500 }}
    >
      <span className="sr-only">SilkyPlace</span>
      {!hideMonogram && (
        <svg viewBox="-20 -20 365.3 635.37" aria-hidden="true" style={{ height: '1.25em', width: 'auto', flexShrink: 0 }}>
          <path d={MONOGRAM_PATH} fill="currentColor" />
        </svg>
      )}
      <span aria-hidden="true" style={{ letterSpacing: '0' }}>
        Silky Place
      </span>
    </span>
  )
}
