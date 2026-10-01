import type { ReactNode } from 'react'
import { ArrowRight, Check, X } from 'lucide-react'
import { BORDEAUX_GRADIENT } from '@/features/landing/components/BeforeAfterSection'
import { cn } from '@/lib/utils'

const FOR_YOU = [
  'Tu organises plusieurs mariages en parallèle.',
  'Tu gères toi-même une partie de ton organisation.',
  'Tes tâches, prestataires, matériel et finances sont répartis entre plusieurs outils.',
  'Tu as déjà tes mariages dans un tableur.',
  'Tu veux avoir une vision plus claire du Jour J.',
  'Tu veux pouvoir fermer ton ordinateur sans te demander ce que tu as oublié.',
]

const PILL = 'inline-flex w-fit items-center gap-2 rounded-full px-3.5 py-1.5 font-mono text-xs font-semibold uppercase tracking-[0.12em]'

interface AudienceCardsProps {
  /** Critères « c'est pour toi », affichés en cartes numérotées. */
  items: string[]
  /** Contenu de la carte en pointillés « Pas encore le bon moment / pas pour toi ». */
  notForLabel: string
  notFor: ReactNode
  /** Contenu de la carte bordeaux (texte + appel à l'action). */
  fitLabel: string
  fit: ReactNode
}

/**
 * Critères en cartes numérotées, puis une carte en pointillés (« pas pour
 * toi ») face à une carte bordeaux (« au bon endroit ») — partagé entre la
 * landing et la liste d'attente.
 */
export function AudienceCards({ items, notForLabel, notFor, fitLabel, fit }: AudienceCardsProps) {
  return (
    <div className="flex flex-col gap-6">
      <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, i) => (
          <li key={item} className="relative flex items-start gap-4 rounded-2xl border border-border bg-card p-6 pr-12 shadow-(--shadow-card)">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#520C0C] text-[#DDE6EF]">
              <Check className="size-5" aria-hidden="true" />
            </span>
            <span className="pt-1.5 leading-snug text-foreground">{item}</span>
            <span aria-hidden="true" className="absolute right-5 top-4 font-mono text-xs text-muted-foreground">
              {String(i + 1).padStart(2, '0')}
            </span>
          </li>
        ))}
      </ul>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.45fr]">
        <div className="flex flex-col gap-5 rounded-[2rem] border-2 border-dashed border-border bg-card/60 p-8 sm:p-10">
          <span className={cn(PILL, 'bg-muted text-foreground/80')}>
            <X className="size-3.5" aria-hidden="true" />
            {notForLabel}
          </span>
          <div className="text-lg leading-relaxed text-muted-foreground">{notFor}</div>
        </div>

        <div className={cn('flex flex-col gap-6 rounded-[2rem] p-8 text-[#DDE6EF] shadow-(--shadow-raised) sm:p-10', BORDEAUX_GRADIENT)}>
          <span className={cn(PILL, 'bg-[#DDE6EF] text-[#520C0C]')}>
            <Check className="size-3.5" aria-hidden="true" />
            {fitLabel}
          </span>
          {fit}
        </div>
      </div>
    </div>
  )
}

interface WhoItsForSectionProps {
  ctaLabel: string
  onStart: () => void
}

/** Version landing. */
export function WhoItsForSection({ ctaLabel, onStart }: WhoItsForSectionProps) {
  return (
    <AudienceCards
      items={FOR_YOU}
      notForLabel="Pas encore le bon moment si…"
      notFor={
        <p>
          Tu n’as pas encore de mariage à organiser, ou ton système actuel — carnet, tableur ou autre — fonctionne
          parfaitement pour toi. Et c’est très bien : SilkyPlace n’a pas vocation à ajouter un outil là où tu n’en as pas besoin.
        </p>
      }
      fitLabel="Exactement au bon endroit si…"
      fit={
        <>
          <p className="text-xl leading-relaxed sm:text-2xl">
            Tu jongles entre plusieurs mariages, tes tableurs et tes messages, et tu veux pouvoir fermer ton ordinateur
            sans te demander ce que tu as oublié : <span className="font-semibold text-white">tu es exactement au bon endroit.</span>
          </p>
          <button
            type="button"
            onClick={onStart}
            className="inline-flex w-fit items-center gap-2 rounded-full bg-[#DDE6EF] px-7 py-3.5 text-base font-medium text-[#520C0C] shadow-(--shadow-raised) transition-colors hover:bg-white"
          >
            {ctaLabel}
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        </>
      }
    />
  )
}
