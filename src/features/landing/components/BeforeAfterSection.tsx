import { ArrowRight, Check, X } from 'lucide-react'
import { AFTER_GROUPS, BEFORE_GROUPS } from '@/features/landing/landingContent'
import { cn } from '@/lib/utils'

/** Dégradé bordeaux de marque (mêmes teintes que l'icône d'app SilkyPlace). */
export const BORDEAUX_GRADIENT = 'bg-[linear-gradient(135deg,#3A0707_0%,#520C0C_55%,#7A1F1F_100%)]'

export interface ComparisonRow {
  /** Début en gras (ex. le verbe « Tu cherches. ») — facultatif. */
  lead?: string
  text: string
}

export interface ComparisonSide {
  label: string
  title: string
  subtitle?: string
  rows: ComparisonRow[]
}

/**
 * Une carte « Avant » ou « Après » : pastille, titre, sous-titre, puis une
 * liste blanche avec une croix (avant) ou une coche (après) par ligne.
 */
function ComparisonCard({ side, isApres }: { side: ComparisonSide; isApres: boolean }) {
  return (
    <div
      className={cn(
        'flex flex-col gap-6 rounded-[2rem] p-7 sm:p-10',
        isApres ? cn(BORDEAUX_GRADIENT, 'text-[#DDE6EF] shadow-(--shadow-raised)') : 'border border-border bg-[#EEF2F7]',
      )}
    >
      <span
        className={cn(
          'w-fit rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em]',
          isApres ? 'bg-[#DDE6EF] text-[#520C0C]' : 'bg-[#520C0C]/[0.08] text-[#520C0C]',
        )}
      >
        {side.label}
      </span>
      <div>
        <p className={cn('font-heading text-3xl font-semibold tracking-tight sm:text-4xl', isApres ? 'text-white' : 'text-foreground')}>{side.title}</p>
        {side.subtitle && <p className={cn('mt-2', isApres ? 'text-[#DDE6EF]/75' : 'text-muted-foreground')}>{side.subtitle}</p>}
      </div>
      <ul className="flex flex-col divide-y divide-border rounded-2xl bg-card px-6 shadow-(--shadow-card) sm:px-7">
        {side.rows.map((row) => (
          <li key={(row.lead ?? '') + row.text} className="flex items-start gap-4 py-5">
            <span
              className={cn(
                'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full',
                isApres ? 'bg-[#A9B08F]/25 text-[#5F6B4C]' : 'bg-[#520C0C]/[0.07] text-[#520C0C]',
              )}
            >
              {isApres ? <Check className="size-4" aria-hidden="true" /> : <X className="size-4" aria-hidden="true" />}
            </span>
            <p className="leading-relaxed">
              {row.lead && <span className="font-semibold text-foreground">{row.lead} </span>}
              <span className={isApres ? 'text-foreground/80' : 'text-muted-foreground'}>{row.text}</span>
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Les deux cartes côte à côte, avec la flèche de passage au milieu (desktop). */
export function ComparisonPanels({ before, after }: { before: ComparisonSide; after: ComparisonSide }) {
  return (
    <div className="relative grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-10">
      <ComparisonCard side={before} isApres={false} />
      <span
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 z-10 hidden size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#DDE6EF] text-[#520C0C] shadow-(--shadow-raised) ring-8 ring-background md:flex"
      >
        <ArrowRight className="size-6" />
      </span>
      <ComparisonCard side={after} isApres />
    </div>
  )
}

const toRows = (groups: typeof BEFORE_GROUPS): ComparisonRow[] => groups.map((g) => ({ lead: g.verb, text: g.items.join(' ') }))

/** Version landing : les groupes « Tu cherches. / Tu vois. »… de Clélia. */
export function BeforeAfterSection() {
  return (
    <ComparisonPanels
      before={{ label: 'Avant', title: 'Sans SilkyPlace', subtitle: 'Éparpillé entre tes outils et ta mémoire.', rows: toRows(BEFORE_GROUPS) }}
      after={{ label: 'Après', title: 'Avec SilkyPlace', subtitle: 'Tout au même endroit, sans tout garder en tête.', rows: toRows(AFTER_GROUPS) }}
    />
  )
}
