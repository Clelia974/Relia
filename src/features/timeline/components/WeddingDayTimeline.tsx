import { format, isSameDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import { TimelineEventCard } from '@/features/timeline/components/TimelineEventCard'
import { TaskPriorityBadge } from '@/features/tasks/components/TaskPriorityBadge'
import { TaskStatusBadge } from '@/features/tasks/components/TaskStatusBadge'
import type { TimelineConflict } from '@/features/timeline/conflicts'
import { cn } from '@/lib/utils'
import type { Task, TimelineEvent, Wedding } from '@/types/entities'

interface WeddingDayTimelineProps {
  wedding: Wedding
  events: TimelineEvent[]
  tasks: Task[]
  vendorNameById: Map<string, string>
  conflicts: TimelineConflict[]
  onEditEvent: (event: TimelineEvent) => void
  onDeleteEvent: (event: TimelineEvent) => void
}

export function WeddingDayTimeline({ wedding, events, tasks, vendorNameById, conflicts, onEditEvent, onDeleteEvent }: WeddingDayTimelineProps) {
  const weddingDate = new Date(wedding.date)
  const dates = [...new Set(events.map((e) => e.date.slice(0, 10)))].sort()

  const tasksByDate = new Map<string, Task[]>()
  for (const task of tasks) {
    if (!task.dueDate) continue
    const key = task.dueDate.slice(0, 10)
    if (!tasksByDate.has(key)) tasksByDate.set(key, [])
    tasksByDate.get(key)!.push(task)
  }
  for (const taskDate of tasksByDate.keys()) {
    if (!dates.includes(taskDate)) dates.push(taskDate)
  }
  dates.sort()

  const conflictedEventIds = new Set(conflicts.flatMap((c) => c.eventIds))

  if (dates.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
        Aucun moment planifié pour l'instant — ajoutez un moment pour construire le déroulé du jour J.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {dates.map((dateKey) => {
        const dateEvents = events
          .filter((e) => e.date.slice(0, 10) === dateKey)
          .sort((a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? ''))
        const dateTasks = tasksByDate.get(dateKey) ?? []
        const isWeddingDay = isSameDay(new Date(dateKey), weddingDate)

        return (
          <section key={dateKey} className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <h3 className={cn('font-heading text-base font-semibold capitalize', isWeddingDay ? 'text-thread' : 'text-foreground')}>
                {format(new Date(dateKey), 'EEEE d MMMM yyyy', { locale: fr })}
              </h3>
              {isWeddingDay && (
                <span className="rounded-full bg-thread/15 px-2 py-0.5 text-xs font-medium text-thread">Jour J</span>
              )}
            </div>

            {dateEvents.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2">
                {dateEvents.map((event) => (
                  <TimelineEventCard
                    key={event.id}
                    event={event}
                    vendorName={event.vendorId ? vendorNameById.get(event.vendorId) : undefined}
                    hasConflict={conflictedEventIds.has(event.id)}
                    onEdit={onEditEvent}
                    onDelete={onDeleteEvent}
                  />
                ))}
              </div>
            )}

            {dateTasks.length > 0 && (
              <div className="flex flex-col gap-1.5 rounded-lg border border-dashed border-border p-3">
                <p className="text-xs font-medium text-muted-foreground">Échéances de tâches ce jour</p>
                {dateTasks.map((task) => (
                  <div key={task.id} className="flex flex-wrap items-center gap-2 text-sm">
                    <span className={cn('text-foreground', task.status === 'terminee' && 'text-muted-foreground line-through')}>
                      {task.title}
                    </span>
                    <TaskStatusBadge status={task.status} />
                    <TaskPriorityBadge priority={task.priority} />
                  </div>
                ))}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
