import { describe, expect, it } from 'vitest'
import { migrateWorkspace } from '@/lib/workspace/migrate'
import { createEmptyWorkspace } from '@/lib/workspace/factories'

/**
 * Migration v5→v6 (Phase 2) : ajoute la checklist matériel (EquipmentItem),
 * un tableau vide au départ — aucune donnée existante n'a besoin d'être
 * transformée.
 */
describe('migration v5 -> v6 (checklist matériel)', () => {
  function buildV5Workspace() {
    const base = createEmptyWorkspace()
    const v5: Record<string, unknown> = { ...base, schemaVersion: 5 }
    delete v5.equipmentItems
    return v5
  }

  it('ajoute un tableau equipmentItems vide', () => {
    const result = migrateWorkspace(buildV5Workspace())
    expect(result.ok).toBe(true)
    if (!result.ok) return
    // La migration ne s'arrête pas à v6 : elle enchaîne jusqu'à CURRENT_SCHEMA_VERSION (v8 depuis Phase 4).
    expect(result.workspace.schemaVersion).toBe(8)
    expect(result.workspace.equipmentItems).toEqual([])
  })

  it('préserve les autres données existantes (aucune perte au passage de version)', () => {
    const v5 = buildV5Workspace()
    v5.weddings = [
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

    const result = migrateWorkspace(v5)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.workspace.weddings).toHaveLength(1)
    expect(result.workspace.weddings[0].coupleName).toBe('Test')
  })

  it('rejette un élément matériel référençant un mariage inexistant', () => {
    const base = createEmptyWorkspace()
    const withOrphan = {
      ...base,
      equipmentItems: [
        {
          id: 'e1',
          weddingId: 'w-inexistant',
          name: 'Chaises',
          quantity: 50,
          acquisitionMode: 'location',
          status: 'a_prevoir',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
      ],
    }
    const result = migrateWorkspace(withOrphan)
    expect(result.ok).toBe(false)
  })
})
