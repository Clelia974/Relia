import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * 17. Réhydratation après actualisation, et 18. compatibilité avec les
 * événements existants — pour un moment de planning qui traverse minuit.
 * Même technique que workspaceStore.persistence.test.ts : l'hydratation ne
 * se produit qu'une fois par import du module, donc on simule un
 * rechargement de page via vi.resetModules() + import dynamique. Deux
 * réimports complets du module par test (store + zod + migrations) peuvent
 * dépasser le timeout par défaut de 5s sous charge (suite complète, jsdom
 * recréé pour chaque fichier) — d'où le timeout explicite de 15s.
 */

async function importFreshStore() {
  vi.resetModules()
  const mod = await import('@/store/workspaceStore')
  return mod.useWorkspaceStore
}

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  window.localStorage.clear()
  vi.restoreAllMocks()
})

describe('workspaceStore — événements traversant minuit', () => {
  it('17. un moment nocturne créé (23:00 → 01:00) survit à une réhydratation', async () => {
    const useWorkspaceStore = await importFreshStore()
    const weddingId = useWorkspaceStore.getState().createWedding({
      coupleName: 'Test',
      date: '2026-06-06T00:00:00.000Z',
      venue: '',
      soldAmount: 0,
      clientBudget: 0,
      status: 'signe',
    })
    useWorkspaceStore.getState().addTimelineEvent({
      weddingId,
      title: 'Soirée dansante',
      date: '2026-06-06T00:00:00.000Z',
      startTime: '23:00',
      endTime: '01:00',
      durationMinutes: 120,
      type: 'jalon',
    })

    // Simule une actualisation de page : nouveau module, même localStorage.
    const reloadedStore = await importFreshStore()
    const state = reloadedStore.getState()

    expect(state.hydrationIssue).toBeNull()
    const event = state.workspace.timelineEvents.find((e) => e.title === 'Soirée dansante')
    expect(event).toBeDefined()
    expect(event?.startTime).toBe('23:00')
    expect(event?.endTime).toBe('01:00')
    expect(event?.durationMinutes).toBe(120)
  }, 15_000)

  it("18. un événement existant même jour (créé avant ce chantier) n'est jamais modifié par la réhydratation", async () => {
    const useWorkspaceStore = await importFreshStore()
    const weddingId = useWorkspaceStore.getState().createWedding({
      coupleName: 'Test',
      date: '2026-06-06T00:00:00.000Z',
      venue: '',
      soldAmount: 0,
      clientBudget: 0,
      status: 'signe',
    })
    useWorkspaceStore.getState().addTimelineEvent({
      weddingId,
      title: 'Installation florale',
      date: '2026-06-06T00:00:00.000Z',
      startTime: '11:00',
      endTime: '13:00',
      durationMinutes: 120,
      location: 'Salle principale',
      type: 'jalon',
    })

    const reloadedStore = await importFreshStore()
    const event = reloadedStore.getState().workspace.timelineEvents.find((e) => e.title === 'Installation florale')

    expect(event).toMatchObject({
      startTime: '11:00',
      endTime: '13:00',
      durationMinutes: 120,
      location: 'Salle principale',
    })
  }, 15_000)
})
