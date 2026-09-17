import { describe, expect, it } from 'vitest'
import { migrateWorkspace } from '@/lib/workspace/migrate'
import { createEmptyWorkspace } from '@/lib/workspace/factories'

/**
 * Migration v4→v5 (Phase 1) : ajoute soldServices, un tableau vide au départ
 * — aucune donnée existante n'a besoin d'être transformée.
 */
describe('migration v4 -> v5 (prestations vendues)', () => {
  function buildV4Workspace() {
    const base = createEmptyWorkspace()
    const v4: Record<string, unknown> = { ...base, schemaVersion: 4 }
    delete v4.soldServices
    return v4
  }

  it('ajoute un tableau soldServices vide', () => {
    const result = migrateWorkspace(buildV4Workspace())
    expect(result.ok).toBe(true)
    if (!result.ok) return
    // La migration ne s'arrête pas à v5 : elle enchaîne jusqu'à CURRENT_SCHEMA_VERSION (v8 depuis Phase 4).
    expect(result.workspace.schemaVersion).toBe(8)
    expect(result.workspace.soldServices).toEqual([])
  })

  it("préserve les autres données existantes (aucune perte au passage de version)", () => {
    const v4 = buildV4Workspace()
    v4.weddings = [
      {
        id: 'w1',
        coupleName: 'Test',
        date: '2026-06-06T00:00:00.000Z',
        venue: '',
        soldAmount: 1000,
        clientBudget: 1000,
        status: 'signe',
        archived: false,
        vendorIds: [],
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      },
    ]

    const result = migrateWorkspace(v4)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.workspace.weddings).toHaveLength(1)
    expect(result.workspace.weddings[0].coupleName).toBe('Test')
  })

  it('rejette une prestation vendue référençant une proposition inexistante', () => {
    const base = createEmptyWorkspace()
    const withOrphan = {
      ...base,
      soldServices: [
        {
          id: 's1',
          weddingId: 'w-inexistant',
          proposalId: 'p-inexistant',
          title: 'Test',
          soldPrice: 100,
          status: 'incluse',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
      ],
    }
    const result = migrateWorkspace(withOrphan)
    expect(result.ok).toBe(false)
  })
})
