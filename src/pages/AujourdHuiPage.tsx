import { useMemo, type MouseEvent, type ReactNode } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useShallow } from 'zustand/react/shallow'
import { Button } from '@/components/ui/button'
import { BlockerList } from '@/features/dashboard/components/BlockerList'
import { ProfitOverview } from '@/features/dashboard/components/ProfitOverview'
import { RiskWatch } from '@/features/dashboard/components/RiskWatch'
import { TaskDigest } from '@/features/dashboard/components/TaskDigest'
import { UpcomingEvents } from '@/features/dashboard/components/UpcomingEvents'
import { getDashboardSummary } from '@/features/dashboard/summary'
import { useWorkspaceStore } from '@/store/workspaceStore'

function StatCard({ targetId, value, label }: { targetId: string; value: number; label: string }) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    const target = document.getElementById(targetId)
    if (!target) return
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    // Classe ajoutée/retirée avec un reflow forcé entre les deux : garantit
    // que l'animation rejoue même en recliquant la même carte deux fois de
    // suite (sinon le navigateur ignore une classe déjà présente).
    target.classList.remove('dashboard-target-flash')
    void target.offsetWidth
    target.classList.add('dashboard-target-flash')
  }

  return (
    <a
      href={`#${targetId}`}
      onClick={handleClick}
      className="flex flex-col gap-0.5 px-5 py-4 transition-colors duration-200 first:rounded-l-xl last:rounded-r-xl hover:bg-accent active:bg-accent/70"
    >
      <span className="font-heading text-2xl font-semibold tabular-nums text-foreground">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </a>
  )
}

function Column({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-6">{children}</div>
}

export function AujourdHuiPage() {
  const displayName = useWorkspaceStore((s) => s.workspace.userProfile.displayName.trim())
  const dashboardWorkspace = useWorkspaceStore(
    useShallow((s) => ({
      weddings: s.workspace.weddings,
      tasks: s.workspace.tasks,
      clientDecisions: s.workspace.clientDecisions,
      vendors: s.workspace.vendors,
      timelineEvents: s.workspace.timelineEvents,
      ignoredConflictIds: s.workspace.ignoredConflictIds,
      vendorWeddingLinks: s.workspace.vendorWeddingLinks,
    })),
  )
  // Figé au montage plutôt que recréé à chaque rendu : une nouvelle Date() à
  // chaque rendu casserait la mémoïsation de `summary` ci-dessous (dépendance
  // toujours différente), sans bénéfice réel sur une session d'une journée.
  const today = useMemo(() => new Date(), [])
  const summary = useMemo(() => getDashboardSummary(dashboardWorkspace, today), [dashboardWorkspace, today])

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
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground">Bonjour{displayName && ` ${displayName}`}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          <span className="capitalize">{format(today, 'EEEE d MMMM', { locale: fr })}</span>
          {' · '}Voici ce qui mérite votre attention aujourd'hui.
        </p>
      </div>

      <div className="grid grid-cols-2 divide-x divide-y divide-border overflow-hidden rounded-xl bg-card shadow-(--shadow-card) ring-1 ring-foreground/[0.06] lg:grid-cols-4 lg:divide-y-0" role="group" aria-label="Résumé du jour">
        <StatCard targetId="actions-du-jour" value={summary.todayActionsCount} label={`action${summary.todayActionsCount !== 1 ? 's' : ''} aujourd'hui`} />
        <StatCard targetId="actions-du-jour" value={summary.pendingResponsesCount} label={`réponse${summary.pendingResponsesCount !== 1 ? 's' : ''} en attente`} />
        <StatCard targetId="alertes" value={summary.planningAlertsCount} label={`alerte${summary.planningAlertsCount !== 1 ? 's' : ''} planning`} />
        <StatCard targetId="mariages-a-surveiller" value={summary.watchedWeddingsCount} label={`mariage${summary.watchedWeddingsCount !== 1 ? 's' : ''} à surveiller`} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Column>
            <TaskDigest />
            <BlockerList />
          </Column>
        </div>
        <Column>
          <RiskWatch />
          <UpcomingEvents />
          <ProfitOverview />
        </Column>
      </div>
    </div>
  )
}
