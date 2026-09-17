import { describe, expect, it } from 'vitest'
import { getDashboardSummary, getPendingResponses, getTodayActions, getUpcomingEvents } from '@/features/dashboard/summary'
import { createEmptyWorkspace } from '@/lib/workspace/factories'
import type { ClientDecision, Task, TimelineEvent, Wedding, Workspace } from '@/types/entities'

const TODAY = new Date('2026-06-10T09:00:00.000Z')
const YESTERDAY = '2026-06-09T00:00:00.000Z'

function makeWedding(overrides: Partial<Wedding> & Pick<Wedding, 'id'>): Wedding {
  return {
    coupleName: 'Mariage Test',
    date: '2026-06-06T00:00:00.000Z',
    venue: '',
    soldAmount: 0,
    clientBudget: 0,
    status: 'signe',
    archived: false,
    vendorIds: [],
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function makeTask(overrides: Partial<Task> & Pick<Task, 'id'>): Task {
  return {
    title: 'Tâche test',
    status: 'a_faire',
    priority: 'urgente',
    dueDate: YESTERDAY,
    postponedCount: 0,
    postponeHistory: [],
    source: 'manual',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function makeDecision(overrides: Partial<ClientDecision> & Pick<ClientDecision, 'id' | 'weddingId'>): ClientDecision {
  return {
    subject: 'Décision test',
    date: '2025-06-01T00:00:00.000Z',
    pending: true,
    ...overrides,
  }
}

function makeEvent(overrides: Partial<TimelineEvent> & Pick<TimelineEvent, 'id' | 'weddingId'>): TimelineEvent {
  return {
    title: 'Moment test',
    date: '2026-06-12T00:00:00.000Z',
    type: 'jalon',
    status: 'prevu',
    isPhotoMoment: false,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function buildWorkspace(overrides: Partial<Workspace>): Workspace {
  return { ...createEmptyWorkspace(), ...overrides }
}

describe('getTodayActions — exclusion des mariages archivés', () => {
  it('1. exclut une tâche en retard urgente liée à un mariage archivé', () => {
    const workspace = buildWorkspace({
      weddings: [makeWedding({ id: 'w-archived', archived: true })],
      tasks: [makeTask({ id: 't1', weddingId: 'w-archived' })],
    })
    expect(getTodayActions(workspace, TODAY).items).toEqual([])
  })

  it('2. conserve une tâche en retard urgente sans weddingId (tâche générique)', () => {
    const workspace = buildWorkspace({
      weddings: [],
      tasks: [makeTask({ id: 't1', weddingId: undefined })],
    })
    expect(getTodayActions(workspace, TODAY).items.map((t) => t.id)).toEqual(['t1'])
  })

  it("6. un mariage actif continue d'apparaître normalement", () => {
    const workspace = buildWorkspace({
      weddings: [makeWedding({ id: 'w-active', archived: false })],
      tasks: [makeTask({ id: 't1', weddingId: 'w-active' })],
    })
    expect(getTodayActions(workspace, TODAY).items.map((t) => t.id)).toEqual(['t1'])
  })

  it('7. un mariage désarchivé (archived: false) fait réapparaître ses tâches', () => {
    const task = makeTask({ id: 't1', weddingId: 'w1' })
    const archivedWorkspace = buildWorkspace({ weddings: [makeWedding({ id: 'w1', archived: true })], tasks: [task] })
    const unarchivedWorkspace = buildWorkspace({ weddings: [makeWedding({ id: 'w1', archived: false })], tasks: [task] })

    expect(getTodayActions(archivedWorkspace, TODAY).items).toEqual([])
    expect(getTodayActions(unarchivedWorkspace, TODAY).items.map((t) => t.id)).toEqual(['t1'])
  })
})

describe('getPendingResponses — exclusion des mariages archivés', () => {
  it('3. exclut une tâche "en attente" liée à un mariage archivé', () => {
    const workspace = buildWorkspace({
      weddings: [makeWedding({ id: 'w-archived', archived: true })],
      tasks: [makeTask({ id: 't1', weddingId: 'w-archived', status: 'en_attente' })],
    })
    expect(getPendingResponses(workspace).tasks).toEqual([])
  })

  it('conserve une tâche "en attente" sans weddingId', () => {
    const workspace = buildWorkspace({
      tasks: [makeTask({ id: 't1', weddingId: undefined, status: 'en_attente' })],
    })
    expect(getPendingResponses(workspace).tasks.map((t) => t.id)).toEqual(['t1'])
  })

  it('4. exclut une décision client en attente liée à un mariage archivé', () => {
    const workspace = buildWorkspace({
      weddings: [makeWedding({ id: 'w-archived', archived: true })],
      clientDecisions: [makeDecision({ id: 'd1', weddingId: 'w-archived' })],
    })
    expect(getPendingResponses(workspace).decisions).toEqual([])
  })

  it("6. conserve les tâches et décisions d'un mariage actif", () => {
    const workspace = buildWorkspace({
      weddings: [makeWedding({ id: 'w-active', archived: false })],
      tasks: [makeTask({ id: 't1', weddingId: 'w-active', status: 'en_attente' })],
      clientDecisions: [makeDecision({ id: 'd1', weddingId: 'w-active' })],
    })
    const result = getPendingResponses(workspace)
    expect(result.tasks.map((t) => t.id)).toEqual(['t1'])
    expect(result.decisions.map((d) => d.id)).toEqual(['d1'])
    expect(result.total).toBe(2)
  })
})

describe('getUpcomingEvents — exclusion des mariages archivés', () => {
  it("5. exclut un événement lié à un mariage archivé", () => {
    const workspace = buildWorkspace({
      weddings: [makeWedding({ id: 'w-archived', archived: true, date: '2026-06-20T00:00:00.000Z' })],
      timelineEvents: [makeEvent({ id: 'e1', weddingId: 'w-archived' })],
    })
    expect(getUpcomingEvents(workspace, TODAY)).toEqual([])
  })

  it("6. un mariage actif continue d'apparaître normalement", () => {
    const workspace = buildWorkspace({
      weddings: [makeWedding({ id: 'w-active', archived: false, date: '2026-06-20T00:00:00.000Z' })],
      timelineEvents: [makeEvent({ id: 'e1', weddingId: 'w-active' })],
    })
    const entries = getUpcomingEvents(workspace, TODAY)
    expect(entries.some((e) => e.id === 'evenement:e1')).toBe(true)
  })

  it('7. un mariage désarchivé fait réapparaître ses événements', () => {
    const event = makeEvent({ id: 'e1', weddingId: 'w1' })
    const archivedWorkspace = buildWorkspace({ weddings: [makeWedding({ id: 'w1', archived: true })], timelineEvents: [event] })
    const unarchivedWorkspace = buildWorkspace({ weddings: [makeWedding({ id: 'w1', archived: false })], timelineEvents: [event] })

    expect(getUpcomingEvents(archivedWorkspace, TODAY)).toEqual([])
    expect(getUpcomingEvents(unarchivedWorkspace, TODAY).some((e) => e.id === 'evenement:e1')).toBe(true)
  })
})

describe('getDashboardSummary — 8. reflète correctement les compteurs après exclusion', () => {
  it('ne compte ni les actions ni les réponses en attente d\'un mariage archivé', () => {
    const workspace = buildWorkspace({
      weddings: [makeWedding({ id: 'w-archived', archived: true })],
      tasks: [
        makeTask({ id: 't1', weddingId: 'w-archived' }),
        makeTask({ id: 't2', weddingId: 'w-archived', status: 'en_attente' }),
      ],
    })
    const summary = getDashboardSummary(workspace, TODAY)
    expect(summary.hasAnyWedding).toBe(false)
    expect(summary.todayActionsCount).toBe(0)
    expect(summary.pendingResponsesCount).toBe(0)
  })

  it('compte normalement les actions et réponses en attente d\'un mariage actif', () => {
    const workspace = buildWorkspace({
      weddings: [makeWedding({ id: 'w-active', archived: false })],
      tasks: [
        makeTask({ id: 't1', weddingId: 'w-active' }),
        makeTask({ id: 't2', weddingId: 'w-active', status: 'en_attente' }),
      ],
    })
    const summary = getDashboardSummary(workspace, TODAY)
    expect(summary.hasAnyWedding).toBe(true)
    expect(summary.todayActionsCount).toBe(1)
    expect(summary.pendingResponsesCount).toBe(1)
  })
})
