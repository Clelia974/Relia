import { canCreateWedding, GRATUIT_WEDDING_LIMIT } from '@/features/payment/weddingLimit'
import { useSubscriptionCheck } from '@/features/payment/useSubscriptionCheck'
import { WEDDING_STATUSES_COUNTED_FOR_LIMIT } from '@/lib/weddingStatus'
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
 *
 * Ne compte que les mariages réellement engagés (signé ou au-delà,
 * cf. WEDDING_STATUSES_COUNTED_FOR_LIMIT) : un prospect ou un devis en
 * cours ne doit jamais consommer la limite Gratuite, sinon les demandes
 * entrantes (souvent converties en prospect sans jamais aboutir)
 * grignoteraient les 3 mariages gratuits sans qu'aucune cliente n'ait
 * réellement signé.
 */
export function useWeddingLimit(): UseWeddingLimitResult {
  const weddingCount = useWorkspaceStore(
    (s) => s.workspace.weddings.filter((w) => WEDDING_STATUSES_COUNTED_FOR_LIMIT.has(w.status)).length,
  )
  const { status } = useSubscriptionCheck()
  const canCreate = canCreateWedding(status, weddingCount)

  return { weddingCount, canCreate, limitReached: !canCreate, limit: GRATUIT_WEDDING_LIMIT }
}
