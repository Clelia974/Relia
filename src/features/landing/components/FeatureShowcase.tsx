import { useState } from 'react'
import { FEATURE_CARDS } from '@/features/landing/components/FeatureCardsGrid'
import { cn } from '@/lib/utils'

/**
 * Les fonctionnalités sur un ordinateur : la liste à gauche, la VRAIE capture
 * de l'écran choisi dans un cadre de portable à droite. Même source que la
 * grille de cartes (FEATURE_CARDS) — une seule liste à maintenir.
 */
export function FeatureShowcase() {
  const [active, setActive] = useState(0)
  const card = FEATURE_CARDS[active]

  return (
    <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[17rem_1fr]">
      <ul aria-label="Fonctionnalités" className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
        {FEATURE_CARDS.map((c, i) => {
          const Icon = c.icon
          const isActive = i === active
          return (
            <li key={c.title} className="shrink-0 lg:shrink">
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-pressed={isActive}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl border px-4 py-2.5 text-left text-sm font-medium transition-all',
                  isActive
                    ? 'border-[#520C0C]/30 bg-card text-[#520C0C] shadow-(--shadow-card)'
                    : 'border-transparent text-muted-foreground hover:bg-card/70 hover:text-foreground',
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                <span className="whitespace-nowrap lg:whitespace-normal">{c.title}</span>
              </button>
            </li>
          )
        })}
      </ul>

      <div>
        <div className="mx-auto w-full max-w-3xl">
          {/* Écran : cadre sombre arrondi + capture réelle (1200×800). */}
          <div className="rounded-t-2xl border border-black/70 bg-[#1d1d1f] p-2 shadow-(--shadow-raised) sm:p-3">
            <img
              key={card.image}
              src={card.image}
              alt={card.alt}
              width={1200}
              height={800}
              className="h-auto w-full rounded-md bg-card animate-page-in"
            />
          </div>
          {/* Base du portable. */}
          <div aria-hidden="true" className="mx-auto h-3 w-[112%] -translate-x-[5.4%] rounded-b-2xl bg-gradient-to-b from-[#c9c9cc] to-[#a9a9ad] shadow-md" />
        </div>
        <div className="mx-auto mt-8 max-w-xl text-center">
          <p className="text-sm italic text-[#5F6B4C]">« {card.quote} »</p>
          <p className="mt-2 text-lg leading-snug text-foreground/90">{card.takeaway}</p>
        </div>
      </div>
    </div>
  )
}
