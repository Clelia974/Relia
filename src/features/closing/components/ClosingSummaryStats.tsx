import { getMarginStatus } from '@/features/finances/calculations'
import { MarginStatusBadge } from '@/features/finances/components/MarginStatusBadge'
import type { ClosingSessionSummary } from '@/types/entities'

const currency = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

interface ClosingSummaryStatsProps {
  summary: ClosingSessionSummary
}

export function ClosingSummaryStats({ summary }: ClosingSummaryStatsProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Tâches complétées" value={`${summary.completedTasks}/${summary.totalTasks}`} />
        <Stat label="Matériel récupéré" value={`${summary.recoveredEquipment}/${summary.totalEquipment}`} />
        <Stat label="Matériel endommagé" value={String(summary.damagedEquipment)} warn={summary.damagedEquipment > 0} />
        <Stat label="Matériel non récupéré" value={String(summary.pendingEquipment)} warn={summary.pendingEquipment > 0} />
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <p className="font-heading text-base font-semibold text-foreground">Bilan financier</p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="Chiffre d'affaires" value={currency.format(summary.approvedRevenue)} />
          <Field label="Coûts totaux" value={currency.format(summary.totalCosts)} />
          <Field label="Profit" value={currency.format(summary.profit)} />
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className="font-heading text-xl font-semibold tabular-nums text-foreground">{Math.round(summary.marginPct)} %</span>
          {summary.approvedRevenue > 0 && summary.totalCosts > 0 && <MarginStatusBadge status={getMarginStatus(summary.marginPct)} />}
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-3 text-center">
      <p className={`font-heading text-xl font-semibold tabular-nums ${warn ? 'text-warning' : 'text-foreground'}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums text-foreground">{value}</dd>
    </div>
  )
}
