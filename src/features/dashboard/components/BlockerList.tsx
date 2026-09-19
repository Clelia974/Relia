import { useMemo } from 'react'
import { ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { useShallow } from 'zustand/react/shallow'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getDashboardAlerts } from '@/features/dashboard/summary'
import { useWorkspaceStore } from '@/store/workspaceStore'

const MAX_VISIBLE = 6

export function BlockerList() {
  const alertsWorkspace = useWorkspaceStore(
    useShallow((s) => ({
      weddings: s.workspace.weddings,
      vendors: s.workspace.vendors,
      tasks: s.workspace.tasks,
      timelineEvents: s.workspace.timelineEvents,
      ignoredConflictIds: s.workspace.ignoredConflictIds,
      clientDecisions: s.workspace.clientDecisions,
      vendorWeddingLinks: s.workspace.vendorWeddingLinks,
    })),
  )
  const ignoreTimelineConflict = useWorkspaceStore((s) => s.ignoreTimelineConflict)

  const alerts = useMemo(() => getDashboardAlerts(alertsWorkspace), [alertsWorkspace])
  const visible = alerts.slice(0, MAX_VISIBLE)

  const handleIgnore = (conflictId: string) => {
    ignoreTimelineConflict(conflictId)
    toast.success('Alerte ignorée.')
  }

  return (
    <Card id="alertes">
      <CardHeader>
        <CardTitle>Qu'est-ce qui bloque ?</CardTitle>
      </CardHeader>
      <CardContent>
        {visible.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="size-4 shrink-0 text-success" aria-hidden="true" />
            Aucun blocage en cours.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {visible.map((alert) => (
              <li key={alert.id} className="flex items-start justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="text-foreground">{alert.title}</p>
                  <p className="text-xs text-muted-foreground">{alert.detail ?? alert.weddingName}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button asChild variant="outline" size="sm">
                    <Link to={alert.href}>{alert.actionLabel}</Link>
                  </Button>
                  {alert.conflictId && (
                    <Button variant="ghost" size="sm" onClick={() => handleIgnore(alert.conflictId!)}>
                      Ignorer
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {alerts.length > MAX_VISIBLE && (
          <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
            +{alerts.length - MAX_VISIBLE} autre{alerts.length - MAX_VISIBLE !== 1 ? 's' : ''} blocage{alerts.length - MAX_VISIBLE !== 1 ? 's' : ''}.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
