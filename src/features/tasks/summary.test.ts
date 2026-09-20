import { describe, expect, it } from 'vitest'
import { computeTaskSummaryCounts, isUrgentActive, isWaitingOnPayment } from '@/features/tasks/summary'
import type { Task } from '@/types/entities'

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: `t-${Math.random()}`,
    title: 'Tâche',
    status: 'a_faire',
    priority: 'normale',
    postponedCount: 0,
    postponeHistory: [],
    source: 'manual',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  }
}

const today = new Date('2026-06-15T00:00:00.000Z')

describe('computeTaskSummaryCounts', () => {
  it('aucune tâche : tous les compteurs à zéro', () => {
    expect(computeTaskSummaryCounts([], today)).toEqual({
      total: 0,
      aFaire: 0,
      enRetard: 0,
      urgentes: 0,
      attentePaiement: 0,
    })
  })

  it('une seule tâche à faire, non urgente, non en retard, non en attente', () => {
    const counts = computeTaskSummaryCounts([makeTask({ dueDate: '2026-07-01T00:00:00.000Z' })], today)
    expect(counts).toEqual({ total: 1, aFaire: 1, enRetard: 0, urgentes: 0, attentePaiement: 0 })
  })

  it('une tâche par statut : seul "a_faire" compte dans aFaire', () => {
    const tasks = (['a_preparer', 'a_faire', 'en_cours', 'en_attente', 'terminee'] as const).map((status) =>
      makeTask({ status }),
    )
    const counts = computeTaskSummaryCounts(tasks, today)
    expect(counts.total).toBe(5)
    expect(counts.aFaire).toBe(1)
  })

  it('tâche urgente active comptée, urgente terminée exclue', () => {
    const tasks = [
      makeTask({ priority: 'urgente', status: 'a_faire' }),
      makeTask({ priority: 'urgente', status: 'terminee' }),
      makeTask({ priority: 'haute', status: 'a_faire' }),
    ]
    expect(computeTaskSummaryCounts(tasks, today).urgentes).toBe(1)
  })

  it('tâche en retard (échéance passée, statut actif) comptée ; jamais une tâche en_attente ou terminée', () => {
    const tasks = [
      makeTask({ dueDate: '2026-06-01T00:00:00.000Z', status: 'a_faire' }),
      makeTask({ dueDate: '2026-06-01T00:00:00.000Z', status: 'en_attente' }),
      makeTask({ dueDate: '2026-06-01T00:00:00.000Z', status: 'terminee' }),
      makeTask({ dueDate: '2026-07-01T00:00:00.000Z', status: 'a_faire' }),
    ]
    expect(computeTaskSummaryCounts(tasks, today).enRetard).toBe(1)
  })

  it('"en attente d\'un paiement" exige waitingOn=paiement ET status=en_attente — jamais l\'un sans l\'autre', () => {
    const tasks = [
      makeTask({ status: 'en_attente', waitingOn: 'paiement' }),
      makeTask({ status: 'en_attente', waitingOn: 'client' }),
      makeTask({ status: 'a_faire', waitingOn: 'paiement' }),
    ]
    expect(computeTaskSummaryCounts(tasks, today).attentePaiement).toBe(1)
  })
})

describe('isUrgentActive / isWaitingOnPayment', () => {
  it('isUrgentActive : faux pour une tâche urgente déjà terminée', () => {
    expect(isUrgentActive(makeTask({ priority: 'urgente', status: 'terminee' }))).toBe(false)
    expect(isUrgentActive(makeTask({ priority: 'urgente', status: 'en_cours' }))).toBe(true)
  })

  it("isWaitingOnPayment : faux si waitingOn n'est pas renseigné même en_attente", () => {
    expect(isWaitingOnPayment(makeTask({ status: 'en_attente' }))).toBe(false)
    expect(isWaitingOnPayment(makeTask({ status: 'en_attente', waitingOn: 'paiement' }))).toBe(true)
  })
})
