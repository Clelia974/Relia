import type { SubscriptionAccessStatus } from '@/features/payment/subscriptionAccess'

/**
 * Palier Gratuit : 3 mariages maximum, limite dure. Illimité pendant
 * l'essai (`trial`/`grace` — sinon la promesse d'essai complet serait
 * contredite) et pour un abonnement Pro actif (`active`). Seul `expired`
 * (essai fini, jamais payé — c'est littéralement "Version Gratuite", cf.
 * SubscriptionStatusBadge) ou `cancelled` applique la limite.
 */
export const GRATUIT_WEDDING_LIMIT = 3

/** `undefined` (statut pas encore résolu) traité comme illimité : ne jamais bloquer par défaut avant de savoir si le compte est Pro/trial — un faux blocage momentané au chargement serait pire qu'un clic autorisé un peu tôt. */
export function isWeddingCreationUnlimited(status: SubscriptionAccessStatus | undefined): boolean {
  return status === undefined || status === 'trial' || status === 'grace' || status === 'active'
}

export function canCreateWedding(status: SubscriptionAccessStatus | undefined, weddingCount: number): boolean {
  if (isWeddingCreationUnlimited(status)) return true
  return weddingCount < GRATUIT_WEDDING_LIMIT
}
