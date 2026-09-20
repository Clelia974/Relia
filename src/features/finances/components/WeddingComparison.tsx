import { Link } from 'react-router-dom'
import type { WeddingBudgetOverview } from '@/features/finances/budget'
import { getBudgetStatus } from '@/features/finances/budget'
import type { WeddingFinancials } from '@/features/finances/calculations'
import { BudgetStatusBadge } from '@/features/finances/components/BudgetStatusBadge'
import { MarginStatusBadge } from '@/features/finances/components/MarginStatusBadge'
import { currency } from '@/lib/currency'
import { cn } from '@/lib/utils'
import type { Wedding } from '@/types/entities'

export interface WeddingComparisonRow {
  wedding: Wedding
  financials: WeddingFinancials
  budget: WeddingBudgetOverview
}

const BUDGET_FILL = {
  ok: 'bg-success',
  attention: 'bg-warning',
  depasse: 'bg-risk',
} as const

/**
 * Deux graphiques en barres horizontales alignés, une ligne par mariage :
 * budget utilisé (jauge, part du budget) et profit prévisionnel (barre, même échelle pour tous).
 * Les montants exacts restent dans les libellés accessibles et les infobulles ; à l'écran,
 * un seul chiffre par barre. Les états d'alerte sont toujours doublés d'une icône et d'un texte.
 */
export function WeddingComparison({ rows }: { rows: WeddingComparisonRow[] }) {
  const maxProfit = Math.max(1, ...rows.filter((r) => r.financials.marginStatus !== null).map((r) => Math.abs(r.financials.profit)))

  return (
    <section aria-labelledby="comparaison-heading" className="flex flex-col gap-3">
      <h2 id="comparaison-heading" className="font-heading text-lg font-semibold text-foreground">
        Mariage par mariage
      </h2>

      <div className="hidden grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-x-6 px-4 text-xs font-medium text-muted-foreground md:grid" aria-hidden="true">
        <span>Mariage</span>
        <span>Budget utilisé</span>
        <span>Profit prévisionnel</span>
      </div>

      <ul className="flex flex-col gap-2">
        {rows.map(({ wedding, financials, budget }) => {
          const status = getBudgetStatus(budget)
          const usagePct = budget.budgetUsagePct ?? 0
          const budgetLabel = `Budget utilisé : ${currency.format(budget.estimatedTotalSpend)} sur ${currency.format(budget.clientBudget)}`
          const hasProfit = financials.marginStatus !== null
          const profitWidth = hasProfit ? Math.max(2, (Math.abs(financials.profit) / maxProfit) * 100) : 0
          const profitLabel = hasProfit
            ? `Profit prévisionnel : ${currency.format(financials.profit)}, marge ${Math.round(financials.marginPct)} %`
            : ''

          return (
            <li key={wedding.id}>
              <Link
                to={`/mariages/${wedding.id}/finances`}
                className="grid grid-cols-1 gap-x-6 gap-y-3 rounded-lg border border-border bg-card px-4 py-3 text-sm transition-colors hover:border-thread/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)] md:items-center"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{wedding.coupleName}</p>
                  {wedding.venue && <p className="truncate text-xs text-muted-foreground">{wedding.venue}</p>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <p className="text-xs text-muted-foreground md:hidden">Budget utilisé</p>
                  {budget.hasClientBudget ? (
                    <>
                      <div className="flex items-center gap-3" title={budgetLabel}>
                        <div
                          role="progressbar"
                          aria-valuenow={Math.round(Math.min(usagePct, 100))}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={budgetLabel}
                          className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted"
                        >
                          <div
                            className={cn('h-full rounded-full motion-reduce:transition-none', status === 'non_configure' ? '' : BUDGET_FILL[status])}
                            style={{ width: `${Math.max(0, Math.min(usagePct, 100))}%` }}
                          />
                        </div>
                        <span className="w-11 shrink-0 text-right font-medium tabular-nums text-foreground">{Math.round(usagePct)} %</span>
                      </div>
                      {(status === 'attention' || status === 'depasse') && (
                        <div>
                          <BudgetStatusBadge status={status} />
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">Budget non renseigné</p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <p className="text-xs text-muted-foreground md:hidden">Profit prévisionnel</p>
                  {hasProfit ? (
                    <>
                      <div className="flex items-center gap-3" role="img" aria-label={profitLabel} title={profitLabel}>
                        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn('h-full rounded-full', financials.profit < 0 ? 'bg-risk' : 'bg-thread')}
                            style={{ width: `${profitWidth}%` }}
                          />
                        </div>
                        <span className="w-20 shrink-0 text-right font-medium tabular-nums text-foreground">
                          {currency.format(financials.profit)}
                        </span>
                      </div>
                      {financials.marginStatus !== 'saine' && (
                        <div>
                          <MarginStatusBadge status={financials.marginStatus!} />
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">Données incomplètes</p>
                  )}
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
