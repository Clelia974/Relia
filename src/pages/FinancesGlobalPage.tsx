import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { getWeddingFinancials } from '@/features/finances/calculations'
import { MarginStatusBadge } from '@/features/finances/components/MarginStatusBadge'
import { useWorkspaceStore } from '@/store/workspaceStore'

const currency = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

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
        }
      })
      .sort((a, b) => a.wedding.date.localeCompare(b.wedding.date))
  }, [weddings, vendors, vendorWeddingLinks, expenses, scopeChanges])

  const calculable = rows.filter((r) => r.financials.marginStatus !== null)
  const totals = {
    revenue: rows.reduce((sum, r) => sum + r.financials.approvedRevenue, 0),
    costs: rows.reduce((sum, r) => sum + r.financials.totalCosts, 0),
    profit: rows.reduce((sum, r) => sum + r.financials.profit, 0),
    averageMarginPct: calculable.length > 0 ? calculable.reduce((sum, r) => sum + r.financials.marginPct, 0) / calculable.length : 0,
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground">Finances</h1>
        <p className="mt-1 text-sm text-muted-foreground">Vue d'ensemble de la rentabilité, tous mariages actifs confondus.</p>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
          Aucun mariage actif pour l'instant.
        </p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard label="Chiffre d'affaires approuvé" value={currency.format(totals.revenue)} />
            <SummaryCard label="Coûts totaux" value={currency.format(totals.costs)} />
            <SummaryCard label="Profit prévisionnel" value={currency.format(totals.profit)} />
            <SummaryCard label="Marge moyenne" value={calculable.length > 0 ? `${Math.round(totals.averageMarginPct)} %` : '—'} />
          </div>

          <div className="flex flex-col gap-2.5">
            {rows.map(({ wedding, financials }) => (
              <Link
                key={wedding.id}
                to={`/mariages/${wedding.id}/finances`}
                className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-border bg-card px-4 py-3 text-sm transition-colors hover:border-thread/50"
              >
                <div className="min-w-40 flex-1">
                  <p className="font-medium text-foreground">{wedding.coupleName}</p>
                  <p className="text-xs text-muted-foreground">{wedding.venue}</p>
                </div>
                <span className="text-muted-foreground">
                  Revenu : <span className="tabular-nums text-foreground">{currency.format(financials.approvedRevenue)}</span>
                </span>
                <span className="text-muted-foreground">
                  Coûts : <span className="tabular-nums text-foreground">{financials.hasCostData ? currency.format(financials.totalCosts) : '—'}</span>
                </span>
                <span className="text-muted-foreground">
                  Profit : <span className="tabular-nums text-foreground">{financials.hasCostData ? currency.format(financials.profit) : '—'}</span>
                </span>
                {financials.marginStatus ? (
                  <div className="flex items-center gap-2">
                    <span className="font-medium tabular-nums text-foreground">{Math.round(financials.marginPct)} %</span>
                    <MarginStatusBadge status={financials.marginStatus} />
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">Données incomplètes</span>
                )}
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
