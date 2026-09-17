import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { TriangleAlert } from 'lucide-react'
import { Link, useOutletContext } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { DayOfItemCard } from '@/features/dayof/components/DayOfItemCard'
import { buildDayOfTimeline, filterDayOfTimelineByPhase, findMismatchedDayOfEvents } from '@/features/dayof/dayOfTimeline'
import { DAY_PHASE_LABELS, DAY_PHASE_OPTIONS } from '@/lib/dayPhase'
import { cn } from '@/lib/utils'
import { useWorkspaceStore } from '@/store/workspaceStore'
import type { WeddingOutletContext } from '@/pages/mariages/WeddingLayout'
import type { DayPhase } from '@/types/entities'

export function WeddingDayOfTab() {
  const { wedding } = useOutletContext<WeddingOutletContext>()
  const allTasks = useWorkspaceStore((s) => s.workspace.tasks)
  const allEvents = useWorkspaceStore((s) => s.workspace.timelineEvents)
  const allVendors = useWorkspaceStore((s) => s.workspace.vendors)
  const updateTaskStatus = useWorkspaceStore((s) => s.updateTaskStatus)

  const tasks = allTasks.filter((t) => t.weddingId === wedding.id)
  const events = allEvents.filter((e) => e.weddingId === wedding.id)
  const vendorById = useMemo(() => new Map(allVendors.map((v) => [v.id, v])), [allVendors])

  const [activePhases, setActivePhases] = useState<Set<DayPhase>>(() => new Set(DAY_PHASE_OPTIONS))

  const timeline = useMemo(() => buildDayOfTimeline(wedding.date, tasks, events), [wedding.date, tasks, events])
  const filtered = useMemo(
    () => filterDayOfTimelineByPhase(timeline, activePhases, DAY_PHASE_OPTIONS),
    [timeline, activePhases],
  )
  const mismatchedEvents = useMemo(() => findMismatchedDayOfEvents(wedding.date, events), [wedding.date, events])

  const togglePhase = (phase: DayPhase) => {
    setActivePhases((prev) => {
      const next = new Set(prev)
      if (next.has(phase)) next.delete(phase)
      else next.add(phase)
      return next
    })
  }

  const handleToggleTask = (taskId: string, done: boolean) => {
    updateTaskStatus(taskId, done ? 'terminee' : 'a_faire')
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground">Jour J</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {format(new Date(wedding.date), 'EEEE d MMMM yyyy', { locale: fr })} — déroulé chronologique du mariage.
        </p>
      </div>

      {mismatchedEvents.length > 0 && (
        <div className="flex flex-col gap-1 rounded-lg border border-warning/40 bg-warning-bg px-4 py-3 text-sm text-warning">
          <p className="flex items-center gap-2 font-medium">
            <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
            {mismatchedEvents.length} moment{mismatchedEvents.length > 1 ? 's' : ''} marqué{mismatchedEvents.length > 1 ? 's' : ''} « Jour J » ne
            correspond{mismatchedEvents.length > 1 ? 'ent' : ''} plus à la date actuelle du mariage.
          </p>
          <p className="text-xs">
            {mismatchedEvents.map((e) => e.title).join(', ')} — vérifiez ces moments dans le{' '}
            <Link to={`/mariages/${wedding.id}/planning`} className="underline">
              Planning
            </Link>
            .
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {DAY_PHASE_OPTIONS.map((phase) => (
          <Button
            key={phase}
            type="button"
            variant={activePhases.has(phase) ? 'default' : 'outline'}
            size="sm"
            onClick={() => togglePhase(phase)}
          >
            {DAY_PHASE_LABELS[phase]}
          </Button>
        ))}
      </div>

      {timeline.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
          Aucune tâche ni aucun moment prévu pour le jour du mariage.
        </p>
      ) : filtered.length === 0 ? (
        <p className={cn('rounded-lg border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground')}>
          Aucun élément pour ces filtres.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((item) => {
            const vendorId = item.kind === 'task' ? item.task.vendorId : item.event.vendorId
            return (
              <DayOfItemCard
                key={`${item.kind}-${item.kind === 'task' ? item.task.id : item.event.id}`}
                item={item}
                vendor={vendorId ? vendorById.get(vendorId) : undefined}
                onToggleTask={handleToggleTask}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
