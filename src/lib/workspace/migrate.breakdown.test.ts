import { describe, expect, it } from 'vitest'
import { migrateWorkspace } from '@/lib/workspace/migrate'
import { createEmptyWorkspace } from '@/lib/workspace/factories'

/**
 * Migration v7→v8 (Phase 4) : ajoute le suivi de désinstallation
 * (isDamaged, damageNotes, destination, destinationNotes, returnedAt) sur
 * EquipmentItem existant — pas de nouvelle entité, purement additif.
 */
describe('migration v7 -> v8 (suivi désinstallation)', () => {
  function buildV7Workspace() {
    const base = createEmptyWorkspace()
    return { ...base, schemaVersion: 7 }
  }

  it('fait passer schemaVersion à 8 sans toucher aux éléments matériel existants', () => {
    const v7 = buildV7Workspace()
    v7.weddings = [
      {
        id: 'w1',
        coupleName: 'Test',
        date: '2026-06-06T00:00:00.000Z',
        venue: '',
        soldAmount: 0,
        clientBudget: 0,
        status: 'signe',
        archived: false,
        vendorIds: [],
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      },
    ]
    v7.equipmentItems = [
      {
        id: 'e1',
        weddingId: 'w1',
        name: 'Chaises',
        quantity: 80,
        acquisitionMode: 'location',
        status: 'installe',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      },
    ]

    const result = migrateWorkspace(v7)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.workspace.schemaVersion).toBe(8)
    expect(result.workspace.equipmentItems).toHaveLength(1)
    expect(result.workspace.equipmentItems[0].name).toBe('Chaises')
    expect(result.workspace.equipmentItems[0].isDamaged).toBeUndefined()
    expect(result.workspace.equipmentItems[0].destination).toBeUndefined()
  })

  it('accepte un élément matériel avec les champs de désinstallation renseignés', () => {
    const base = createEmptyWorkspace()
    const withBreakdown = {
      ...base,
      weddings: [
        {
          id: 'w1',
          coupleName: 'Test',
          date: '2026-06-06T00:00:00.000Z',
          venue: '',
          soldAmount: 0,
          clientBudget: 0,
          status: 'signe' as const,
          archived: false,
          vendorIds: [],
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
      ],
      equipmentItems: [
        {
          id: 'e1',
          weddingId: 'w1',
          name: 'Nappes',
          quantity: 12,
          acquisitionMode: 'achat' as const,
          status: 'recupere' as const,
          isDamaged: true,
          damageNotes: 'Tachée de vin',
          destination: 'stock' as const,
          destinationNotes: 'Rangée 3',
          returnedAt: '2026-06-07T10:00:00.000Z',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2026-06-07T10:00:00.000Z',
        },
      ],
    }

    const result = migrateWorkspace(withBreakdown)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const item = result.workspace.equipmentItems[0]
    expect(item.isDamaged).toBe(true)
    expect(item.destination).toBe('stock')
    expect(item.returnedAt).toBe('2026-06-07T10:00:00.000Z')
  })

  it('rejette une destination invalide', () => {
    const base = createEmptyWorkspace()
    const invalid = {
      ...base,
      equipmentItems: [
        {
          id: 'e1',
          weddingId: 'w-inexistant',
          name: 'Test',
          quantity: 1,
          acquisitionMode: 'autre',
          status: 'recupere',
          destination: 'pas-une-vraie-destination',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
      ],
    }
    const result = migrateWorkspace(invalid)
    expect(result.ok).toBe(false)
  })
})
