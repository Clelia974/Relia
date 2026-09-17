import { create } from 'zustand'

/**
 * Statut de persistance localStorage — volontairement un store SÉPARÉ de
 * workspaceStore et sans middleware `persist`.
 *
 * Raison : zustand `persist` réécrit localStorage à CHAQUE `set()`, y
 * compris pour un champ qui n'est même pas persisté (le `partialize` de
 * workspaceStore ne garde que `workspace`, mais l'écriture est retentée
 * quand même). Si on signalait un échec d'écriture via
 * `useWorkspaceStore.setState(...)`, cela déclencherait une nouvelle
 * tentative d'écriture, qui échouerait à son tour, qui redéclencherait le
 * signalement, etc. — une boucle infinie tant que localStorage reste
 * indisponible. Un store non persisté évite structurellement ce risque.
 */
interface PersistenceStatusState {
  persistenceIssue: string | null
  setPersistenceIssue: (message: string | null) => void
  clearPersistenceIssue: () => void
}

export const usePersistenceStatus = create<PersistenceStatusState>((set) => ({
  persistenceIssue: null,
  setPersistenceIssue: (message) => set({ persistenceIssue: message }),
  clearPersistenceIssue: () => set({ persistenceIssue: null }),
}))
