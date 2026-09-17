import { detectTimelineConflicts, DEFAULT_MIN_BUFFER_MINUTES, type TimelineConflict } from '@/features/timeline/conflicts'
import { isOverdue } from '@/features/tasks/summary'
import type { Task, TimelineEvent, Wedding } from '@/types/entities'

export type CalendarItem =
  | { kind: 'task'; id: string; weddingId: string; weddingName: string; date: string; task: Task; isAlert: boolean }
  | { kind: 'event'; id: string; weddingId: string; weddingName: string; date: string; event: TimelineEvent; isAlert: boolean }

/** Calcule les conflits mariage par mariage — un conflit n'a de sens qu'entre événements d'un même mariage. */
export function computeConflictsByWedding(
  weddings: Wedding[],
  events: TimelineEvent[],
  ignoredConflictIds: string[],
): Map<string, TimelineConflict[]> {
  const result = new Map<string, TimelineConflict[]>()
  for (const wedding of weddings) {
    const weddingEvents = events.filter((e) => e.weddingId === wedding.id)
    result.set(
      wedding.id,
      detectTimelineConflicts(weddingEvents, {
        minBufferMinutes: wedding.minBufferMinutes ?? DEFAULT_MIN_BUFFER_MINUTES,
        ignoredConflictIds,
      }),
    )
  }
  return result
}

export function buildCalendarItems(
  weddings: Wedding[],
  tasks: Task[],
  events: TimelineEvent[],
  conflictsByWedding: Map<string, TimelineConflict[]>,
): CalendarItem[] {
  const weddingNameById = new Map(weddings.map((w) => [w.id, w.coupleName]))
  const items: CalendarItem[] = []

  for (const task of tasks) {
    if (!task.dueDate || !task.weddingId) continue
    items.push({
      kind: 'task',
      id: task.id,
      weddingId: task.weddingId,
      weddingName: weddingNameById.get(task.weddingId) ?? '—',
      date: task.dueDate,
      task,
      isAlert: isOverdue(task),
    })
  }

  for (const event of events) {
    const conflicts = conflictsByWedding.get(event.weddingId) ?? []
    const isAlert = conflicts.some((c) => !c.ignored && c.eventIds.includes(event.id))
    items.push({
      kind: 'event',
      id: event.id,
      weddingId: event.weddingId,
      weddingName: weddingNameById.get(event.weddingId) ?? '—',
      date: event.date,
      event,
      isAlert,
    })
  }

  return items.sort((a, b) => {
    const dateDiff = a.date.slice(0, 10).localeCompare(b.date.slice(0, 10))
    if (dateDiff !== 0) return dateDiff
    const aTime = a.kind === 'event' ? (a.event.startTime ?? '') : ''
    const bTime = b.kind === 'event' ? (b.event.startTime ?? '') : ''
    return aTime.localeCompare(bTime)
  })
}
