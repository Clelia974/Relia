import { describe, expect, it } from 'vitest'
import { buildClosingReport, computeClosingSummary } from '@/features/closing/closingSummary'
import type { ClosingSession, EquipmentItem, Task, Vendor, Wedding } from '@/types/entities'

function makeWedding(overrides: Partial<Wedding> = {}): Wedding {
  return {
    id: 'w1',
    coupleName: 'Test',
    date: '2026-06-06T00:00:00.000Z',
    venue: 'Domaine',
    soldAmount: 5000,
    clientBudget: 5000,
    status: 'semaine_j',
    archived: false,
    vendorIds: [],
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 't1',
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

function makeItem(overrides: Partial<EquipmentItem> = {}): EquipmentItem {
  return {
    id: 'e1',
    weddingId: 'w1',
    name: 'Chaises',
    quantity: 80,
    acquisitionMode: 'location',
    status: 'installe',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('computeClosingSummary', () => {
  it('compte les tâches complétées et le matériel récupéré/endommagé', () => {
    const wedding = makeWedding()
    const tasks = [makeTask({ id: 't1', status: 'terminee' }), makeTask({ id: 't2', status: 'a_faire' })]
    const items = [
      makeItem({ id: 'e1', status: 'recupere' }),
      makeItem({ id: 'e2', status: 'installe', isDamaged: true }),
    ]

    const summary = computeClosingSummary(wedding, tasks, items, [], [], [], [])

    expect(summary.completedTasks).toBe(1)
    expect(summary.totalTasks).toBe(2)
    expect(summary.recoveredEquipment).toBe(1)
    expect(summary.totalEquipment).toBe(2)
    expect(summary.damagedEquipment).toBe(1)
    expect(summary.pendingEquipment).toBe(1)
  })

  it('reprend les mêmes chiffres financiers que getWeddingFinancials (revenu, coûts, marge)', () => {
    const wedding = makeWedding({ soldAmount: 1000 })
    const vendors: Vendor[] = [{ id: 'v1', name: 'Traiteur', category: 'Traiteur', status: 'confirme', weddingIds: ['w1'] }]
    const vendorLinks = [{ id: 'l1', vendorId: 'v1', weddingId: 'w1', actualCost: 400 }]

    const summary = computeClosingSummary(wedding, [], [], vendors, vendorLinks, [], [])

    expect(summary.approvedRevenue).toBe(1000)
    expect(summary.totalCosts).toBe(400)
    expect(summary.profit).toBe(600)
    expect(summary.marginPct).toBe(60)
  })

  it('renvoie des compteurs à zéro pour un mariage sans tâche ni matériel', () => {
    const summary = computeClosingSummary(makeWedding({ soldAmount: 0 }), [], [], [], [], [], [])
    expect(summary.totalTasks).toBe(0)
    expect(summary.totalEquipment).toBe(0)
    expect(summary.approvedRevenue).toBe(0)
  })
})

describe('buildClosingReport', () => {
  function makeClosing(overrides: Partial<ClosingSession> = {}): ClosingSession {
    return {
      id: 'c1',
      weddingId: 'w1',
      closingDate: '2026-06-07T00:00:00.000Z',
      portfolioImages: [],
      summary: {
        completedTasks: 1,
        totalTasks: 2,
        recoveredEquipment: 1,
        totalEquipment: 2,
        damagedEquipment: 0,
        pendingEquipment: 1,
        approvedRevenue: 1000,
        totalCosts: 400,
        profit: 600,
        marginPct: 60,
      },
      createdAt: '2026-06-07T00:00:00.000Z',
      updatedAt: '2026-06-07T00:00:00.000Z',
      ...overrides,
    }
  }

  it('groupe le matériel par zone et liste les tâches non complétées avec le nom du prestataire', () => {
    const wedding = makeWedding()
    const closing = makeClosing()
    const tasks = [
      makeTask({ id: 't1', title: 'Rangement', status: 'a_faire', vendorId: 'v1' }),
      makeTask({ id: 't2', title: 'Fait', status: 'terminee' }),
    ]
    const items = [makeItem({ category: 'Réception' }), makeItem({ id: 'e2', category: 'Cérémonie', name: 'Guirlandes' })]
    const vendorById = new Map([['v1', { id: 'v1', name: 'Équipe montage', category: 'Autre', status: 'confirme' as const, weddingIds: ['w1'] }]])

    const report = buildClosingReport(wedding, closing, tasks, items, vendorById)

    expect(report.tasks.pending).toEqual([{ title: 'Rangement', dueDate: undefined, vendorName: 'Équipe montage' }])
    expect(report.equipment.byZone['Réception']).toHaveLength(1)
    expect(report.equipment.byZone['Cérémonie']).toHaveLength(1)
    expect(report.financials.marginPct).toBe(60)
    expect(report.closing.portfolioImageCount).toBe(0)
  })
})
