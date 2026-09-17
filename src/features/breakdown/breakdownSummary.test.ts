import { describe, expect, it } from 'vitest'
import { buildBreakdownSummary, groupEquipmentByZone, selectPendingEquipmentItems, UNCLASSIFIED_ZONE } from '@/features/breakdown/breakdownSummary'
import type { EquipmentItem } from '@/types/entities'

function makeItem(overrides: Partial<EquipmentItem> = {}): EquipmentItem {
  return {
    id: overrides.id ?? 'e1',
    weddingId: 'w1',
    name: overrides.name ?? 'Chaises',
    quantity: 1,
    acquisitionMode: 'location',
    status: 'installe',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('selectPendingEquipmentItems', () => {
  it("1. exclut un élément récupéré ET dont la destination est renseignée (entièrement résolu)", () => {
    const items = [makeItem({ id: 'e1', status: 'installe' }), makeItem({ id: 'e2', status: 'recupere', destination: 'stock' })]
    expect(selectPendingEquipmentItems(items, 'w1').map((i) => i.id)).toEqual(['e1'])
  })

  it('2. garde un élément récupéré mais sans destination — il reste actionnable', () => {
    const items = [makeItem({ id: 'e1', status: 'recupere' })]
    expect(selectPendingEquipmentItems(items, 'w1').map((i) => i.id)).toEqual(['e1'])
  })

  it("3. n'affecte jamais les éléments d'un autre mariage", () => {
    const items = [makeItem({ id: 'e1', weddingId: 'w2', status: 'installe' })]
    expect(selectPendingEquipmentItems(items, 'w1')).toHaveLength(0)
  })
})

describe('groupEquipmentByZone', () => {
  it('3. groupe par catégorie', () => {
    const items = [
      makeItem({ id: 'e1', category: 'Fleurs' }),
      makeItem({ id: 'e2', category: 'Fleurs' }),
      makeItem({ id: 'e3', category: 'Textiles' }),
    ]
    const groups = groupEquipmentByZone(items)
    expect(groups.get('Fleurs')).toHaveLength(2)
    expect(groups.get('Textiles')).toHaveLength(1)
  })

  it('4. place les éléments sans catégorie dans "Non classé" plutôt que de les perdre', () => {
    const items = [makeItem({ id: 'e1', category: undefined })]
    const groups = groupEquipmentByZone(items)
    expect(groups.get(UNCLASSIFIED_ZONE)).toHaveLength(1)
  })
})

describe('buildBreakdownSummary', () => {
  it('5. compte total/récupérés/endommagés/destination manquante', () => {
    const items = [
      makeItem({ id: 'e1', status: 'recupere', destination: 'stock' }),
      makeItem({ id: 'e2', status: 'recupere', isDamaged: true }),
      makeItem({ id: 'e3', status: 'installe' }),
    ]
    const summary = buildBreakdownSummary(items, 'w1')
    expect(summary.total).toBe(3)
    expect(summary.returned).toBe(2)
    expect(summary.damaged).toBe(1)
    // e2 est récupéré mais n'a pas de destination.
    expect(summary.missingDestination).toBe(1)
  })

  it("6. ne compte jamais les éléments d'un autre mariage", () => {
    const items = [makeItem({ id: 'e1', weddingId: 'w2', status: 'recupere' })]
    const summary = buildBreakdownSummary(items, 'w1')
    expect(summary.total).toBe(0)
  })

  it('7. compte les zones distinctes', () => {
    const items = [makeItem({ id: 'e1', category: 'Fleurs' }), makeItem({ id: 'e2', category: 'Textiles' })]
    expect(buildBreakdownSummary(items, 'w1').zoneCount).toBe(2)
  })
})
