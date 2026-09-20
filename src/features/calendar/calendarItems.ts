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
    const weddingName = weddingNameById.get(task.weddingId)
    if (!weddingName) continue
    items.push({
      kind: 'task',
      id: task.id,
      weddingId: task.weddingId,
      weddingName,
      date: task.dueDate,
      task,
      isAlert: isOverdue(task),
    })
  }

  for (const event of events) {
    const weddingName = weddingNameById.get(event.weddingId)
    if (!weddingName) continue
    const conflicts = conflictsByWedding.get(event.weddingId) ?? []
    const isAlert = conflicts.some((c) => !c.ignored && c.eventIds.includes(event.id))
    items.push({
      kind: 'event',
      id: event.id,
      weddingId: event.weddingId,
      weddingName,
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

export interface CalendarToggleFilters {
  tasks: boolean
  events: boolean
  alertsOnly: boolean
}

/** Sélection multiple : un tableau vide signifie « pas de filtre » (tout est affiché). */
export interface CalendarSelection {
  weddingIds: string[]
  vendorIds: string[]
}

export function calendarItemVendorId(item: CalendarItem): string | undefined {
  return item.kind === 'task' ? item.task.vendorId : item.event.vendorId
}

export function filterCalendarItems(items: CalendarItem[], selection: CalendarSelection, toggles: CalendarToggleFilters): CalendarItem[] {
  return items
    .filter((item) => selection.weddingIds.length === 0 || selection.weddingIds.includes(item.weddingId))
    .filter((item) => {
      if (selection.vendorIds.length === 0) return true
      const vendorId = calendarItemVendorId(item)
      return vendorId !== undefined && selection.vendorIds.includes(vendorId)
    })
    .filter((item) => (item.kind === 'task' ? toggles.tasks : toggles.events))
    .filter((item) => !toggles.alertsOnly || item.isAlert)
}
