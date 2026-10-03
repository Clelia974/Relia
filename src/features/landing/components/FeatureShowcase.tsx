import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { FEATURE_CARDS } from '@/features/landing/components/FeatureCardsGrid'
import { cn } from '@/lib/utils'

/**
 * Les fonctionnalités en visite guidée : la VRAIE capture de l'écran choisi
 * dans un cadre de portable, avec des flèches (et le glissement au doigt)
 * pour passer d'un écran à l'autre, et la rangée des fonctionnalités qui
 * défile horizontalement en dessous. Même source que la grille de cartes
 * (FEATURE_CARDS) — une seule liste à maintenir.
 */
export function FeatureShowcase() {
  const [active, setActive] = useState(0)
  const touchStartX = useRef<number | null>(null)
  const chipRefs = useRef<(HTMLButtonElement | null)[]>([])
  const total = FEATURE_CARDS.length
  const card = FEATURE_CARDS[active]

  const go = (index: number) => setActive((index + total) % total)

  // La puce active reste visible dans la rangée qui défile.
  useEffect(() => {
    chipRefs.current[active]?.scrollIntoView?.({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [active])

  const onTouchEnd = (x: number) => {
    if (touchStartX.current === null) return
    const delta = x - touchStartX.current
    touchStartX.current = null
    if (Math.abs(delta) > 50) go(active + (delta < 0 ? 1 : -1))
  }

  return (
    <div
      className="flex flex-col gap-8"
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') go(active + 1)
        if (e.key === 'ArrowLeft') go(active - 1)
      }}
    >
      <div className="relative mx-auto flex w-full max-w-5xl items-center gap-2 sm:gap-4">
        <button
          type="button"
          onClick={() => go(active - 1)}
          aria-label="Écran précédent"
          className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-card text-[#520C0C] shadow-(--shadow-card) transition-all hover:shadow-(--shadow-raised) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#520C0C]"
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
        </button>

        <div
          className="min-w-0 flex-1"
          onTouchStart={(e) => {
            touchStartX.current = e.touches[0].clientX
          }}
          onTouchEnd={(e) => onTouchEnd(e.changedTouches[0].clientX)}
        >
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
          <div aria-hidden="true" className="mx-auto h-3 w-[108%] -translate-x-[3.7%] rounded-b-2xl bg-gradient-to-b from-[#c9c9cc] to-[#a9a9ad] shadow-md" />
        </div>

        <button
          type="button"
          onClick={() => go(active + 1)}
          aria-label="Écran suivant"
          className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-card text-[#520C0C] shadow-(--shadow-card) transition-all hover:shadow-(--shadow-raised) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#520C0C]"
        >
          <ChevronRight className="size-5" aria-hidden="true" />
        </button>
      </div>

      <div className="mx-auto max-w-xl text-center" aria-live="polite">
        <p className="text-sm italic text-[#5F6B4C]">« {card.quote} »</p>
        <p className="mt-2 text-lg leading-snug text-foreground/90">{card.takeaway}</p>
        <p className="mt-3 text-xs font-medium tracking-wide text-muted-foreground">
          {active + 1} / {total}
        </p>
      </div>

      <ul aria-label="Fonctionnalités" className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-2 [scrollbar-width:none] sm:mx-0 sm:justify-center sm:px-0 sm:[flex-wrap:wrap] [&::-webkit-scrollbar]:hidden">
        {FEATURE_CARDS.map((c, i) => {
          const Icon = c.icon
          const isActive = i === active
          return (
            <li key={c.title} className="shrink-0">
              <button
                type="button"
                ref={(el) => {
                  chipRefs.current[i] = el
                }}
                onClick={() => go(i)}
                aria-pressed={isActive}
                className={cn(
                  'flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium whitespace-nowrap transition-all',
                  isActive
                    ? 'border-[#520C0C] bg-[#520C0C] text-[#FBF3EA]'
                    : 'border-border bg-card text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                {c.title}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
