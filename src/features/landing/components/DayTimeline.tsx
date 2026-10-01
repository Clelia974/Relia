import { useState } from 'react'
import { ArrowRight, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface DayMoment {
  time: string
  text: string
}

interface DayTimelineProps {
  moments: DayMoment[]
  /** Phrase révélée une fois la dernière heure atteinte. */
  conclusion: string
}

/**
 * « À quel moment ta journée finit vraiment ? » — frise horizontale
 * interactive : chaque heure est un bouton sur le fil, la suivante pulse
 * doucement pour inviter au clic, et la conclusion n'apparaît qu'en fin de
 * journée. Une colonne par heure, même en largeur téléphone (pas de défilement).
 */
export function DayTimeline({ moments, conclusion }: DayTimelineProps) {
  const [active, setActive] = useState(0)
  const [visited, setVisited] = useState<Set<number>>(() => new Set([0]))
  const isLast = active === moments.length - 1

  const show = (index: number) => {
    setActive(index)
    setVisited((prev) => new Set(prev).add(index))
  }
  const restart = () => {
    setActive(0)
    setVisited(new Set([0]))
  }

  const current = moments[active]
  /** Le fil va du centre de la première colonne au centre de la dernière. */
  const edge = 50 / moments.length
  const next = isLast ? -1 : active + 1

  return (
    <div className="flex flex-col items-center gap-10">
      <ol
        className="relative grid w-full max-w-3xl"
        style={{ gridTemplateColumns: `repeat(${moments.length}, minmax(0, 1fr))` }}
        aria-label="Les heures de la journée"
      >
        {/* Le fil de la journée, derrière les pastilles — se remplit jusqu'à l'heure affichée. */}
        <span aria-hidden="true" className="absolute top-[11px] h-0.5 rounded-full bg-[#520C0C]/15" style={{ left: `${edge}%`, right: `${edge}%` }} />
        <span
          aria-hidden="true"
          className="absolute top-[11px] h-0.5 rounded-full bg-[#520C0C] transition-[width] duration-500"
          style={{ left: `${edge}%`, width: `${(active / (moments.length - 1)) * (100 - 2 * edge)}%` }}
        />
        {moments.map((moment, i) => {
          const isActive = i === active
          const isVisited = visited.has(i)
          return (
            <li key={moment.time} className="flex justify-center">
              <button
                type="button"
                onClick={() => show(i)}
                aria-pressed={isActive}
                className="group relative z-10 flex flex-col items-center gap-2.5 rounded-lg px-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#520C0C]"
              >
                <span className="relative flex size-6 items-center justify-center">
                  {i === next && <span aria-hidden="true" className="absolute inline-flex size-full animate-ping rounded-full bg-[#520C0C]/30" />}
                  <span
                    className={cn(
                      'relative rounded-full ring-4 ring-background transition-all',
                      isActive ? 'size-6 bg-[#520C0C]' : isVisited ? 'size-4 bg-[#520C0C]/60' : 'size-4 border-2 border-[#520C0C]/40 bg-background group-hover:bg-[#520C0C]/20',
                    )}
                  />
                </span>
                <span
                  className={cn(
                    'font-heading text-sm font-semibold transition-colors sm:text-lg',
                    isActive ? 'text-[#520C0C]' : 'text-foreground/50 group-hover:text-[#520C0C]',
                  )}
                >
                  {moment.time}
                </span>
              </button>
            </li>
          )
        })}
      </ol>

      <div
        key={active}
        aria-live="polite"
        className="animate-notice-in flex w-full max-w-2xl flex-col items-center gap-6 rounded-3xl border border-border bg-card p-8 text-center shadow-(--shadow-raised) sm:p-10"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5F6B4C]">{current.time}</p>
        <p className="text-balance font-heading text-2xl font-semibold leading-snug text-foreground sm:text-3xl">{current.text}</p>
        {isLast ? (
          <>
            <p className="text-balance font-heading text-xl font-semibold leading-snug text-[#520C0C]">{conclusion}</p>
            <button
              type="button"
              onClick={restart}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              Revoir la journée
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => show(active + 1)}
            className="inline-flex items-center gap-2 rounded-full bg-[#520C0C] px-6 py-3 text-sm font-medium text-[#DDE6EF] shadow-(--shadow-raised) transition-colors hover:bg-[#520C0C]/92"
          >
            Et ensuite ?
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  )
}
