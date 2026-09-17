import { describe, expect, it } from 'vitest'
import { buildDayOfTimeline, filterDayOfTimelineByPhase, findMismatchedDayOfEvents } from '@/features/dayof/dayOfTimeline'
import { DAY_PHASE_OPTIONS } from '@/lib/dayPhase'
import type { Task, TimelineEvent } from '@/types/entities'

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: overrides.id ?? 't1',
    title: overrides.title ?? 'Tâche',
    status: 'a_faire',
    priority: 'normale',
    weddingId: 'w1',
    postponedCount: 0,
    postponeHistory: [],
    source: 'manual',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function makeEvent(overrides: Partial<TimelineEvent> = {}): TimelineEvent {
  return {
    id: overrides.id ?? 'e1',
    weddingId: 'w1',
    title: overrides.title ?? 'Moment',
    date: '2026-06-06T00:00:00.000Z',
    isPhotoMoment: false,
    type: 'jour_j',
    status: 'prevu',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('buildDayOfTimeline', () => {
  it('1. fusionne tâches et moments du jour en une seule liste triée chronologiquement', () => {
    const tasks = [makeTask({ id: 't1', title: 'Tâche 14h', dueDate: '2026-06-06T14:00:00.000Z' })]
    const events = [
      makeEvent({ id: 'e1', title: 'Cérémonie 15h', date: '2026-06-06T00:00:00.000Z', startTime: '15:00', endTime: '15:30' }),
      makeEvent({ id: 'e2', title: 'Installation 08h', date: '2026-06-06T00:00:00.000Z', startTime: '08:00', endTime: '10:00' }),
    ]

    const timeline = buildDayOfTimeline('2026-06-06T00:00:00.000Z', tasks, events)

    expect(timeline.map((i) => (i.kind === 'task' ? i.task.title : i.event.title))).toEqual([
      'Installation 08h',
      'Tâche 14h',
      'Cérémonie 15h',
    ])
  })

  it("2. exclut les tâches et moments d'un autre jour", () => {
    const tasks = [makeTask({ dueDate: '2026-06-07T00:00:00.000Z' })]
    const events = [makeEvent({ date: '2026-06-05T00:00:00.000Z' })]

    const timeline = buildDayOfTimeline('2026-06-06T00:00:00.000Z', tasks, events)
    expect(timeline).toHaveLength(0)
  })

  it('3. place un moment sans heure de début en tête de liste (00:00)', () => {
    const events = [
      makeEvent({ id: 'e1', title: 'Sans heure', date: '2026-06-06T00:00:00.000Z' }),
      makeEvent({ id: 'e2', title: 'Avec heure', date: '2026-06-06T00:00:00.000Z', startTime: '09:00', endTime: '10:00' }),
    ]
    const timeline = buildDayOfTimeline('2026-06-06T00:00:00.000Z', [], events)
    expect(timeline[0].kind === 'event' && timeline[0].event.title).toBe('Sans heure')
  })

  it("4. une tâche sans échéance n'apparaît jamais dans la vue jour J", () => {
    const tasks = [makeTask({ dueDate: undefined })]
    const timeline = buildDayOfTimeline('2026-06-06T00:00:00.000Z', tasks, [])
    expect(timeline).toHaveLength(0)
  })
})

describe('filterDayOfTimelineByPhase', () => {
  const allPhases = new Set(DAY_PHASE_OPTIONS)

  it("5. montre tout, y compris les items sans phase, quand tous les filtres sont actifs", () => {
    const items = buildDayOfTimeline(
      '2026-06-06T00:00:00.000Z',
      [makeTask({ dueDate: '2026-06-06T08:00:00.000Z' })],
      [],
    )
    expect(filterDayOfTimelineByPhase(items, allPhases, DAY_PHASE_OPTIONS)).toHaveLength(1)
  })

  it('6. exclut les items sans phase dès que le filtre est restreint', () => {
    const items = buildDayOfTimeline(
      '2026-06-06T00:00:00.000Z',
      [makeTask({ dueDate: '2026-06-06T08:00:00.000Z' })],
      [],
    )
    const restricted = new Set<'installation'>(['installation'])
    expect(filterDayOfTimelineByPhase(items, restricted, DAY_PHASE_OPTIONS)).toHaveLength(0)
  })

  it("7. garde un item dont la phase correspond au filtre restreint", () => {
    const items = buildDayOfTimeline(
      '2026-06-06T00:00:00.000Z',
      [makeTask({ dueDate: '2026-06-06T08:00:00.000Z', phase: 'installation' })],
      [],
    )
    const restricted = new Set<'installation'>(['installation'])
    expect(filterDayOfTimelineByPhase(items, restricted, DAY_PHASE_OPTIONS)).toHaveLength(1)
  })
})

describe('findMismatchedDayOfEvents', () => {
  it('8. signale un moment "jour_j" dont la date ne correspond plus au mariage', () => {
    const events = [makeEvent({ type: 'jour_j', date: '2026-06-05T00:00:00.000Z' })]
    const mismatched = findMismatchedDayOfEvents('2026-06-06T00:00:00.000Z', events)
    expect(mismatched).toHaveLength(1)
  })

  it("9. ignore un moment de préparation (type 'jalon') même daté différemment", () => {
    const events = [makeEvent({ type: 'jalon', date: '2026-05-01T00:00:00.000Z' })]
    const mismatched = findMismatchedDayOfEvents('2026-06-06T00:00:00.000Z', events)
    expect(mismatched).toHaveLength(0)
  })

  it('10. ne signale rien quand la date correspond', () => {
    const events = [makeEvent({ type: 'jour_j', date: '2026-06-06T00:00:00.000Z' })]
    const mismatched = findMismatchedDayOfEvents('2026-06-06T00:00:00.000Z', events)
    expect(mismatched).toHaveLength(0)
  })
})
