import type { SubscriptionAccessStatus } from '@/features/payment/subscriptionAccess'
import { isWeddingCreationUnlimited } from '@/features/payment/weddingLimit'
import type { Moodboard } from '@/types/entities'

/**
 * Palier Gratuit des moodboards : 1 moodboard et 15 images par mariage.
 * Illimité dans les mêmes cas que les mariages (essai, grâce, Solo actif, ou
 * statut pas encore résolu — jamais de faux blocage au chargement).
 */
export const GRATUIT_MOODBOARDS_PER_WEDDING = 1
export const GRATUIT_IMAGES_PER_WEDDING = 15

export function isMoodboardUnlimited(status: SubscriptionAccessStatus | undefined): boolean {
  return isWeddingCreationUnlimited(status)
}

export function canCreateMoodboard(status: SubscriptionAccessStatus | undefined, boardsOfWedding: number): boolean {
  return isMoodboardUnlimited(status) || boardsOfWedding < GRATUIT_MOODBOARDS_PER_WEDDING
}

/** Nombre d'images (éléments « image ») sur l'ensemble des moodboards d'un mariage. */
export function countWeddingImages(boards: Moodboard[], weddingId: string): number {
  return boards.filter((b) => b.weddingId === weddingId).reduce((n, b) => n + b.items.filter((i) => i.kind === 'image').length, 0)
}

/** Combien d'images on peut encore ajouter à ce mariage (Infinity si illimité). */
export function remainingImageSlots(status: SubscriptionAccessStatus | undefined, imagesOfWedding: number): number {
  if (isMoodboardUnlimited(status)) return Infinity
  return Math.max(0, GRATUIT_IMAGES_PER_WEDDING - imagesOfWedding)
}
