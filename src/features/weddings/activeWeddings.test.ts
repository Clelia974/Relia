import { describe, expect, it } from 'vitest'
import { selectActiveWeddingIds, selectActiveWeddings } from '@/features/weddings/activeWeddings'
import type { Wedding } from '@/types/entities'

function makeWedding(overrides: Partial<Wedding> = {}): Wedding {
  return {
    id: overrides.id ?? 'w1',
    coupleName: 'Camille & Antoine',
    date: '2026-10-04T00:00:00.000Z',
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

describe('selectActiveWeddings', () => {
  it('conserve un mariage actif', () => {
    const active = makeWedding({ id: 'w1', archived: false })
    expect(selectActiveWeddings([active])).toEqual([active])
  })

  it('exclut un mariage archivé', () => {
    const archived = makeWedding({ id: 'w1', archived: true })
    expect(selectActiveWeddings([archived])).toEqual([])
  })

  it('retourne une liste vide pour une liste vide', () => {
    expect(selectActiveWeddings([])).toEqual([])
  })

  it('ne modifie jamais status ni aucune autre donnée du mariage', () => {
    const active = makeWedding({ id: 'w1', archived: false, status: 'signe' })
    const [result] = selectActiveWeddings([active])
    expect(result).toEqual(active)
    expect(result.status).toBe('signe')
  })
})

describe('selectActiveWeddingIds', () => {
  it('retourne uniquement les ids des mariages actifs', () => {
    const active = makeWedding({ id: 'w1', archived: false })
    const archived = makeWedding({ id: 'w2', archived: true })
    const ids = selectActiveWeddingIds([active, archived])
    expect(ids).toEqual(new Set(['w1']))
  })

  it('retourne un Set vide pour une liste vide', () => {
    expect(selectActiveWeddingIds([])).toEqual(new Set())
  })
})
