import { describe, expect, it } from 'vitest'
import { migrateWorkspace } from '@/lib/workspace/migrate'
import { createEmptyWorkspace } from '@/lib/workspace/factories'
import { CURRENT_SCHEMA_VERSION } from '@/schemas/workspace'

const T = '2025-01-01T00:00:00.000Z'
const wedding = (id: string) => ({
  id,
  coupleName: 'Test',
  date: '2026-06-06T00:00:00.000Z',
  venue: '',
  soldAmount: 1000,
  clientBudget: 1000,
  status: 'signe',
  archived: false,
  vendorIds: [],
  createdAt: T,
  updatedAt: T,
})

/**
 * Migration v12→v13 (moodboards) : ajout purement additif — une liste de
 * moodboards vide, aucun mariage existant n'est modifié.
 */
describe('migration v12 -> v13 (moodboards)', () => {
  function buildV12Workspace() {
    const v12: Record<string, unknown> = { ...createEmptyWorkspace(), schemaVersion: 12, weddings: [wedding('w1')] }
    delete v12.moodboards
    return v12
  }

  it('ajoute une liste de moodboards vide sans toucher aux mariages', () => {
    const result = migrateWorkspace(buildV12Workspace())
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.workspace.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
    expect(result.workspace.moodboards).toEqual([])
    expect(result.workspace.weddings[0].coupleName).toBe('Test')
    expect(result.workspace.weddings[0].design).toBeUndefined()
  })

  it('accepte un moodboard avec image, texte, couleur et matière, et un onglet Design', () => {
    const ws = {
      ...createEmptyWorkspace(),
      weddings: [{ ...wedding('w1'), design: { styleKeywords: ['bohème'], palette: [{ hex: '#520C0C' }], materials: ['lin'] } }],
      moodboards: [
        {
          id: 'm1',
          weddingId: 'w1',
          title: 'Cérémonie',
          items: [
            { id: 'i1', kind: 'image', x: 0, y: 0, w: 300, h: 200, storagePath: 'u1/w1/a.jpg' },
            { id: 'i2', kind: 'texte', x: 10, y: 10, w: 200, h: 60, text: 'Arche fleurie' },
            { id: 'i3', kind: 'couleur', x: 20, y: 20, w: 80, h: 80, color: '#A9B08F' },
            { id: 'i4', kind: 'matiere', x: 30, y: 30, w: 120, h: 120, text: 'Lin lavé' },
          ],
          createdAt: T,
          updatedAt: T,
        },
      ],
    }
    const result = migrateWorkspace(ws)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.workspace.moodboards[0].items).toHaveLength(4)
    expect(result.workspace.moodboards[0].items[0].rotation).toBe(0)
  })

  it('rejette un moodboard rattaché à un mariage inexistant', () => {
    const ws = { ...createEmptyWorkspace(), moodboards: [{ id: 'm1', weddingId: 'w-absent', title: 'X', items: [], createdAt: T, updatedAt: T }] }
    expect(migrateWorkspace(ws).ok).toBe(false)
  })

  it('rejette un lien vers un matériel d’un autre mariage', () => {
    const ws = {
      ...createEmptyWorkspace(),
      weddings: [wedding('w1'), wedding('w2')],
      equipmentItems: [
        { id: 'e1', weddingId: 'w2', name: 'Arche', quantity: 1, acquisitionMode: 'fabrication', status: 'a_prevoir', createdAt: T, updatedAt: T },
      ],
      moodboards: [
        {
          id: 'm1',
          weddingId: 'w1',
          title: 'X',
          items: [{ id: 'i1', kind: 'texte', x: 0, y: 0, w: 10, h: 10, text: 'Arche', equipmentItemId: 'e1' }],
          createdAt: T,
          updatedAt: T,
        },
      ],
    }
    expect(migrateWorkspace(ws).ok).toBe(false)
  })
})
