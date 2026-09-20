import { cn } from '@/lib/utils'

interface BudgetProgressBarProps {
  /** Peut dépasser 100 (budget dépassé) — la largeur visuelle est plafonnée, jamais le texte. */
  pct: number
  /** Classe Tailwind de fond du remplissage — un ton sémantique partagé (success/warning/risk). */
  toneClassName: string
  /** Résumé textuel complet ("58 % du budget utilisé — 14 500 € sur 25 000 €") — porté par aria-label, jamais uniquement visuel. */
  accessibleLabel: string
  /** Ligne affichée sous la barre (ex. "14 500 € utilisés sur 25 000 €"). */
  caption: string
}

/**
 * Barre de progression à un seul remplissage — jamais plus de 100 % de large
 * même en dépassement de budget (le texte à côté porte le vrai chiffre,
 * cf. BudgetStatusBadge et la ligne de dépassement affichée par l'appelant).
 */
export function BudgetProgressBar({ pct, toneClassName, accessibleLabel, caption }: BudgetProgressBarProps) {
  const width = Math.max(0, Math.min(pct, 100))

  return (
    <div className="flex flex-col gap-1.5">
      <div
        role="progressbar"
        aria-valuenow={Math.round(width)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={accessibleLabel}
        className="h-3 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className={cn('h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none', toneClassName)}
          style={{ width: `${width}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">{caption}</p>
    </div>
  )
}
