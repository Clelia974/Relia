import { describe, expect, it } from 'vitest'
import { buildCalendarItems, filterCalendarItems, type CalendarToggleFilters } from '@/features/calendar/calendarItems'
import type { Task, TimelineEvent, Wedding } from '@/types/entities'

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
    priority: 'normale',
    dueDate: '2026-06-01T00:00:00.000Z',
    postponedCount: 0,
    postponeHistory: [],
    source: 'manual',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function makeEvent(overrides: Partial<TimelineEvent> & Pick<TimelineEvent, 'id' | 'weddingId'>): TimelineEvent {
  return {
    title: 'Moment test',
    date: '2026-06-06T00:00:00.000Z',
    type: 'jalon',
    status: 'prevu',
    isPhotoMoment: false,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('buildCalendarItems — mariages absents de weddingNameById', () => {
  it('1. produit un item pour un mariage présent dans weddingNameById (mariage actif transmis par le caller)', () => {
    const weddings = [makeWedding({ id: 'w1' })]
    const tasks = [makeTask({ id: 't1', weddingId: 'w1' })]
    const items = buildCalendarItems(weddings, tasks, [], new Map())

    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({ kind: 'task', id: 't1', weddingId: 'w1', weddingName: 'Mariage Test' })
  })

  it("2a. exclut une tâche dont le mariage est absent de weddingNameById (ex. mariage archivé déjà filtré par le caller)", () => {
    // Le caller (CalendrierGlobalPage) ne transmet que les mariages actifs :
    // un mariage archivé n'apparaît donc jamais dans `weddings` ici.
    const tasks = [makeTask({ id: 't1', weddingId: 'w-absent' })]
    const items = buildCalendarItems([], tasks, [], new Map())

    expect(items).toEqual([])
  })

  it('2b. exclut un événement dont le mariage est absent de weddingNameById', () => {
    const events = [makeEvent({ id: 'e1', weddingId: 'w-absent' })]
    const items = buildCalendarItems([], [], events, new Map())

    expect(items).toEqual([])
  })

  it('mélange : seul l\'item du mariage présent est produit', () => {
    const weddings = [makeWedding({ id: 'w1' })]
    const tasks = [makeTask({ id: 't1', weddingId: 'w1' }), makeTask({ id: 't2', weddingId: 'w-absent' })]
    const events = [makeEvent({ id: 'e1', weddingId: 'w1' }), makeEvent({ id: 'e2', weddingId: 'w-absent' })]
    const items = buildCalendarItems(weddings, tasks, events, new Map())

    expect(items.map((i) => i.id).sort()).toEqual(['e1', 't1'])
  })

  it('3. une tâche sans dueDate ou sans weddingId continue d\'être exclue (contrat existant, inchangé)', () => {
    const weddings = [makeWedding({ id: 'w1' })]
    const tasks = [makeTask({ id: 't1', weddingId: 'w1', dueDate: undefined }), makeTask({ id: 't2', weddingId: undefined })]
    const items = buildCalendarItems(weddings, tasks, [], new Map())

    expect(items).toEqual([])
  })
})

describe('filterCalendarItems — mariages et prestataires', () => {
  const weddings = [makeWedding({ id: 'w1', coupleName: 'A' }), makeWedding({ id: 'w2', coupleName: 'B' }), makeWedding({ id: 'w3', coupleName: 'C' })]
  const tasks = [
    makeTask({ id: 't1', weddingId: 'w1', vendorId: 'v1' }),
    makeTask({ id: 't2', weddingId: 'w2', vendorId: 'v2' }),
    makeTask({ id: 't3', weddingId: 'w3' }),
  ]
  const events = [makeEvent({ id: 'e1', weddingId: 'w1', vendorId: 'v2' }), makeEvent({ id: 'e2', weddingId: 'w2' })]
  const all = buildCalendarItems(weddings, tasks, events, new Map())
  const toggles: CalendarToggleFilters = { tasks: true, events: true, alertsOnly: false }
  const ids = (items: ReturnType<typeof filterCalendarItems>) => items.map((i) => i.id).sort()

  it('sans sélection, tout est affiché', () => {
    expect(ids(filterCalendarItems(all, { weddingIds: [], vendorIds: [] }, toggles))).toEqual(['e1', 'e2', 't1', 't2', 't3'])
  })

  it('sélection multiple de mariages', () => {
    expect(ids(filterCalendarItems(all, { weddingIds: ['w1', 'w3'], vendorIds: [] }, toggles))).toEqual(['e1', 't1', 't3'])
  })

  it('filtre par prestataire : tâches et événements liés à ce prestataire seulement', () => {
    expect(ids(filterCalendarItems(all, { weddingIds: [], vendorIds: ['v2'] }, toggles))).toEqual(['e1', 't2'])
  })

  it('un élément sans prestataire est exclu quand un prestataire est sélectionné', () => {
    expect(ids(filterCalendarItems(all, { weddingIds: [], vendorIds: ['v1', 'v2'] }, toggles))).not.toContain('t3')
  })

  it('mariage + prestataire se cumulent (ET)', () => {
    expect(ids(filterCalendarItems(all, { weddingIds: ['w1'], vendorIds: ['v2'] }, toggles))).toEqual(['e1'])
  })

  it('les bascules Tâches / Événements restent appliquées', () => {
    expect(ids(filterCalendarItems(all, { weddingIds: [], vendorIds: [] }, { ...toggles, events: false }))).toEqual(['t1', 't2', 't3'])
  })
})
