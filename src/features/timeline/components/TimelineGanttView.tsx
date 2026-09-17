import { format, isSameDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { TIMELINE_EVENT_STATUS_LABELS } from '@/lib/timelineEventStatus'
import type { TimelineConflict } from '@/features/timeline/conflicts'
import type { Task, TimelineEvent, Wedding } from '@/types/entities'

interface TimelineGanttViewProps {
  wedding: Wedding
  events: TimelineEvent[]
  tasks: Task[]
  vendorNameById: Map<string, string>
  conflicts: TimelineConflict[]
  onEditEvent: (event: TimelineEvent) => void
}

const STATUS_BAR_TONE: Record<TimelineEvent['status'], string> = {
  prevu: 'bg-thread',
  confirme: 'bg-success',
  a_verifier: 'bg-warning',
  termine: 'bg-success',
}

function timeToMinutes(time: string) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function minutesToLabel(minutes: number) {
  const h = Math.floor(minutes / 60) % 24
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function TimelineGanttView({ wedding, events, tasks, vendorNameById, conflicts, onEditEvent }: TimelineGanttViewProps) {
  const weddingDate = new Date(wedding.date)
  const timedEvents = events.filter((e) => e.startTime && e.endTime)
  const dates = [...new Set(timedEvents.map((e) => e.date.slice(0, 10)))].sort()

  const tasksByDate = new Map<string, Task[]>()
  for (const task of tasks) {
    if (!task.dueDate) continue
    const key = task.dueDate.slice(0, 10)
    if (!tasksByDate.has(key)) tasksByDate.set(key, [])
    tasksByDate.get(key)!.push(task)
  }

  const conflictedEventIds = new Set(conflicts.flatMap((c) => c.eventIds))
  const untimedCount = events.length - timedEvents.length

  if (dates.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
        Aucun moment avec horaire pour l'instant — ajoutez un moment avec une heure de début et de fin pour construire le diagramme de Gantt.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {untimedCount > 0 && (
        <p className="text-xs text-muted-foreground">
          {untimedCount} moment{untimedCount > 1 ? 's' : ''} sans horaire {untimedCount > 1 ? 'ne sont pas affichés' : "n'est pas affiché"} dans le Gantt.
        </p>
      )}

      {dates.map((dateKey) => {
        const dateEvents = timedEvents
          .filter((e) => e.date.slice(0, 10) === dateKey)
          .sort((a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? ''))
        const dateTasks = tasksByDate.get(dateKey) ?? []
        const isWeddingDay = isSameDay(new Date(dateKey), weddingDate)

        const starts = dateEvents.map((e) => timeToMinutes(e.startTime!))
        const ends = dateEvents.map((e) => timeToMinutes(e.endTime!))
        const rangeStart = Math.floor(Math.min(...starts) / 60) * 60
        const rangeEnd = Math.max(Math.ceil(Math.max(...ends) / 60) * 60, rangeStart + 60)
        const totalMinutes = rangeEnd - rangeStart
        const hourTicks: number[] = []
        for (let t = rangeStart; t <= rangeEnd; t += 60) hourTicks.push(t)

        return (
          <section key={dateKey} className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <h3 className={cn('font-heading text-base font-semibold capitalize', isWeddingDay ? 'text-thread' : 'text-foreground')}>
                {format(new Date(dateKey), 'EEEE d MMMM yyyy', { locale: fr })}
              </h3>
              {isWeddingDay && <span className="rounded-full bg-thread/15 px-2 py-0.5 text-xs font-medium text-thread">Jour J</span>}
            </div>

            <div className="overflow-x-auto rounded-lg border border-border">
              <div className="min-w-[720px]">
                <div className="flex border-b border-border bg-muted/40">
                  <div className="w-44 shrink-0" />
                  <div className="relative h-8 flex-1">
                    {hourTicks.map((t) => (
                      <span
                        key={t}
                        className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 text-[11px] tabular-nums text-muted-foreground"
                        style={{ left: `${((t - rangeStart) / totalMinutes) * 100}%` }}
                      >
                        {minutesToLabel(t)}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col divide-y divide-border">
                  {dateEvents.map((event) => {
                    const start = timeToMinutes(event.startTime!)
                    const end = timeToMinutes(event.endTime!)
                    const left = ((start - rangeStart) / totalMinutes) * 100
                    const width = Math.max(((end - start) / totalMinutes) * 100, 3)
                    const hasConflict = conflictedEventIds.has(event.id)
                    const vendorName = event.vendorId ? vendorNameById.get(event.vendorId) : undefined

                    return (
                      <div key={event.id} className="flex items-center gap-2 py-2">
                        <div className="w-44 shrink-0 truncate pl-3 pr-2">
                          <p className="truncate text-sm font-medium text-foreground">{event.title}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {event.startTime}–{event.endTime}
                            {vendorName ? ` · ${vendorName}` : ''}
                          </p>
                        </div>
                        <div className="relative h-7 flex-1">
                          {hourTicks.map((t) => (
                            <div
                              key={t}
                              className="absolute top-0 h-full w-px bg-border/60"
                              style={{ left: `${((t - rangeStart) / totalMinutes) * 100}%` }}
                            />
                          ))}
                          <button
                            type="button"
                            onClick={() => onEditEvent(event)}
                            title={`${event.title} (${event.startTime}–${event.endTime})`}
                            className={cn(
                              'absolute top-1 flex h-5 items-center overflow-hidden rounded px-1.5 text-[11px] font-medium text-primary-foreground hover:opacity-90',
                              STATUS_BAR_TONE[event.status],
                              hasConflict && 'ring-2 ring-risk ring-offset-1 ring-offset-card',
                            )}
                            style={{ left: `${left}%`, width: `${width}%` }}
                          >
                            <span className="truncate">{event.title}</span>
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-thread" aria-hidden="true" />
                {TIMELINE_EVENT_STATUS_LABELS.prevu}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-success" aria-hidden="true" />
                {TIMELINE_EVENT_STATUS_LABELS.confirme}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-warning" aria-hidden="true" />
                {TIMELINE_EVENT_STATUS_LABELS.a_verifier}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm ring-2 ring-risk" aria-hidden="true" />
                Conflit détecté
              </span>
            </div>

            {dateTasks.length > 0 && (
              <div className="flex flex-col gap-1.5 rounded-lg border border-dashed border-border p-3">
                <p className="text-xs font-medium text-muted-foreground">Échéances de tâches ce jour</p>
                {dateTasks.map((task) => (
                  <span key={task.id} className={cn('text-sm text-foreground', task.status === 'terminee' && 'text-muted-foreground line-through')}>
                    {task.title}
                  </span>
                ))}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
