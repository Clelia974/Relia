import { describe, expect, it } from 'vitest'
import { getBudgetStatus, getWeddingBudgetOverview } from '@/features/finances/budget'
import type { Expense, Vendor, VendorWeddingLink, Wedding } from '@/types/entities'

function makeWedding(overrides: Partial<Wedding> = {}): Wedding {
  return {
    id: 'w1',
    coupleName: 'Test',
    date: '2026-06-06T00:00:00.000Z',
    venue: '',
    soldAmount: 10000,
    clientBudget: 10000,
    status: 'signe',
    archived: false,
    vendorIds: [],
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function makeVendor(overrides: Partial<Vendor> = {}): Vendor {
  return { id: 'v1', name: 'Test', category: 'Autre', status: 'a_contacter', weddingIds: ['w1'], ...overrides }
}

function makeExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: 'e1',
    weddingId: 'w1',
    description: 'Test',
    category: 'autre',
    amount: 100,
    date: '2025-06-01T00:00:00.000Z',
    status: 'engagee',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('getWeddingBudgetOverview', () => {
  it('budget non renseigné → hasClientBudget false, remaining et % à null (jamais 0 ni un faux pourcentage)', () => {
    const wedding = makeWedding({ clientBudget: 0 })
    const overview = getWeddingBudgetOverview(wedding, [], [], [])

    expect(overview.hasClientBudget).toBe(false)
    expect(overview.remainingEstimate).toBeNull()
    expect(overview.budgetUsagePct).toBeNull()
    expect(overview.isOverBudget).toBe(false)
    expect(getBudgetStatus(overview)).toBe('non_configure')
  })

  it('sépare toujours coût prestataire estimé et réel — jamais fusionnés dans les totaux stricts', () => {
    const wedding = makeWedding()
    const vendors = [makeVendor()]
    const links: VendorWeddingLink[] = [{ id: 'l1', vendorId: 'v1', weddingId: 'w1', estimatedCost: 2000, actualCost: 2500 }]

    const overview = getWeddingBudgetOverview(wedding, vendors, links, [])

    expect(overview.vendorEstimatedTotal).toBe(2000)
    expect(overview.vendorActualTotal).toBe(2500)
    // Le "meilleur connu" utilise le réel quand il existe, jamais une addition des deux.
    expect(overview.vendorBestKnownTotal).toBe(2500)
  })

  it('un prestataire sans coût renseigné compte comme manquant, jamais comme un coût de 0', () => {
    const wedding = makeWedding()
    const vendors = [makeVendor()]
    const overview = getWeddingBudgetOverview(wedding, vendors, [], [])

    expect(overview.vendorsMissingCostCount).toBe(1)
    expect(overview.vendorBestKnownTotal).toBe(0)
  })

  it('regroupe les dépenses par statut (prévue/engagée/payée) sans les mélanger', () => {
    const wedding = makeWedding()
    const expenses = [
      makeExpense({ id: 'e1', status: 'prevue', amount: 100 }),
      makeExpense({ id: 'e2', status: 'engagee', amount: 200 }),
      makeExpense({ id: 'e3', status: 'payee', amount: 300 }),
      makeExpense({ id: 'e4', status: 'payee', amount: 50 }),
    ]
    const overview = getWeddingBudgetOverview(wedding, [], [], expenses)

    expect(overview.expensesPlannedTotal).toBe(100)
    expect(overview.expensesCommittedTotal).toBe(200)
    expect(overview.expensesPaidTotal).toBe(350)
    expect(overview.expensesTotal).toBe(650)
  })

  it('trie la répartition par catégorie du montant le plus élevé au plus faible', () => {
    const wedding = makeWedding()
    const expenses = [
      makeExpense({ id: 'e1', category: 'transport', amount: 50 }),
      makeExpense({ id: 'e2', category: 'repas', amount: 500 }),
      makeExpense({ id: 'e3', category: 'transport', amount: 100 }),
    ]
    const overview = getWeddingBudgetOverview(wedding, [], [], expenses)

    expect(overview.expensesByCategory).toEqual([
      { category: 'repas', amount: 500 },
      { category: 'transport', amount: 150 },
    ])
  })

  it('budget dépassé : isOverBudget vrai et statut "depasse"', () => {
    const wedding = makeWedding({ clientBudget: 1000 })
    const vendors = [makeVendor()]
    const links: VendorWeddingLink[] = [{ id: 'l1', vendorId: 'v1', weddingId: 'w1', actualCost: 900 }]
    const expenses = [makeExpense({ amount: 300 })]

    const overview = getWeddingBudgetOverview(wedding, vendors, links, expenses)

    expect(overview.estimatedTotalSpend).toBe(1200)
    expect(overview.remainingEstimate).toBe(-200)
    expect(overview.isOverBudget).toBe(true)
    expect(getBudgetStatus(overview)).toBe('depasse')
  })

  it('statut "attention" à partir de 85 % du budget estimé consommé, "ok" en dessous', () => {
    const vendors = [makeVendor()]

    const atRisk = getWeddingBudgetOverview(
      makeWedding({ clientBudget: 1000 }),
      vendors,
      [{ id: 'l1', vendorId: 'v1', weddingId: 'w1', actualCost: 900 }],
      [],
    )
    expect(getBudgetStatus(atRisk)).toBe('attention')

    const healthy = getWeddingBudgetOverview(
      makeWedding({ clientBudget: 1000 }),
      vendors,
      [{ id: 'l1', vendorId: 'v1', weddingId: 'w1', actualCost: 400 }],
      [],
    )
    expect(getBudgetStatus(healthy)).toBe('ok')
  })
})
