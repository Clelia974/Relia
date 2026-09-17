import { describe, expect, it } from 'vitest'
import { migrateWorkspace } from '@/lib/workspace/migrate'
import { createEmptyWorkspace } from '@/lib/workspace/factories'

/**
 * Migration v6→v7 (Phase 3) : ajoute un champ `phase` facultatif sur Task et
 * TimelineEvent pour le filtrage de la Vue Jour J. Purement additif — aucune
 * transformation de données existantes.
 */
describe('migration v6 -> v7 (phase jour J)', () => {
  function buildV6Workspace() {
    const base = createEmptyWorkspace()
    return { ...base, schemaVersion: 6 }
  }

  it('fait passer schemaVersion à 7 sans toucher aux données existantes', () => {
    const v6 = buildV6Workspace()
    v6.tasks = [
      {
        id: 't1',
        title: 'Tâche existante',
        status: 'a_faire',
        priority: 'normale',
        postponedCount: 0,
        postponeHistory: [],
        source: 'manual',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      },
    ]

    const result = migrateWorkspace(v6)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.workspace.schemaVersion).toBe(7)
    expect(result.workspace.tasks).toHaveLength(1)
    expect(result.workspace.tasks[0].title).toBe('Tâche existante')
    expect(result.workspace.tasks[0].phase).toBeUndefined()
  })

  it('accepte une tâche et un moment avec une phase renseignée', () => {
    const base = createEmptyWorkspace()
    const withPhases = {
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
      tasks: [
        {
          id: 't1',
          title: 'Installer les chaises',
          status: 'a_faire' as const,
          priority: 'normale' as const,
          weddingId: 'w1',
          postponedCount: 0,
          postponeHistory: [],
          source: 'manual' as const,
          phase: 'installation' as const,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
      ],
      timelineEvents: [
        {
          id: 'e1',
          weddingId: 'w1',
          title: 'Cérémonie',
          date: '2026-06-06T00:00:00.000Z',
          isPhotoMoment: false,
          type: 'jour_j' as const,
          status: 'prevu' as const,
          phase: 'ceremonie' as const,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
      ],
    }

    const result = migrateWorkspace(withPhases)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.workspace.tasks[0].phase).toBe('installation')
    expect(result.workspace.timelineEvents[0].phase).toBe('ceremonie')
  })
})
