export interface BudgetBarSegment {
  key: string
  label: string
  amount: number
  /** Classe Tailwind de fond pour ce segment — un des tons sémantiques partagés (cf. badgeTone). */
  colorClassName: string
}

interface BudgetSegmentedBarProps {
  segments: BudgetBarSegment[]
  /** Dénominateur (ex. budget client) — l'échelle contre laquelle les segments sont dessinés. */
  total: number
  formatAmount: (amount: number) => string
}

/**
 * Barre segmentée (prévu/engagé/payé) à l'échelle du budget client. Chaque
 * segment est plafonné à l'espace restant dans la piste : jamais de
 * dépassement visuel silencieux — un dépassement réel du budget est signalé
 * ailleurs (section Attention), jamais en laissant la barre déborder de son
 * propre cadre sans explication.
 */
export function BudgetSegmentedBar({ segments, total, formatAmount }: BudgetSegmentedBarProps) {
  const widths = segments.reduce<{ key: string; colorClassName: string; width: number }[]>((acc, segment) => {
    const usedPct = acc.reduce((sum, s) => sum + s.width, 0)
    if (segment.amount <= 0 || total <= 0) return acc
    const rawPct = (segment.amount / total) * 100
    const width = Math.max(Math.min(rawPct, 100 - usedPct), 0)
    return [...acc, { key: segment.key, colorClassName: segment.colorClassName, width }]
  }, [])

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
        {widths.map((segment) => (
          <div key={segment.key} className={segment.colorClassName} style={{ width: `${segment.width}%` }} aria-hidden="true" />
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        {segments.map((segment) => (
          <li key={segment.key} className="flex items-center gap-1.5">
            <span className={`size-2.5 shrink-0 rounded-sm ${segment.colorClassName}`} aria-hidden="true" />
            {segment.label} : <span className="tabular-nums text-foreground">{formatAmount(segment.amount)}</span>
            {total > 0 && <span>({Math.round((segment.amount / total) * 100)} %)</span>}
          </li>
        ))}
      </ul>
    </div>
  )
}
