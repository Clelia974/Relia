import { CURRENT_SCHEMA_VERSION } from '@/schemas/workspace'
import { describe, expect, it } from 'vitest'
import { migrateWorkspace } from '@/lib/workspace/migrate'
import { createEmptyWorkspace } from '@/lib/workspace/factories'

/**
 * Migration v8→v9 (Phase 5) : ajoute la clôture et le bilan post-mariage
 * (ClosingSession) — nouvelle entité, plus Wedding.closingSessionId
 * facultatif. Purement additif, aucun mariage existant n'est clôturé.
 */
describe('migration v8 -> v9 (clôture et bilan)', () => {
  function buildV8Workspace() {
    const base = createEmptyWorkspace()
    const { closingSessions: _closingSessions, ...withoutClosing } = base
    return { ...withoutClosing, schemaVersion: 8 }
  }

  it('fait passer schemaVersion à 9 et initialise closingSessions à []', () => {
    const v8 = buildV8Workspace()
    v8.weddings = [
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

    const result = migrateWorkspace(v8)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.workspace.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
    expect(result.workspace.closingSessions).toEqual([])
    expect(result.workspace.weddings[0].closingSessionId).toBeUndefined()
  })

  it('accepte une ClosingSession valide référencée par Wedding.closingSessionId', () => {
    const base = createEmptyWorkspace()
    const withClosing = {
      ...base,
      weddings: [
        {
          id: 'w1',
          coupleName: 'Test',
          date: '2026-06-06T00:00:00.000Z',
          venue: '',
          soldAmount: 1000,
          clientBudget: 1000,
          status: 'termine' as const,
          archived: false,
          vendorIds: [],
          closingSessionId: 'c1',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
      ],
      closingSessions: [
        {
          id: 'c1',
          weddingId: 'w1',
          closingDate: '2026-06-07T00:00:00.000Z',
          portfolioImages: [],
          summary: {
            completedTasks: 0,
            totalTasks: 0,
            recoveredEquipment: 0,
            totalEquipment: 0,
            damagedEquipment: 0,
            pendingEquipment: 0,
            approvedRevenue: 1000,
            totalCosts: 0,
            profit: 1000,
            marginPct: 100,
          },
          createdAt: '2026-06-07T00:00:00.000Z',
          updatedAt: '2026-06-07T00:00:00.000Z',
        },
      ],
    }

    const result = migrateWorkspace(withClosing)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.workspace.closingSessions).toHaveLength(1)
    expect(result.workspace.weddings[0].closingSessionId).toBe('c1')
  })

  it('rejette un closingSessionId qui ne correspond à aucune clôture', () => {
    const base = createEmptyWorkspace()
    const invalid = {
      ...base,
      weddings: [
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
          closingSessionId: 'inexistant',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
      ],
    }
    const result = migrateWorkspace(invalid)
    expect(result.ok).toBe(false)
  })
})
