import type { BreakdownSummary } from '@/features/breakdown/breakdownSummary'

interface BreakdownSummaryStatsProps {
  summary: BreakdownSummary
}

export function BreakdownSummaryStats({ summary }: BreakdownSummaryStatsProps) {
  const isComplete = summary.total > 0 && summary.returned === summary.total && summary.missingDestination === 0

  return (
    <div className="flex flex-col gap-3">
      {isComplete && (
        <div className="rounded-lg border border-thread/40 bg-thread/10 px-4 py-3 text-center">
          <p className="font-heading text-base font-semibold text-thread-text">Démontage complet</p>
          <p className="text-xs text-muted-foreground">Tous les éléments ont été récupérés et affectés à une destination.</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Récupérés" value={`${summary.returned}/${summary.total}`} />
        <Stat label="Endommagés" value={String(summary.damaged)} warn={summary.damaged > 0} />
        <Stat label="Destination manquante" value={String(summary.missingDestination)} warn={summary.missingDestination > 0} />
        <Stat label="Zones" value={String(summary.zoneCount)} />
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
