import { computeSubscriptionAccess, type SubscriptionAccess } from '@/features/payment/subscriptionAccess'
import { useUserProfile } from '@/features/auth/useUserProfile'

interface UseSubscriptionCheckResult extends Partial<SubscriptionAccess> {
  /** `true` tant que le profil (public.users) n'a pas encore été lu — distinct de `hasAccess`, qui suppose un profil résolu. */
  isLoading: boolean
}

/**
 * Dérive l'accès à partir du profil (`useUserProfile`, cf.
 * src/features/auth/). Sans profil résolu (pas connecté·e, ou lecture en
 * cours), `hasAccess`/`status`/`daysLeftInTrial` restent `undefined` —
 * jamais un `true` par défaut qui masquerait un vrai blocage, jamais un
 * `false` par défaut qui bloquerait quelqu'un pendant le chargement.
 */
export function useSubscriptionCheck(): UseSubscriptionCheckResult {
  const { profile, isLoading } = useUserProfile()

  if (!profile) return { isLoading }

  return { ...computeSubscriptionAccess(profile, new Date()), isLoading }
}
