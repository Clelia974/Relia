import type { UserProfile } from '@/features/auth/userProfile'

/**
 * Marge après la fin du trial avant de considérer l'accès réellement
 * bloqué — évite qu'une décoratrice se retrouve coupée de l'app en plein
 * mariage simplement parce que son trial a expiré ce jour-là (cf.
 * contrainte "Jour J zéro impact"). Ne s'applique qu'au trial, jamais à
 * un abonnement explicitement annulé.
 */
export const TRIAL_GRACE_PERIOD_HOURS = 48

export type SubscriptionAccessStatus = 'trial' | 'grace' | 'expired' | 'active' | 'cancelled'

export interface SubscriptionAccess {
  status: SubscriptionAccessStatus
  /** Accès complet à l'app — reste `true` pendant la période de grâce, volontairement, pas seulement pendant le trial actif. */
  hasAccess: boolean
  /** `null` hors trial (abonnement actif/annulé) ou pendant la grâce (le compte à rebours du trial lui-même est déjà à zéro). */
  daysLeftInTrial: number | null
}

/**
 * Dérive l'état d'accès réel à partir du profil — pure, testable sans
 * réseau. `now` est un paramètre (pas `new Date()` en dur) pour des tests
 * déterministes.
 */
export function computeSubscriptionAccess(
  profile: Pick<UserProfile, 'subscriptionStatus' | 'trialEndDate'>,
  now: Date,
): SubscriptionAccess {
  if (profile.subscriptionStatus === 'active') {
    return { status: 'active', hasAccess: true, daysLeftInTrial: null }
  }
  if (profile.subscriptionStatus === 'cancelled') {
    return { status: 'cancelled', hasAccess: false, daysLeftInTrial: null }
  }

  // subscriptionStatus === 'trial'
  const trialEnd = new Date(profile.trialEndDate)
  const graceEnd = new Date(trialEnd.getTime() + TRIAL_GRACE_PERIOD_HOURS * 60 * 60 * 1000)

  if (now <= trialEnd) {
    const msLeft = trialEnd.getTime() - now.getTime()
    const daysLeftInTrial = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)))
    return { status: 'trial', hasAccess: true, daysLeftInTrial }
  }
  if (now <= graceEnd) {
    return { status: 'grace', hasAccess: true, daysLeftInTrial: 0 }
  }
  return { status: 'expired', hasAccess: false, daysLeftInTrial: 0 }
}
