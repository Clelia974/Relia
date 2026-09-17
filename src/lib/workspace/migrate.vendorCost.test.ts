import { describe, expect, it } from 'vitest'
import { migrateWorkspace } from '@/lib/workspace/migrate'
import { createEmptyWorkspace } from '@/lib/workspace/factories'
import { CURRENT_SCHEMA_VERSION } from '@/schemas/workspace'

/**
 * Migration v3→v4 : le coût prestataire passe de Vendor.estimatedCost/actualCost
 * (scalaire, partagé entre tous les mariages liés) à VendorWeddingLink
 * (un coût par relation mariage↔prestataire).
 */
describe('migration v3 -> v4 (coût prestataire par relation)', () => {
  function buildV3Workspace(overrides: { vendors: Record<string, unknown>[] }) {
    const base = createEmptyWorkspace()
    const v3: Record<string, unknown> = { ...base, schemaVersion: 3, vendors: overrides.vendors }
    delete v3.vendorWeddingLinks
    return v3
  }

  it('1. migre un prestataire mono-mariage sans needsCostReview', () => {
    const v3 = buildV3Workspace({
      vendors: [
        {
          id: 'v1',
          name: 'Fleuriste Solo',
          category: 'Fleuriste',
          status: 'a_contacter',
          weddingIds: ['w1'],
          estimatedCost: 500,
          actualCost: 480,
        },
      ],
    })
    v3.weddings = [
      { id: 'w1', coupleName: 'Test', date: '2026-06-06T00:00:00.000Z', venue: '', soldAmount: 0, clientBudget: 0, status: 'signe', archived: false, vendorIds: [], createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z' },
    ]

    const result = migrateWorkspace(v3)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    // La migration ne s'arrête pas à v4 : elle enchaîne jusqu'à CURRENT_SCHEMA_VERSION.
    expect(result.workspace.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
    expect(result.workspace.vendors[0]).not.toHaveProperty('estimatedCost')
    expect(result.workspace.vendors[0]).not.toHaveProperty('actualCost')
    expect(result.workspace.vendorWeddingLinks).toHaveLength(1)
    const link = result.workspace.vendorWeddingLinks[0]
    expect(link.vendorId).toBe('v1')
    expect(link.weddingId).toBe('w1')
    expect(link.estimatedCost).toBe(500)
    expect(link.actualCost).toBe(480)
    expect(link.needsCostReview).toBeUndefined()
  })

  it('2. migre un prestataire partagé — un lien par mariage', () => {
    const v3 = buildV3Workspace({
      vendors: [
        {
          id: 'v1',
          name: 'Traiteur Partagé',
          category: 'Traiteur',
          status: 'confirme',
          weddingIds: ['w1', 'w2'],
          estimatedCost: 4200,
          actualCost: 4200,
        },
      ],
    })
    v3.weddings = [
      { id: 'w1', coupleName: 'A', date: '2026-06-06T00:00:00.000Z', venue: '', soldAmount: 0, clientBudget: 0, status: 'signe', archived: false, vendorIds: [], createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z' },
      { id: 'w2', coupleName: 'B', date: '2026-07-06T00:00:00.000Z', venue: '', soldAmount: 0, clientBudget: 0, status: 'signe', archived: false, vendorIds: [], createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z' },
    ]

    const result = migrateWorkspace(v3)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const links = result.workspace.vendorWeddingLinks
    expect(links).toHaveLength(2)
    const w1Link = links.find((l) => l.weddingId === 'w1')
    const w2Link = links.find((l) => l.weddingId === 'w2')
    expect(w1Link?.estimatedCost).toBe(4200)
    expect(w2Link?.estimatedCost).toBe(4200)
  })

  it('3. les deux liens partagés portent needsCostReview: true', () => {
    const v3 = buildV3Workspace({
      vendors: [
        { id: 'v1', name: 'DJ Partagé', category: 'DJ', status: 'a_contacter', weddingIds: ['w1', 'w2'], estimatedCost: 1000 },
      ],
    })
    v3.weddings = [
      { id: 'w1', coupleName: 'A', date: '2026-06-06T00:00:00.000Z', venue: '', soldAmount: 0, clientBudget: 0, status: 'signe', archived: false, vendorIds: [], createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z' },
      { id: 'w2', coupleName: 'B', date: '2026-07-06T00:00:00.000Z', venue: '', soldAmount: 0, clientBudget: 0, status: 'signe', archived: false, vendorIds: [], createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z' },
    ]

    const result = migrateWorkspace(v3)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const links = result.workspace.vendorWeddingLinks
    expect(links).toHaveLength(2)
    expect(links.every((l) => l.needsCostReview === true)).toBe(true)
  })

  it("13. migration relancée sur le résultat ne crée aucun doublon (idempotence)", () => {
    const v3 = buildV3Workspace({
      vendors: [
        { id: 'v1', name: 'Traiteur', category: 'Traiteur', status: 'confirme', weddingIds: ['w1', 'w2'], estimatedCost: 3000 },
      ],
    })
    v3.weddings = [
      { id: 'w1', coupleName: 'A', date: '2026-06-06T00:00:00.000Z', venue: '', soldAmount: 0, clientBudget: 0, status: 'signe', archived: false, vendorIds: [], createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z' },
      { id: 'w2', coupleName: 'B', date: '2026-07-06T00:00:00.000Z', venue: '', soldAmount: 0, clientBudget: 0, status: 'signe', archived: false, vendorIds: [], createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z' },
    ]

    const first = migrateWorkspace(v3)
    expect(first.ok).toBe(true)
    if (!first.ok) return
    expect(first.workspace.vendorWeddingLinks).toHaveLength(2)

    // Relancer la migration sur le résultat déjà en v4 : schemaVersion === CURRENT,
    // la boucle de migration ne s'exécute pas, donc aucun nouveau lien n'est créé.
    const second = migrateWorkspace(first.workspace)
    expect(second.ok).toBe(true)
    if (!second.ok) return
    expect(second.workspace.vendorWeddingLinks).toHaveLength(2)
    expect(second.workspace.vendorWeddingLinks).toEqual(first.workspace.vendorWeddingLinks)
  })

  it('rejette un VendorWeddingLink orphelin (weddingId absent de vendor.weddingIds)', () => {
    const base = createEmptyWorkspace()
    const v4WithOrphan = {
      ...base,
      vendors: [{ id: 'v1', name: 'Test', category: 'Autre', status: 'a_contacter' as const, weddingIds: [] }],
      vendorWeddingLinks: [{ id: 'link1', vendorId: 'v1', weddingId: 'w-inexistant-pour-ce-vendor', estimatedCost: 100 }],
    }
    const result = migrateWorkspace(v4WithOrphan)
    expect(result.ok).toBe(false)
  })

  it('rejette un doublon de lien pour la même paire (vendorId, weddingId)', () => {
    const base = createEmptyWorkspace()
    const wedding = { id: 'w1', coupleName: 'A', date: '2026-06-06T00:00:00.000Z', venue: '', soldAmount: 0, clientBudget: 0, status: 'signe' as const, archived: false, vendorIds: [], createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z' }
    const vendor = { id: 'v1', name: 'Test', category: 'Autre', status: 'a_contacter' as const, weddingIds: ['w1'] }
    const v4WithDuplicate = {
      ...base,
      weddings: [wedding],
      vendors: [vendor],
      vendorWeddingLinks: [
        { id: 'link1', vendorId: 'v1', weddingId: 'w1', estimatedCost: 100 },
        { id: 'link2', vendorId: 'v1', weddingId: 'w1', estimatedCost: 200 },
      ],
    }
    const result = migrateWorkspace(v4WithDuplicate)
    expect(result.ok).toBe(false)
  })
})
