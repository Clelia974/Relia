import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/EmptyState'
import { getBudgetStatus, getWeddingBudgetOverview } from '@/features/finances/budget'
import { getWeddingFinancials } from '@/features/finances/calculations'
import { BudgetStatusBadge } from '@/features/finances/components/BudgetStatusBadge'
import { MarginStatusBadge } from '@/features/finances/components/MarginStatusBadge'
import { currency } from '@/lib/currency'
import { useWorkspaceStore } from '@/store/workspaceStore'

export function FinancesGlobalPage() {
  const weddings = useWorkspaceStore((s) => s.workspace.weddings)
  const vendors = useWorkspaceStore((s) => s.workspace.vendors)
  const vendorWeddingLinks = useWorkspaceStore((s) => s.workspace.vendorWeddingLinks)
  const expenses = useWorkspaceStore((s) => s.workspace.expenses)
  const scopeChanges = useWorkspaceStore((s) => s.workspace.scopeChanges)

  const rows = useMemo(() => {
    return weddings
      .filter((w) => !w.archived)
      .map((wedding) => {
        const weddingVendors = vendors.filter((v) => v.weddingIds.includes(wedding.id))
        const weddingVendorLinks = vendorWeddingLinks.filter((l) => l.weddingId === wedding.id)
        const weddingExpenses = expenses.filter((e) => e.weddingId === wedding.id)
        const weddingScopeChanges = scopeChanges.filter((sc) => sc.weddingId === wedding.id)
        return {
          wedding,
          financials: getWeddingFinancials(wedding, weddingVendors, weddingVendorLinks, weddingExpenses, weddingScopeChanges),
          budget: getWeddingBudgetOverview(wedding, weddingVendors, weddingVendorLinks, weddingExpenses),
        }
      })
      .sort((a, b) => a.wedding.date.localeCompare(b.wedding.date))
  }, [weddings, vendors, vendorWeddingLinks, expenses, scopeChanges])

  const budgetConfigured = rows.filter((r) => r.budget.hasClientBudget)
  const budgetTotals = {
    clientBudget: budgetConfigured.reduce((sum, r) => sum + r.budget.clientBudget, 0),
    estimatedSpend: budgetConfigured.reduce((sum, r) => sum + r.budget.estimatedTotalSpend, 0),
    atRiskCount: budgetConfigured.filter((r) => {
      const status = getBudgetStatus(r.budget)
      return status === 'attention' || status === 'depasse'
    }).length,
  }
  const budgetMissingCount = rows.length - budgetConfigured.length

  // Un mariage sans coût renseigné a totalCosts=0 par construction (cf.
  // calculations.ts) : l'inclure dans les totaux gonflerait artificiellement
  // le profit affiché. Les totaux agrégés ne portent donc que sur les
  // mariages "calculables" — même périmètre que la marge moyenne, pour que
  // revenu/coûts/profit restent cohérents entre eux.
  const calculable = rows.filter((r) => r.financials.marginStatus !== null)
  const incompleteCount = rows.length - calculable.length
  const totals = {
    revenue: calculable.reduce((sum, r) => sum + r.financials.approvedRevenue, 0),
    costs: calculable.reduce((sum, r) => sum + r.financials.totalCosts, 0),
    profit: calculable.reduce((sum, r) => sum + r.financials.profit, 0),
    averageMarginPct: calculable.length > 0 ? calculable.reduce((sum, r) => sum + r.financials.marginPct, 0) / calculable.length : 0,
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground">Finances</h1>
        <p className="mt-1 text-sm text-muted-foreground">Vue d'ensemble du budget et de la rentabilité, tous mariages actifs confondus.</p>
      </div>

      {rows.length === 0 ? (
        <EmptyState description="Aucun mariage actif pour l'instant." />
      ) : (
        <>
          <section aria-labelledby="budget-global-heading" className="flex flex-col gap-3">
            <div>
              <h2 id="budget-global-heading" className="font-heading text-lg font-semibold text-foreground">
                Budget du mariage
              </h2>
              <p className="text-sm text-muted-foreground">
                Compare le budget prévu par les couples avec les dépenses et coûts suivis dans RELIA.
              </p>
            </div>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              <SummaryCard
                label="Budget total configuré"
                value={budgetConfigured.length > 0 ? currency.format(budgetTotals.clientBudget) : '—'}
              />
              <SummaryCard
                label="Dépenses estimées (budgets configurés)"
                value={budgetConfigured.length > 0 ? currency.format(budgetTotals.estimatedSpend) : '—'}
              />
              <SummaryCard
                label="Mariages à surveiller ou dépassés"
                value={budgetConfigured.length > 0 ? String(budgetTotals.atRiskCount) : '—'}
              />
            </div>
            {budgetMissingCount > 0 && (
              <p className="text-xs text-muted-foreground">
                {budgetMissingCount} mariage{budgetMissingCount > 1 ? 's' : ''} sans budget client renseigné, non comptabilisé
                {budgetMissingCount > 1 ? 's' : ''} dans les totaux ci-dessus.
              </p>
            )}
          </section>

          <section aria-labelledby="rentabilite-global-heading" className="flex flex-col gap-3 border-t border-border pt-6">
            <div>
              <h2 id="rentabilite-global-heading" className="font-heading text-lg font-semibold text-foreground">
                Rentabilité de l'entreprise
              </h2>
              <p className="text-sm text-muted-foreground">
                Mesure la rentabilité de ta prestation à partir du montant vendu et des coûts associés.
              </p>
            </div>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryCard label="Chiffre d'affaires approuvé" value={currency.format(totals.revenue)} />
              <SummaryCard label="Coûts totaux" value={currency.format(totals.costs)} />
              <SummaryCard label="Profit prévisionnel" value={currency.format(totals.profit)} />
              <SummaryCard label="Marge moyenne" value={calculable.length > 0 ? `${Math.round(totals.averageMarginPct)} %` : '—'} />
            </div>

            {incompleteCount > 0 && (
              <p className="text-xs text-muted-foreground">
                Dont {incompleteCount} mariage{incompleteCount > 1 ? 's' : ''} à données incomplètes, non comptabilisé
                {incompleteCount > 1 ? 's' : ''} dans les totaux ci-dessus.
              </p>
            )}
          </section>

          <div className="flex flex-col gap-2.5">
            {rows.map(({ wedding, financials, budget }) => (
              <Link
                key={wedding.id}
                to={`/mariages/${wedding.id}/finances`}
                className="flex flex-col gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm transition-colors hover:border-thread/50"
              >
                <div>
                  <p className="font-medium text-foreground">{wedding.coupleName}</p>
                  <p className="text-xs text-muted-foreground">{wedding.venue}</p>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1">
                    <p className="text-xs font-medium text-muted-foreground">Budget du mariage</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span className="text-muted-foreground">
                        Budget :{' '}
                        <span className="tabular-nums text-foreground">
                          {budget.hasClientBudget ? currency.format(budget.clientBudget) : 'Non renseigné'}
                        </span>
                      </span>
                      {budget.hasClientBudget && (
                        <span className="text-muted-foreground">
                          Estimé dépensé :{' '}
                          <span className="tabular-nums text-foreground">{currency.format(budget.estimatedTotalSpend)}</span>
                        </span>
                      )}
                      <BudgetStatusBadge status={getBudgetStatus(budget)} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-xs font-medium text-muted-foreground">Rentabilité</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span className="text-muted-foreground">
                        Revenu : <span className="tabular-nums text-foreground">{currency.format(financials.approvedRevenue)}</span>
                      </span>
                      <span className="text-muted-foreground">
                        Coûts :{' '}
                        <span className="tabular-nums text-foreground">
                          {financials.hasCostData ? currency.format(financials.totalCosts) : '—'}
                        </span>
                      </span>
                      <span className="text-muted-foreground">
                        Profit :{' '}
                        <span className="tabular-nums text-foreground">
                          {financials.hasCostData ? currency.format(financials.profit) : '—'}
                        </span>
                      </span>
                      {financials.marginStatus ? (
                        <div className="flex items-center gap-2">
                          <span className="font-medium tabular-nums text-foreground">{Math.round(financials.marginPct)} %</span>
                          <MarginStatusBadge status={financials.marginStatus} />
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Données incomplètes</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1.5">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-heading text-xl font-semibold tabular-nums text-foreground">{value}</p>
      </CardContent>
    </Card>
  )
}
