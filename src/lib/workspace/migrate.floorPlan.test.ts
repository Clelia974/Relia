import { describe, expect, it } from 'vitest'
import { migrateWorkspace } from '@/lib/workspace/migrate'
import { createEmptyWorkspace } from '@/lib/workspace/factories'
import { CURRENT_SCHEMA_VERSION } from '@/schemas/workspace'

const T = '2025-01-01T00:00:00.000Z'
const wedding = { id: 'w1', coupleName: 'Test', date: '2026-06-06T00:00:00.000Z', venue: '', soldAmount: 1000, clientBudget: 1000, status: 'signe', archived: false, vendorIds: [], createdAt: T, updatedAt: T }

/** Migration v13→v14 (plan de salle + plan de table) : ajout purement additif. */
describe('migration v13 -> v14 (plan de salle)', () => {
  it('ajoute invités et versions de plan vides', () => {
    const v13: Record<string, unknown> = { ...createEmptyWorkspace(), schemaVersion: 13, weddings: [wedding] }
    delete v13.guests
    delete v13.floorPlans
    const result = migrateWorkspace(v13)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.workspace.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
    expect(result.workspace.guests).toEqual([])
    expect(result.workspace.floorPlans).toEqual([])
  })

  it('accepte un plan avec tables, espaces, murs et placement', () => {
    const ws = {
      ...createEmptyWorkspace(),
      weddings: [wedding],
      guests: [{ id: 'g1', weddingId: 'w1', name: 'Camille', group: 'Mariés', createdAt: T }],
      floorPlans: [
        {
          id: 'p1',
          weddingId: 'w1',
          title: 'Principal',
          elements: [
            { id: 't1', kind: 'table_ronde', x: 0, y: 0, w: 120, h: 120, rotation: 0, z: 1, seats: 8, label: 'Table 1' },
            { id: 'd1', kind: 'piste', x: 200, y: 0, w: 240, h: 200, rotation: 15, z: 0, label: 'Piste' },
            {
              id: 'm1',
              kind: 'contour',
              x: -50,
              y: -50,
              w: 600,
              h: 400,
              rotation: 0,
              z: -1,
              closed: true,
              points: [{ x: 0, y: 0 }, { x: 600, y: 0 }, { x: 600, y: 250 }, { x: 350, y: 400 }, { x: 0, y: 400 }],
            },
          ],
          assignments: [{ guestId: 'g1', elementId: 't1', seat: 3 }],
          createdAt: T,
          updatedAt: T,
        },
      ],
    }
    expect(migrateWorkspace(ws).ok).toBe(true)
  })

  it('refuse un placement vers une table inexistante', () => {
    const ws = {
      ...createEmptyWorkspace(),
      weddings: [wedding],
      guests: [{ id: 'g1', weddingId: 'w1', name: 'Camille', createdAt: T }],
      floorPlans: [{ id: 'p1', weddingId: 'w1', title: 'P', elements: [], assignments: [{ guestId: 'g1', elementId: 'x', seat: 0 }], createdAt: T, updatedAt: T }],
    }
    expect(migrateWorkspace(ws).ok).toBe(false)
  })
})
