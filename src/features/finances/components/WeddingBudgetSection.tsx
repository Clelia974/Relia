import { CircleHelp, Info } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { BudgetProgressBar } from '@/features/finances/components/BudgetProgressBar'
import { BudgetSegmentedBar } from '@/features/finances/components/BudgetSegmentedBar'
import { BudgetStatusBadge } from '@/features/finances/components/BudgetStatusBadge'
import { HorizontalBars } from '@/features/finances/components/HorizontalBars'
import { getBudgetStatus, type WeddingBudgetOverview } from '@/features/finances/budget'
import { currency } from '@/lib/currency'
import { cn } from '@/lib/utils'
import { EXPENSE_CATEGORY_LABELS } from '@/lib/expenseCategory'
import type { BadgeTone } from '@/lib/badgeTone'

const PROGRESS_BAR_FILL: Record<BadgeTone, string> = {
  muted: 'bg-muted-foreground/40',
  success: 'bg-success',
  warning: 'bg-warning',
  risk: 'bg-risk',
}

const STATUS_TONE: Record<ReturnType<typeof getBudgetStatus>, BadgeTone> = {
  non_configure: 'muted',
  ok: 'success',
  attention: 'warning',
  depasse: 'risk',
}

interface WeddingBudgetSectionProps {
  overview: WeddingBudgetOverview
  /** Lien vers l'action d'édition existante du budget client (ex. fiche du mariage). */
  editBudgetHref?: string
}

/** "Budget du mariage" — perspective du couple. Ne calcule ni n'affiche jamais rentabilité/marge (cf. Rentabilité de l'entreprise, section séparée). */
export function WeddingBudgetSection({ overview, editBudgetHref }: WeddingBudgetSectionProps) {
  const status = getBudgetStatus(overview)
  const tone = STATUS_TONE[status]

  const categoryItems = overview.expensesByCategory.map((c) => ({
    key: c.category,
    label: EXPENSE_CATEGORY_LABELS[c.category],
    amount: c.amount,
  }))

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <h2 className="font-heading text-lg font-semibold text-foreground">Budget du mariage</h2>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label="À propos du budget du mariage"
                className="rounded-full p-0.5 text-muted-foreground hover:text-foreground"
              >
                <Info className="size-3.5" aria-hidden="true" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Compare le budget prévu par les couples avec les dépenses et coûts suivis dans RELIA.</TooltipContent>
          </Tooltip>
        </div>
        <BudgetStatusBadge status={status} />
      </div>

      {!overview.hasClientBudget ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-border px-4 py-4">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <CircleHelp className="size-4 shrink-0" aria-hidden="true" />
            Budget client non renseigné.
          </p>
          {editBudgetHref && (
            <a href={editBudgetHref} className="text-sm font-medium text-foreground underline-offset-4 hover:underline">
              Renseigner le budget →
            </a>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
          <div className="flex flex-col gap-1">
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              {overview.isOverBudget ? 'Au-dessus du budget' : 'Reste à dépenser'}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" aria-label="À propos du calcul" className="text-muted-foreground hover:text-foreground">
                    <Info className="size-3.5" aria-hidden="true" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  Estimation : coût prestataire réel s'il est connu, sinon estimé, plus toutes les autres dépenses (quel que soit leur statut).
                </TooltipContent>
              </Tooltip>
            </p>
            <p className={cn('font-heading text-4xl font-semibold tabular-nums', overview.isOverBudget ? 'text-risk' : 'text-foreground')}>
              {currency.format(Math.abs(overview.remainingEstimate ?? 0))}
            </p>
          </div>
          <BudgetProgressBar
            pct={overview.budgetUsagePct ?? 0}
            toneClassName={PROGRESS_BAR_FILL[tone]}
            accessibleLabel={`${Math.round(overview.budgetUsagePct ?? 0)} % du budget utilisé — ${currency.format(overview.estimatedTotalSpend)} sur ${currency.format(overview.clientBudget)}`}
            caption={`${currency.format(overview.estimatedTotalSpend)} utilisés sur ${currency.format(overview.clientBudget)}`}
          />
        </div>
      )}

      <details className="group rounded-lg border border-border">
        <summary className="cursor-pointer list-none px-4 py-2.5 text-sm font-medium text-foreground marker:content-none">
          Voir le détail
        </summary>
        <div className="flex flex-col gap-4 border-t border-border px-4 py-4">
        <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-foreground">Répartition des dépenses</h3>
        <HorizontalBars
          items={categoryItems}
          formatAmount={(n) => currency.format(n)}
          ariaLabel="Répartition des autres dépenses par catégorie, triée du montant le plus élevé au plus faible"
          emptyLabel="Aucune autre dépense pour ce mariage."
        />
        </div>


          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <Tile label="Coûts prestataires estimés" value={overview.hasAnyVendor ? currency.format(overview.vendorEstimatedTotal) : '—'} />
            <Tile label="Coûts prestataires réels" value={overview.hasAnyVendor ? currency.format(overview.vendorActualTotal) : '—'} />
          </div>

          {overview.vendorsMissingCostCount > 0 && (
            <p className="text-xs text-warning">
              {overview.vendorsMissingCostCount} coût{overview.vendorsMissingCostCount > 1 ? 's' : ''} prestataire
              {overview.vendorsMissingCostCount > 1 ? 's' : ''} incomplet{overview.vendorsMissingCostCount > 1 ? 's' : ''} —
              l'estimation ci-dessus les sous-évalue tant qu'ils ne sont pas renseignés.
            </p>
          )}

          {overview.hasAnyExpense && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-muted-foreground">Autres dépenses — prévu, engagé, payé</p>
              <BudgetSegmentedBar
                total={overview.hasClientBudget ? overview.clientBudget : overview.expensesTotal}
                formatAmount={(n) => currency.format(n)}
                segments={[
                  { key: 'payee', label: 'Payées', amount: overview.expensesPaidTotal, colorClassName: 'bg-success' },
                  { key: 'engagee', label: 'Engagées', amount: overview.expensesCommittedTotal, colorClassName: 'bg-warning' },
                  { key: 'prevue', label: 'Prévues', amount: overview.expensesPlannedTotal, colorClassName: 'bg-muted-foreground/40' },
                ]}
              />
              {!overview.hasClientBudget && (
                <p className="text-xs text-muted-foreground">
                  Échelle basée sur le total des autres dépenses (aucun budget client renseigné).
                </p>
              )}
            </div>
          )}
        </div>
      </details>
    </section>
  )
}

function Tile({ label, value, tooltip }: { label: string; value: string; tooltip?: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1.5">
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          {label}
          {tooltip && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" aria-label={`À propos de ${label}`} className="text-muted-foreground hover:text-foreground">
                  <Info className="size-3" aria-hidden="true" />
                </button>
              </TooltipTrigger>
              <TooltipContent>{tooltip}</TooltipContent>
            </Tooltip>
          )}
        </p>
        <p className="font-heading text-2xl font-semibold tabular-nums text-foreground">{value}</p>
      </CardContent>
    </Card>
  )
}
