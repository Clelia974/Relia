import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getProfitOverview } from '@/features/dashboard/summary'
import { currency } from '@/lib/currency'
import { useWorkspaceStore } from '@/store/workspaceStore'

export function ProfitOverview() {
  const profitWorkspace = useWorkspaceStore(
    useShallow((s) => ({
      weddings: s.workspace.weddings,
      vendors: s.workspace.vendors,
      vendorWeddingLinks: s.workspace.vendorWeddingLinks,
      expenses: s.workspace.expenses,
      scopeChanges: s.workspace.scopeChanges,
    })),
  )
  const data = useMemo(() => getProfitOverview(profitWorkspace), [profitWorkspace])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rentabilité</CardTitle>
      </CardHeader>
      <CardContent>
        {!data.hasData ? (
          <p className="text-sm text-muted-foreground">
            Votre résumé de rentabilité apparaîtra après l'ajout de montants et de coûts.
          </p>
        ) : (
          <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">Marge moyenne</dt>
              <dd className="font-heading text-xl font-semibold tabular-nums text-foreground">
                {Math.round(data.averageMarginPct)} %
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Mariages en marge faible</dt>
              <dd className="font-heading text-xl font-semibold tabular-nums text-foreground">{data.lowMarginWeddingCount}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Chiffre d'affaires approuvé</dt>
              <dd className="tabular-nums text-foreground">{currency.format(data.approvedRevenue)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Demandes non facturées</dt>
              <dd className="tabular-nums text-foreground">{currency.format(data.unbilledScopeCreep)}</dd>
            </div>
            {data.missingVendorCostCount > 0 && (
              <div className="col-span-2">
                <dt className="text-xs text-muted-foreground">Coûts non renseignés</dt>
                <dd className="text-foreground">
                  {data.missingVendorCostCount} prestataire{data.missingVendorCostCount !== 1 ? 's' : ''} sans coût connu
                </dd>
              </div>
            )}
          </dl>
        )}
      </CardContent>
    </Card>
  )
}
