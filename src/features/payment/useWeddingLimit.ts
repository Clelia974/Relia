import { canCreateWedding, GRATUIT_WEDDING_LIMIT } from '@/features/payment/weddingLimit'
import { useSubscriptionCheck } from '@/features/payment/useSubscriptionCheck'
import { useWorkspaceStore } from '@/store/workspaceStore'

interface UseWeddingLimitResult {
  weddingCount: number
  canCreate: boolean
  limitReached: boolean
  limit: number
}

/**
 * Vérifiée avant la création d'un mariage seulement (bouton "Créer un
 * mariage", ou au chargement de NewWeddingPage en filet de sécurité) —
 * jamais consultée depuis un mariage déjà créé, donc zéro impact sur la
 * Vue Jour J (aucune vérification n'y a de sens : le mariage existe déjà).
 */
export function useWeddingLimit(): UseWeddingLimitResult {
  const weddingCount = useWorkspaceStore((s) => s.workspace.weddings.length)
  const { status } = useSubscriptionCheck()
  const canCreate = canCreateWedding(status, weddingCount)

  return { weddingCount, canCreate, limitReached: !canCreate, limit: GRATUIT_WEDDING_LIMIT }
}
