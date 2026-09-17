import { absoluteInstant, toMinutesSinceMidnight } from '@/features/timeline/timeRange'
import type { DayPhase, Task, TimelineEvent } from '@/types/entities'

export type DayOfItem =
  | { kind: 'event'; event: TimelineEvent; instant: number }
  | { kind: 'task'; task: Task; instant: number }

/**
 * Fusionne tâches (échéance ce jour) et moments de planning (ce jour) en une
 * seule liste chronologique — jamais deux listes séparées, cf. Phase 3
 * ("vue chronologique tâches/événements"). Un moment sans heure de début est
 * placé à minuit (00:00) plutôt qu'exclu : il reste visible, simplement en
 * tête de liste.
 */
export function buildDayOfTimeline(dayIso: string, tasks: Task[], events: TimelineEvent[]): DayOfItem[] {
  const day = dayIso.slice(0, 10)
  const dayEvents = events.filter((e) => e.date.slice(0, 10) === day)
  const dayTasks = tasks.filter((t) => t.dueDate && t.dueDate.slice(0, 10) === day)

  const items: DayOfItem[] = [
    ...dayEvents.map((event) => {
      const minutes = event.startTime ? toMinutesSinceMidnight(event.startTime) : null
      return { kind: 'event' as const, event, instant: absoluteInstant(event.date, minutes ?? 0) }
    }),
    ...dayTasks.map((task) => ({ kind: 'task' as const, task, instant: new Date(task.dueDate as string).getTime() })),
  ]

  return items.sort((a, b) => a.instant - b.instant)
}

/** Filtre une liste déjà construite par buildDayOfTimeline selon les phases actives. Un item sans phase reste visible tant que tous les filtres sont actifs (rien n'est encore exclu) ; dès qu'un filtre est décoché, seuls les items classés dans une phase active restent. */
export function filterDayOfTimelineByPhase(items: DayOfItem[], activePhases: ReadonlySet<DayPhase>, allPhases: readonly DayPhase[]): DayOfItem[] {
  if (activePhases.size >= allPhases.length) return items
  return items.filter((item) => {
    const phase = item.kind === 'event' ? item.event.phase : item.task.phase
    return phase !== undefined && activePhases.has(phase)
  })
}

/**
 * Moments explicitement marqués "Jour J" (type === 'jour_j') dont la date ne
 * correspond plus à la date actuelle du mariage — signale un décalage après
 * un changement de date du mariage, cf. règle produit Phase 3 ("avertissement
 * si événements ne correspondent plus à la date du mariage"). Ces moments
 * n'apparaîtront pas sur la Vue Jour J tant qu'ils ne sont pas corrigés.
 */
export function findMismatchedDayOfEvents(weddingDate: string, events: TimelineEvent[]): TimelineEvent[] {
  const weddingDay = weddingDate.slice(0, 10)
  return events.filter((e) => e.type === 'jour_j' && e.date.slice(0, 10) !== weddingDay)
}
