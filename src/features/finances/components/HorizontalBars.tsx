import { useState } from 'react'

export interface HorizontalBarItem {
  key: string
  label: string
  amount: number
}

interface HorizontalBarsProps {
  items: HorizontalBarItem[]
  formatAmount: (amount: number) => string
  /** Décrit ce que la liste représente, pour les lecteurs d'écran (ex. "Répartition des dépenses par catégorie"). */
  ariaLabel: string
  emptyLabel: string
  /** Nombre de barres visibles avant repli derrière "Voir plus" — le reste n'est jamais perdu, seulement replié. */
  maxVisible?: number
}

/**
 * Barres horizontales toujours démarrées à zéro, triées par l'appelant.
 * Le label, le montant et le pourcentage sont du texte réel (jamais portés
 * uniquement par la barre) — accessible sans résumé séparé, cf. règle
 * "jamais uniquement la couleur" déjà appliquée aux badges de statut.
 */
export function HorizontalBars({ items, formatAmount, ariaLabel, emptyLabel, maxVisible = 5 }: HorizontalBarsProps) {
  const [expanded, setExpanded] = useState(false)

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>
  }

  const total = items.reduce((sum, item) => sum + item.amount, 0)
  const hasMore = items.length > maxVisible
  const visibleItems = expanded ? items : items.slice(0, maxVisible)
  const hiddenCount = items.length - maxVisible

  return (
    <div className="flex flex-col gap-2.5">
      <ul className="flex flex-col gap-2.5" aria-label={ariaLabel}>
        {visibleItems.map((item) => {
          const pct = total > 0 ? (item.amount / total) * 100 : 0
          return (
            <li key={item.key} className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="text-foreground">{item.label}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {formatAmount(item.amount)} · {Math.round(pct)} %
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-thread" style={{ width: `${Math.min(pct, 100)}%` }} aria-hidden="true" />
              </div>
            </li>
          )
        })}
      </ul>
      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="self-start text-xs font-medium text-foreground underline-offset-4 hover:underline"
        >
          {expanded ? 'Voir moins' : `Voir ${hiddenCount} autre${hiddenCount > 1 ? 's' : ''} catégorie${hiddenCount > 1 ? 's' : ''}`}
        </button>
      )}
    </div>
  )
}
