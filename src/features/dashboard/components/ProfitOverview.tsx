import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getProfitOverview } from '@/features/dashboard/summary'
import { useWorkspaceStore } from '@/store/workspaceStore'

const currency = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

export function ProfitOverview() {
  const workspace = useWorkspaceStore((s) => s.workspace)
  const data = getProfitOverview(workspace)

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
          <dl className="grid grid-cols-2 gap-4 text-sm">
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
              <dt className="text-xs text-muted-foreground">Scope creep non facturé</dt>
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
