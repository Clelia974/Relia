import type { ReactNode } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { BlockerList } from '@/features/dashboard/components/BlockerList'
import { ProfitOverview } from '@/features/dashboard/components/ProfitOverview'
import { RiskWatch } from '@/features/dashboard/components/RiskWatch'
import { TaskDigest } from '@/features/dashboard/components/TaskDigest'
import { UpcomingEvents } from '@/features/dashboard/components/UpcomingEvents'
import { getDashboardSummary } from '@/features/dashboard/summary'
import { useWorkspaceStore } from '@/store/workspaceStore'

function StatCard({ href, value, label }: { href: string; value: number; label: string }) {
  return (
    <Link
      to={href}
      className="flex flex-col gap-0.5 rounded-lg border border-border bg-card p-4 transition-colors hover:border-thread/50 hover:bg-accent"
    >
      <span className="font-heading text-2xl font-semibold tabular-nums text-foreground">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </Link>
  )
}

function Column({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-4">{children}</div>
}

export function AujourdHuiPage() {
  const workspace = useWorkspaceStore((s) => s.workspace)
  const displayName = workspace.userProfile.displayName.trim()
  const today = new Date()
  const summary = getDashboardSummary(workspace, today)

  if (!summary.hasAnyWedding) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-lg border border-dashed border-border px-6 py-16">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">Votre espace est prêt.</h1>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Créez votre premier mariage pour commencer à organiser vos prestataires, vos tâches et votre planning.
          </p>
        </div>
        <Button asChild>
          <Link to="/mariages/nouveau">
            <Plus className="size-4" aria-hidden="true" />
            Créer mon premier mariage
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground">Bonjour{displayName && ` ${displayName}`}</h1>
        <p className="mt-1 text-sm capitalize text-muted-foreground">{format(today, 'EEEE d MMMM', { locale: fr })}</p>
        <p className="mt-1 text-sm text-muted-foreground">Voici ce qui mérite votre attention aujourd'hui.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard href="#actions-du-jour" value={summary.todayActionsCount} label={`action${summary.todayActionsCount !== 1 ? 's' : ''} aujourd'hui`} />
        <StatCard href="#actions-du-jour" value={summary.pendingResponsesCount} label={`réponse${summary.pendingResponsesCount !== 1 ? 's' : ''} en attente`} />
        <StatCard href="#alertes" value={summary.planningAlertsCount} label={`alerte${summary.planningAlertsCount !== 1 ? 's' : ''} planning`} />
        <StatCard href="#mariages-a-surveiller" value={summary.watchedWeddingsCount} label={`mariage${summary.watchedWeddingsCount !== 1 ? 's' : ''} à surveiller`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
        <Column>
          <TaskDigest />
          <RiskWatch />
        </Column>
        <Column>
          <UpcomingEvents />
          <BlockerList />
          <ProfitOverview />
        </Column>
      </div>
    </div>
  )
}
