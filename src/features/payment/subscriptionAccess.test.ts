import { describe, expect, it } from 'vitest'
import { computeSubscriptionAccess } from '@/features/payment/subscriptionAccess'

const NOW = new Date('2026-09-22T12:00:00.000Z')

describe('computeSubscriptionAccess', () => {
  it('trial en cours : accès complet, jours restants > 0', () => {
    const result = computeSubscriptionAccess(
      { subscriptionStatus: 'trial', trialEndDate: '2026-09-30T12:00:00.000Z' },
      NOW,
    )
    expect(result).toEqual({ status: 'trial', hasAccess: true, daysLeftInTrial: 8 })
  })

  it('trial qui finit dans les prochaines minutes : jours restants arrondis à au moins 1 (pas encore expiré)', () => {
    const result = computeSubscriptionAccess(
      { subscriptionStatus: 'trial', trialEndDate: '2026-09-22T12:30:00.000Z' },
      NOW,
    )
    expect(result.status).toBe('trial')
    expect(result.hasAccess).toBe(true)
    expect(result.daysLeftInTrial).toBe(1)
  })

  it('trial techniquement fini mais dans la période de grâce (48h) : accès toujours complet', () => {
    const result = computeSubscriptionAccess(
      { subscriptionStatus: 'trial', trialEndDate: '2026-09-21T00:00:00.000Z' }, // fini il y a 36h
      NOW,
    )
    expect(result).toEqual({ status: 'grace', hasAccess: true, daysLeftInTrial: 0 })
  })

  it('juste à la limite de la grâce (48h pile) : encore accès', () => {
    const result = computeSubscriptionAccess(
      { subscriptionStatus: 'trial', trialEndDate: '2026-09-20T12:00:00.000Z' }, // fini il y a exactement 48h
      NOW,
    )
    expect(result.status).toBe('grace')
    expect(result.hasAccess).toBe(true)
  })

  it('grâce dépassée : accès bloqué', () => {
    const result = computeSubscriptionAccess(
      { subscriptionStatus: 'trial', trialEndDate: '2026-09-15T00:00:00.000Z' }, // fini il y a bien plus de 48h
      NOW,
    )
    expect(result).toEqual({ status: 'expired', hasAccess: false, daysLeftInTrial: 0 })
  })

  it('abonnement actif : accès complet, quelle que soit trialEndDate', () => {
    const result = computeSubscriptionAccess(
      { subscriptionStatus: 'active', trialEndDate: '2020-01-01T00:00:00.000Z' },
      NOW,
    )
    expect(result).toEqual({ status: 'active', hasAccess: true, daysLeftInTrial: null })
  })

  it('abonnement annulé : accès bloqué immédiatement, pas de grâce', () => {
    const result = computeSubscriptionAccess(
      { subscriptionStatus: 'cancelled', trialEndDate: '2026-09-30T00:00:00.000Z' },
      NOW,
    )
    expect(result).toEqual({ status: 'cancelled', hasAccess: false, daysLeftInTrial: null })
  })
})
