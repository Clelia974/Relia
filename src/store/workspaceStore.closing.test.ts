import { beforeEach, describe, expect, it } from 'vitest'
import { createEmptyWorkspace } from '@/lib/workspace/factories'
import { useWorkspaceStore } from '@/store/workspaceStore'

/**
 * Clôture et bilan post-mariage (Phase 5) — nouvelle entité ClosingSession,
 * plus Wedding.closingSessionId. closeWedding doit être idempotent (jamais
 * de seconde clôture créée sur clics répétés) et figer le bilan au moment
 * de l'appel.
 */
describe('workspaceStore — clôture et bilan (Phase 5)', () => {
  let weddingId: string

  beforeEach(() => {
    useWorkspaceStore.setState({ workspace: createEmptyWorkspace() })
    weddingId = useWorkspaceStore.getState().createWedding({
      coupleName: 'Mariage A',
      date: '2026-06-06T00:00:00.000Z',
      venue: '',
      soldAmount: 1000,
      clientBudget: 1000,
      status: 'semaine_j',
    })
  })

  it('1. closeWedding crée une ClosingSession et verrouille le mariage', () => {
    useWorkspaceStore.getState().addTask({ title: 'Tâche', weddingId, status: 'terminee' })
    useWorkspaceStore.getState().addEquipmentItem({ weddingId, name: 'Chaises', quantity: 80, acquisitionMode: 'location', status: 'recupere' })

    const id = useWorkspaceStore.getState().closeWedding(weddingId)

    expect(id).not.toBeNull()
    const wedding = useWorkspaceStore.getState().workspace.weddings.find((w) => w.id === weddingId)
    expect(wedding?.closingSessionId).toBe(id)
    const closing = useWorkspaceStore.getState().workspace.closingSessions.find((c) => c.id === id)
    expect(closing?.weddingId).toBe(weddingId)
    expect(closing?.summary.completedTasks).toBe(1)
    expect(closing?.summary.recoveredEquipment).toBe(1)
  })

  it('2. est idempotent : un second appel renvoie la clôture existante sans en créer une autre', () => {
    const first = useWorkspaceStore.getState().closeWedding(weddingId)
    const second = useWorkspaceStore.getState().closeWedding(weddingId)

    expect(second).toBe(first)
    expect(useWorkspaceStore.getState().workspace.closingSessions).toHaveLength(1)
  })

  it('3. renvoie null pour un mariage introuvable', () => {
    expect(useWorkspaceStore.getState().closeWedding('inexistant')).toBeNull()
  })

  it('4. reopenWedding déverrouille le mariage sans supprimer la ClosingSession', () => {
    const id = useWorkspaceStore.getState().closeWedding(weddingId)
    useWorkspaceStore.getState().reopenWedding(weddingId)

    const wedding = useWorkspaceStore.getState().workspace.weddings.find((w) => w.id === weddingId)
    expect(wedding?.closingSessionId).toBeUndefined()
    expect(useWorkspaceStore.getState().workspace.closingSessions.find((c) => c.id === id)).toBeDefined()
  })

  it('5. addPortfolioImage ajoute une image, removePortfolioImage la retire', () => {
    useWorkspaceStore.getState().closeWedding(weddingId)
    useWorkspaceStore.getState().addPortfolioImage(weddingId, 'data:image/png;base64,abc', 'Avant')

    let closing = useWorkspaceStore.getState().workspace.closingSessions.find((c) => c.weddingId === weddingId)
    expect(closing?.portfolioImages).toHaveLength(1)
    expect(closing?.portfolioImages[0].caption).toBe('Avant')

    const imageId = closing!.portfolioImages[0].id
    useWorkspaceStore.getState().removePortfolioImage(weddingId, imageId)
    closing = useWorkspaceStore.getState().workspace.closingSessions.find((c) => c.weddingId === weddingId)
    expect(closing?.portfolioImages).toHaveLength(0)
  })

  it('6. addPortfolioImage refuse au-delà de 5 images', () => {
    useWorkspaceStore.getState().closeWedding(weddingId)
    for (let i = 0; i < 6; i++) {
      useWorkspaceStore.getState().addPortfolioImage(weddingId, `data:image/png;base64,img${i}`)
    }
    const closing = useWorkspaceStore.getState().workspace.closingSessions.find((c) => c.weddingId === weddingId)
    expect(closing?.portfolioImages).toHaveLength(5)
  })

  it('7. updateClientFeedback enregistre le feedback et la note', () => {
    useWorkspaceStore.getState().closeWedding(weddingId)
    useWorkspaceStore.getState().updateClientFeedback(weddingId, { clientFeedback: 'Très satisfaite', clientRating: 5 })

    const closing = useWorkspaceStore.getState().workspace.closingSessions.find((c) => c.weddingId === weddingId)
    expect(closing?.clientFeedback).toBe('Très satisfaite')
    expect(closing?.clientRating).toBe(5)
  })

  it('8. deleteWedding supprime aussi sa ClosingSession', () => {
    useWorkspaceStore.getState().closeWedding(weddingId)
    useWorkspaceStore.getState().deleteWedding(weddingId)

    expect(useWorkspaceStore.getState().workspace.closingSessions).toHaveLength(0)
  })
})
