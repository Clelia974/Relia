import { useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { FEATURE_CARDS } from '@/features/landing/components/FeatureCardsGrid'
import { track } from '@/lib/analytics'
import { cn } from '@/lib/utils'

/**
 * Les fonctionnalités une par une : la VRAIE capture de l'écran dans une
 * fenêtre de navigateur, puis son titre, son bénéfice et une barre de
 * progression segmentée (un segment par fonctionnalité, cliquable) entre deux
 * flèches. Le glissement au doigt et les flèches du clavier passent aussi à
 * l'écran suivant. Même source que la grille de cartes (FEATURE_CARDS).
 */
export function FeatureShowcase() {
  const [active, setActive] = useState(0)
  const touchStartX = useRef<number | null>(null)
  const total = FEATURE_CARDS.length
  const card = FEATURE_CARDS[active]
  const Icon = card.icon

  const go = (index: number) => {
    const next = (index + total) % total
    setActive(next)
    track('Feature View', { name: FEATURE_CARDS[next].title })
  }

  const onTouchEnd = (x: number) => {
    if (touchStartX.current === null) return
    const delta = x - touchStartX.current
    touchStartX.current = null
    if (Math.abs(delta) > 50) go(active + (delta < 0 ? 1 : -1))
  }

  const arrow =
    'flex size-12 shrink-0 items-center justify-center rounded-full border border-border bg-card text-[#520C0C] shadow-(--shadow-card) transition-all hover:bg-[#520C0C] hover:text-[#FBF3EA] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#520C0C]'

  return (
    <div
      className="mx-auto flex w-full max-w-4xl flex-col gap-8"
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') go(active + 1)
        if (e.key === 'ArrowLeft') go(active - 1)
      }}
    >
      {/* Fenêtre de navigateur + capture réelle (1200×800). */}
      <div
        className="overflow-hidden rounded-2xl border border-border bg-card shadow-(--shadow-raised)"
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0].clientX
        }}
        onTouchEnd={(e) => onTouchEnd(e.changedTouches[0].clientX)}
      >
        <div className="flex items-center gap-3 border-b border-border bg-secondary px-4 py-2.5">
          <span className="flex gap-1.5" aria-hidden="true">
            <span className="size-2.5 rounded-full bg-[#E3B7A6]" />
            <span className="size-2.5 rounded-full bg-[#E5D3A5]" />
            <span className="size-2.5 rounded-full bg-[#B9C4A0]" />
          </span>
          <span className="min-w-0 flex-1 truncate rounded-md bg-card px-3 py-1 text-center font-mono text-xs text-muted-foreground">
            silkyplace.evenementscles.com
          </span>
          <span className="hidden items-center gap-1.5 font-mono text-[11px] font-semibold tracking-[0.12em] text-[#520C0C] sm:flex">
            <span className="size-1.5 rounded-full bg-[#520C0C]" aria-hidden="true" />
            ÉCRAN RÉEL
          </span>
        </div>
        <img
          key={card.image}
          src={card.image}
          alt={card.alt}
          width={1200}
          height={800}
          className="h-auto w-full animate-page-in"
        />
      </div>

      {/* Une fonctionnalité + son bénéfice. */}
      <div className="flex items-start gap-5" aria-live="polite">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-[#520C0C]/[0.07] text-[#520C0C]">
          <Icon className="size-6" aria-hidden="true" />
        </span>
        <span className="font-heading text-4xl font-semibold leading-none text-[#520C0C]/30 sm:text-5xl">{active + 1}</span>
        <div className="min-w-0">
          <h3 className="font-heading text-2xl font-semibold text-foreground sm:text-3xl">{card.title}</h3>
          <p className="mt-1 text-sm italic text-[#5F6B4C]">« {card.quote} »</p>
          <p className="mt-2 text-lg leading-snug text-foreground/90">{card.takeaway}</p>
        </div>
      </div>

      {/* Flèches + barre de progression segmentée. */}
      <div className="flex items-center gap-4">
        <button type="button" onClick={() => go(active - 1)} aria-label="Fonctionnalité précédente" className={arrow}>
          <ChevronLeft className="size-5" aria-hidden="true" />
        </button>
        <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
          <ol className="flex w-full gap-1.5" aria-label="Progression">
            {FEATURE_CARDS.map((c, i) => (
              <li key={c.title} className="flex-1">
                <button
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`${i + 1} sur ${total} : ${c.title}`}
                  aria-current={i === active ? 'step' : undefined}
                  className="group flex h-5 w-full items-center"
                >
                  <span
                    className={cn(
                      'h-1 w-full rounded-full transition-colors',
                      i === active ? 'bg-[#520C0C]' : i < active ? 'bg-[#520C0C]/45' : 'bg-[#520C0C]/15 group-hover:bg-[#520C0C]/30',
                    )}
                  />
                </button>
              </li>
            ))}
          </ol>
          <p className="text-xs font-medium tracking-wide text-muted-foreground">
            {active + 1} / {total}
          </p>
        </div>
        <button type="button" onClick={() => go(active + 1)} aria-label="Fonctionnalité suivante" className={arrow}>
          <ChevronRight className="size-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
