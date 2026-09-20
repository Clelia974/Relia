import { useMemo } from 'react'
import { ShieldCheck, TriangleAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useShallow } from 'zustand/react/shallow'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getWeddingRisks } from '@/features/dashboard/summary'
import { formatDaysUntil } from '@/lib/dateFormat'
import { WEDDING_RISK_LEVEL_LABELS } from '@/features/weddings/risk'
import { useWorkspaceStore } from '@/store/workspaceStore'

const MAX_VISIBLE = 3

export function RiskWatch() {
  const riskWorkspace = useWorkspaceStore(
    useShallow((s) => ({
      weddings: s.workspace.weddings,
      vendors: s.workspace.vendors,
      vendorWeddingLinks: s.workspace.vendorWeddingLinks,
      tasks: s.workspace.tasks,
      clientDecisions: s.workspace.clientDecisions,
      timelineEvents: s.workspace.timelineEvents,
      ignoredConflictIds: s.workspace.ignoredConflictIds,
    })),
  )
  const visible = useMemo(
    () => getWeddingRisks(riskWorkspace).filter((r) => r.level !== 'faible').slice(0, MAX_VISIBLE),
    [riskWorkspace],
  )

  return (
    <Card id="mariages-a-surveiller">
      <CardHeader>
        <CardTitle>Quel mariage est à risque ?</CardTitle>
      </CardHeader>
      <CardContent>
        {visible.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="size-4 shrink-0 text-success" aria-hidden="true" />
            Aucun mariage à surveiller pour le moment.
          </p>
        ) : (
          <ul className="flex flex-col gap-4">
            {visible.map((risk) => (
              <li key={risk.wedding.id}>
                <Link
                  to={`/mariages/${risk.wedding.id}`}
                  className="flex items-start justify-between gap-3 text-sm hover:underline"
                >
                  <div className="flex items-start gap-2.5">
                    <TriangleAlert className="mt-0.5 size-4 shrink-0 text-risk" aria-hidden="true" />
                    <span className="font-medium text-foreground">{risk.wedding.coupleName}</span>
                  </div>
                  <Badge className="border-transparent bg-risk-bg text-risk">{WEDDING_RISK_LEVEL_LABELS[risk.level]}</Badge>
                </Link>
                <p className="mt-1 pl-[26px] text-xs text-muted-foreground">
                  {formatDaysUntil(risk.daysUntil)}
                  {risk.vendorsTotal > 0 && ` · ${risk.vendorsConfirmed}/${risk.vendorsTotal} prestataires confirmés`}
                  {risk.urgentTaskCount > 0 && ` · ${risk.urgentTaskCount} tâche${risk.urgentTaskCount !== 1 ? 's' : ''} urgente${risk.urgentTaskCount !== 1 ? 's' : ''}`}
                  {risk.conflictCount > 0 && ` · ${risk.conflictCount} conflit${risk.conflictCount !== 1 ? 's' : ''} de planning`}
                </p>
              </li>
            ))}
          </ul>
        )}

        <Link to="/mariages" className="mt-4 block text-sm text-foreground underline-offset-4 hover:underline">
          Voir tous les mariages →
        </Link>
      </CardContent>
    </Card>
  )
}
