import { differenceInCalendarDays, format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Check, Circle, History, TriangleAlert } from 'lucide-react'
import { TaskPriorityBadge } from '@/features/tasks/components/TaskPriorityBadge'
import { TaskStatusBadge } from '@/features/tasks/components/TaskStatusBadge'
import { isOverdue } from '@/features/tasks/summary'
import { MILESTONE_LABELS, milestoneBucket, PREPARATION_MILESTONES } from '@/features/timeline/milestones'
import { cn } from '@/lib/utils'
import type { Task, TimelineEvent, Wedding } from '@/types/entities'

interface TimelinePreparationProps {
  wedding: Wedding
  tasks: Task[]
  dayEvents: TimelineEvent[]
  vendorNameById: Map<string, string>
}

interface FriseRow {
  task: Task
  daysBefore: number
}

function friseSymbol(task: Task) {
  if (task.status === 'terminee') return { icon: Check, label: 'Terminé', className: 'text-success' }
  if (task.postponedCount > 0) return { icon: History, label: 'Reporté', className: 'text-warning' }
  if (isOverdue(task)) return { icon: TriangleAlert, label: 'À risque', className: 'text-risk' }
  return { icon: Circle, label: 'À faire', className: 'text-muted-foreground' }
}

export function TimelinePreparation({ wedding, tasks, dayEvents, vendorNameById }: TimelinePreparationProps) {
  const weddingDate = new Date(wedding.date)

  const rows: FriseRow[] = tasks
    .filter((t) => t.dueDate)
    .map((t) => ({ task: t, daysBefore: differenceInCalendarDays(weddingDate, new Date(t.dueDate as string)) }))

  const buckets = new Map<number, FriseRow[]>()
  for (const row of rows) {
    const bucket = milestoneBucket(row.daysBefore)
    if (!buckets.has(bucket)) buckets.set(bucket, [])
    buckets.get(bucket)!.push(row)
  }
  for (const list of buckets.values()) {
    list.sort((a, b) => b.daysBefore - a.daysBefore)
  }

  const hasAnyTask = rows.length > 0

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Check className="size-3.5 text-success" aria-hidden="true" /> Terminé
        </span>
        <span className="flex items-center gap-1">
          <Circle className="size-3.5" aria-hidden="true" /> À faire
        </span>
        <span className="flex items-center gap-1">
          <History className="size-3.5 text-warning" aria-hidden="true" /> Reporté
        </span>
        <span className="flex items-center gap-1">
          <TriangleAlert className="size-3.5 text-risk" aria-hidden="true" /> À risque
        </span>
      </div>

      {!hasAnyTask && dayEvents.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
          Aucune tâche avec échéance ni moment du jour J pour l'instant — la frise se remplira au fil de vos ajouts.
        </p>
      ) : (
        <div className="flex flex-col">
          {PREPARATION_MILESTONES.filter((m) => m !== 0).map((milestone) => {
            const bucketRows = buckets.get(milestone) ?? []
            if (bucketRows.length === 0) return null
            return (
              <section key={milestone} className="relative border-l-2 border-border py-4 pl-5">
                <span className="absolute -left-[7px] top-5 size-3 rounded-full border-2 border-thread bg-background" aria-hidden="true" />
                <h3 className="mb-2 font-heading text-sm font-semibold text-foreground">{MILESTONE_LABELS[milestone]}</h3>
                <ul className="flex flex-col gap-2">
                  {bucketRows.map(({ task, daysBefore }) => {
                    const symbol = friseSymbol(task)
                    return (
                      <li key={task.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                        <symbol.icon className={cn('size-4 shrink-0', symbol.className)} aria-hidden="true" />
                        <span className="text-foreground">{task.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(task.dueDate as string), 'd MMM', { locale: fr })} · J-{daysBefore}
                        </span>
                        <TaskStatusBadge status={task.status} />
                        <TaskPriorityBadge priority={task.priority} />
                        {task.vendorId && vendorNameById.get(task.vendorId) && (
                          <span className="text-xs text-muted-foreground">{vendorNameById.get(task.vendorId)}</span>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </section>
            )
          })}

          <section className="relative border-l-2 border-thread py-4 pl-5">
            <span className="absolute -left-[7px] top-5 size-3 rounded-full border-2 border-thread bg-thread" aria-hidden="true" />
            <h3 className="mb-2 font-heading text-sm font-semibold text-foreground">{MILESTONE_LABELS[0]}</h3>
            <ul className="flex flex-col gap-2">
              {(buckets.get(0) ?? []).map(({ task, daysBefore }) => {
                const symbol = friseSymbol(task)
                return (
                  <li key={task.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                    <symbol.icon className={cn('size-4 shrink-0', symbol.className)} aria-hidden="true" />
                    <span className="text-foreground">{task.title}</span>
                    <span className="text-xs text-muted-foreground">J-{daysBefore}</span>
                    <TaskStatusBadge status={task.status} />
                    <TaskPriorityBadge priority={task.priority} />
                  </li>
                )
              })}
              {dayEvents.length === 0 ? (
                <li className="text-sm text-muted-foreground">Aucun moment du jour J planifié pour l'instant.</li>
              ) : (
                dayEvents
                  .filter((e) => e.startTime)
                  .sort((a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? ''))
                  .map((event) => (
                    <li key={event.id} className="flex items-center gap-2 text-sm text-foreground">
                      <span className="font-mono text-xs text-thread">{event.startTime}</span>
                      {event.title}
                    </li>
                  ))
              )}
            </ul>
          </section>
        </div>
      )}
    </div>
  )
}
