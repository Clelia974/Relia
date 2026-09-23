import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Reformulation courte des PAIN_POINTS / SOLUTION_POINTS existants
 * (landingContent.ts) — même contenu, pas de nouvelle affirmation
 * inventée, juste présenté en comparaison directe plutôt qu'en deux
 * listes séparées.
 */
const AVANT = [
  'Des tâches notées partout : mails, post-it, mémoire',
  'Un budget flou entre devis et coûts réels',
  'Le statut de chaque prestataire, un mystère jusqu’au bout',
]

const APRES = [
  'Tâches, prestataires, matériel et finances au même endroit',
  'Le déroulé du Jour J généré en un instant',
  'Les chevauchements de planning repérés avant qu’ils n’arrivent',
]

function ComparisonList({ items, variant }: { items: string[]; variant: 'avant' | 'apres' }) {
  const isApres = variant === 'apres'
  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-2xl border p-6 sm:p-8',
        isApres ? 'border-transparent bg-primary text-primary-foreground' : 'border-border bg-card',
      )}
    >
      <span
        className={cn(
          'w-fit rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide',
          isApres ? 'bg-primary-foreground/15 text-primary-foreground' : 'bg-muted text-muted-foreground',
        )}
      >
        {isApres ? 'Avec Relia' : 'Sans Relia'}
      </span>
      <ul className="flex flex-col gap-3 text-sm">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-3">
            <span
              className={cn(
                'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full',
                isApres ? 'bg-primary-foreground/15 text-primary-foreground' : 'bg-risk-bg text-risk',
              )}
            >
              {isApres ? <Check className="size-3.5" aria-hidden="true" /> : <X className="size-3.5" aria-hidden="true" />}
            </span>
            <span className={isApres ? 'text-primary-foreground/90' : 'text-foreground'}>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function BeforeAfterSection() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <ComparisonList items={AVANT} variant="avant" />
      <ComparisonList items={APRES} variant="apres" />
    </div>
  )
}
