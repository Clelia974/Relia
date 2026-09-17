import { describe, expect, it } from 'vitest'
import { getWeddingFinancials } from '@/features/finances/calculations'
import type { Vendor, VendorWeddingLink, Wedding } from '@/types/entities'

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

describe('getWeddingFinancials — coût par relation', () => {
  it('4. un coût needsCostReview reste inclus dans la marge (jamais masqué ni remplacé par zéro)', () => {
    const wedding = makeWedding()
    const vendors = [makeVendor()]
    const links: VendorWeddingLink[] = [{ id: 'l1', vendorId: 'v1', weddingId: 'w1', estimatedCost: 2000, needsCostReview: true }]

    const financials = getWeddingFinancials(wedding, vendors, links, [], [])

    expect(financials.vendorCosts).toBe(2000)
    expect(financials.hasCostNeedingReview).toBe(true)
    expect(financials.profit).toBe(10000 - 2000)
  })

  it("hasCostNeedingReview reste false quand aucun lien n'est marqué", () => {
    const wedding = makeWedding()
    const vendors = [makeVendor()]
    const links: VendorWeddingLink[] = [{ id: 'l1', vendorId: 'v1', weddingId: 'w1', estimatedCost: 2000 }]

    const financials = getWeddingFinancials(wedding, vendors, links, [], [])
    expect(financials.hasCostNeedingReview).toBe(false)
  })

  it("F. un vendor sans lien pour ce mariage n'ajoute aucun coût et compte comme manquant", () => {
    const wedding = makeWedding()
    const vendors = [makeVendor()]
    const financials = getWeddingFinancials(wedding, vendors, [], [], [])

    expect(financials.vendorCosts).toBe(0)
    expect(financials.missingVendorCostCount).toBe(1)
  })

  it('6. la marge globale (somme portefeuille) correspond exactement à la somme des mariages, sans double comptage', () => {
    // Un même prestataire (v1) lié à w1 et w2, avec un coût DIFFÉRENT par mariage.
    const w1 = makeWedding({ id: 'w1', soldAmount: 8000 })
    const w2 = makeWedding({ id: 'w2', soldAmount: 6000 })
    const vendor = makeVendor({ weddingIds: ['w1', 'w2'] })
    const links: VendorWeddingLink[] = [
      { id: 'l1', vendorId: 'v1', weddingId: 'w1', estimatedCost: 3000 },
      { id: 'l2', vendorId: 'v1', weddingId: 'w2', estimatedCost: 2000 },
    ]

    const f1 = getWeddingFinancials(w1, [vendor], links.filter((l) => l.weddingId === 'w1'), [], [])
    const f2 = getWeddingFinancials(w2, [vendor], links.filter((l) => l.weddingId === 'w2'), [], [])

    expect(f1.vendorCosts).toBe(3000)
    expect(f2.vendorCosts).toBe(2000)

    const portfolioProfit = f1.profit + f2.profit
    const expectedPortfolioProfit = (8000 - 3000) + (6000 - 2000)
    expect(portfolioProfit).toBe(expectedPortfolioProfit)
    // Si le bug (coût scalaire partagé) existait encore, vendorCosts serait 3000
    // dans CHAQUE mariage (le dernier coût écrasant l'autre), pas 3000 puis 2000.
  })
})
