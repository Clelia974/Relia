import { beforeEach, describe, expect, it } from 'vitest'
import { createEmptyWorkspace } from '@/lib/workspace/factories'
import { useWorkspaceStore } from '@/store/workspaceStore'

/**
 * Non-régression archivage/désarchivage : l'archivage est une visibilité,
 * jamais une transformation de la donnée. Verrouille le contrat attendu par
 * WeddingStatusSchema (le champ `status` métier — "signé", "terminé", etc. —
 * est indépendant de `archived`) sans dupliquer le schéma lui-même.
 */
describe("archiveWedding / désarchivage — n'altère jamais la donnée métier", () => {
  beforeEach(() => {
    useWorkspaceStore.setState({ workspace: createEmptyWorkspace() })
  })

  it('archiver un mariage ne modifie ni status ni aucune autre donnée, seulement archived', () => {
    const id = useWorkspaceStore.getState().createWedding({
      coupleName: 'Camille & Antoine',
      date: '2026-06-06T00:00:00.000Z',
      venue: 'Domaine des Roses',
      soldAmount: 12000,
      clientBudget: 12000,
      status: 'signe',
    })
    const before = useWorkspaceStore.getState().workspace.weddings.find((w) => w.id === id)!

    useWorkspaceStore.getState().archiveWedding(id)
    const afterArchive = useWorkspaceStore.getState().workspace.weddings.find((w) => w.id === id)!

    expect(afterArchive.archived).toBe(true)
    expect(afterArchive.status).toBe(before.status)
    expect(afterArchive.coupleName).toBe(before.coupleName)
    expect(afterArchive.soldAmount).toBe(before.soldAmount)
    expect(afterArchive.clientBudget).toBe(before.clientBudget)
    expect(afterArchive.venue).toBe(before.venue)

    useWorkspaceStore.getState().updateWedding(id, { archived: false })
    const afterUnarchive = useWorkspaceStore.getState().workspace.weddings.find((w) => w.id === id)!

    expect(afterUnarchive.archived).toBe(false)
    expect(afterUnarchive.status).toBe(before.status)
  })

  it('désarchiver ne supprime aucune des données liées (tâches, événements)', () => {
    const weddingId = useWorkspaceStore.getState().createWedding({
      coupleName: 'Test',
      date: '2026-06-06T00:00:00.000Z',
      venue: '',
      soldAmount: 0,
      clientBudget: 0,
      status: 'signe',
    })
    useWorkspaceStore.getState().addTask({ title: 'Tâche liée', weddingId, dueDate: '2026-06-01T00:00:00.000Z' })
    useWorkspaceStore.getState().addTimelineEvent({ title: 'Moment lié', weddingId, date: '2026-06-06T00:00:00.000Z', type: 'jalon' })

    useWorkspaceStore.getState().archiveWedding(weddingId)
    useWorkspaceStore.getState().updateWedding(weddingId, { archived: false })

    const state = useWorkspaceStore.getState().workspace
    expect(state.tasks.filter((t) => t.weddingId === weddingId)).toHaveLength(1)
    expect(state.timelineEvents.filter((e) => e.weddingId === weddingId)).toHaveLength(1)
  })
})
