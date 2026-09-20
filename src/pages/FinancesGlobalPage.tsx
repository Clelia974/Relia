import { useMemo } from 'react'
import { CircleCheck, TriangleAlert } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/EmptyState'
import { getBudgetStatus, getWeddingBudgetOverview } from '@/features/finances/budget'
import { getWeddingFinancials } from '@/features/finances/calculations'
import { BudgetProgressBar } from '@/features/finances/components/BudgetProgressBar'
import { WeddingComparison } from '@/features/finances/components/WeddingComparison'
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
            {budgetConfigured.length > 0 ? (
              <Card>
                <CardContent className="flex flex-col gap-3">
                  <BudgetProgressBar
                    pct={(budgetTotals.estimatedSpend / Math.max(1, budgetTotals.clientBudget)) * 100}
                    toneClassName={budgetTotals.atRiskCount > 0 ? 'bg-warning' : 'bg-success'}
                    accessibleLabel={`${currency.format(budgetTotals.estimatedSpend)} dépensés sur ${currency.format(budgetTotals.clientBudget)}, tous mariages avec budget confondus`}
                    caption={`${currency.format(budgetTotals.estimatedSpend)} dépensés sur ${currency.format(budgetTotals.clientBudget)}`}
                  />
                  {budgetTotals.atRiskCount > 0 ? (
                    <p className="flex items-center gap-1.5 text-sm font-medium text-warning">
                      <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
                      {budgetTotals.atRiskCount} mariage{budgetTotals.atRiskCount > 1 ? 's' : ''} à surveiller ou dépassé
                      {budgetTotals.atRiskCount > 1 ? 's' : ''}
                    </p>
                  ) : (
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <CircleCheck className="size-4 shrink-0 text-success" aria-hidden="true" />
                      Tous les budgets sont dans les clous.
                    </p>
                  )}
                </CardContent>
              </Card>
            ) : (
              <p className="rounded-lg border border-dashed border-border px-4 py-4 text-sm text-muted-foreground">
                Aucun budget client renseigné pour l'instant.
              </p>
            )}
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
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <SummaryCard label="Profit prévisionnel" value={currency.format(totals.profit)} />
              <SummaryCard label="Marge moyenne" value={calculable.length > 0 ? `${Math.round(totals.averageMarginPct)} %` : '—'} />
            </div>

            <details className="rounded-lg border border-border">
              <summary className="cursor-pointer list-none px-4 py-2.5 text-sm font-medium text-foreground marker:content-none">
                Voir le détail
              </summary>
              <div className="grid gap-4 border-t border-border px-4 py-4 grid-cols-1 sm:grid-cols-2">
                <SummaryCard label="Chiffre d'affaires approuvé" value={currency.format(totals.revenue)} />
                <SummaryCard label="Coûts totaux" value={currency.format(totals.costs)} />
              </div>
            </details>

            {incompleteCount > 0 && (
              <p className="text-xs text-muted-foreground">
                Dont {incompleteCount} mariage{incompleteCount > 1 ? 's' : ''} à données incomplètes, non comptabilisé
                {incompleteCount > 1 ? 's' : ''} dans les totaux ci-dessus.
              </p>
            )}
          </section>

          <WeddingComparison rows={rows} />
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
