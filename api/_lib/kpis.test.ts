import { describe, expect, it } from 'vitest'
import { computeEventKpis, computeUserKpis, type EventRow, type UserRow } from './kpis.js'

const NOW = new Date('2026-10-30T12:00:00Z')
const iso = (daysAgo: number) => new Date(NOW.getTime() - daysAgo * 86_400_000).toISOString()
const user = (over: Partial<UserRow>): UserRow => ({
  email: 'a@example.com',
  subscription_status: 'trial',
  created_at: iso(1),
  trial_end_date: new Date(NOW.getTime() + 13 * 86_400_000).toISOString(),
  subscribed_at: null,
  cancelled_at: null,
  billing_interval: null,
  is_launch_offer: false,
  ...over,
})

describe('computeUserKpis', () => {
  it('compte abonnées, essais, annulées et conversion', () => {
    const k = computeUserKpis(
      [
        user({}),
        user({ trial_end_date: iso(2) }),
        user({ subscription_status: 'active', subscribed_at: iso(10), created_at: iso(14) }),
        user({ subscription_status: 'cancelled', subscribed_at: iso(40), cancelled_at: iso(10), created_at: iso(50) }),
      ],
      NOW,
      3,
    )
    expect(k).toMatchObject({ total: 4, active: 1, cancelled: 1, trialsRunning: 1, trialsExpired: 1, conversionRate: 50, launchOffer: { redeemed: 3, limit: 100 } })
  })

  it('calcule le délai moyen avant annulation et le churn sur 30 jours', () => {
    const k = computeUserKpis(
      [
        user({ subscription_status: 'active', subscribed_at: iso(60), created_at: iso(70) }),
        user({ subscription_status: 'cancelled', subscribed_at: iso(40), cancelled_at: iso(10), created_at: iso(50) }),
        user({ subscription_status: 'cancelled', subscribed_at: iso(20), cancelled_at: iso(14), created_at: iso(30) }),
      ],
      NOW,
      0,
    )
    expect(k.avgDaysToCancel).toBe(18)
    expect(k.cancelled30).toBe(2)
    expect(k.churnRate30).toBeCloseTo(66.7, 1)
    expect(k.cancelBuckets).toEqual([
      { label: 'Moins de 7 jours', count: 1 },
      { label: '7 à 30 jours', count: 0 },
      { label: '30 à 90 jours', count: 1 },
      { label: 'Plus de 90 jours', count: 0 },
    ])
  })

  it('compte les motifs de résiliation, « non précisé » quand la cliente n’a rien choisi', () => {
    const k = computeUserKpis(
      [
        user({ subscription_status: 'cancelled', cancellation_reason: 'too_expensive' }),
        user({ subscription_status: 'cancelled', cancellation_reason: 'too_expensive' }),
        user({ subscription_status: 'cancelled', cancellation_reason: 'missing_features' }),
        user({ subscription_status: 'cancelled' }),
      ],
      NOW,
      0,
    )
    expect(k.cancelReasons).toEqual([
      { label: 'too_expensive', count: 2 },
      { label: 'missing_features', count: 1 },
      { label: 'non_precise', count: 1 },
    ])
  })

  it('estime le revenu mensuel selon l’offre et la périodicité', () => {
    const k = computeUserKpis(
      [
        user({ subscription_status: 'active', billing_interval: 'month' }),
        user({ subscription_status: 'active', billing_interval: 'month', is_launch_offer: true }),
        user({ subscription_status: 'active', billing_interval: 'year' }),
      ],
      NOW,
      0,
    )
    expect(k.mrr).toBe(Math.round(39 + 29 + 390 / 12))
  })

  it('liste les essais qui finissent dans 3 jours ou moins', () => {
    const soon = user({ email: 'bientot@example.com', trial_end_date: new Date(NOW.getTime() + 2 * 86_400_000).toISOString() })
    const k = computeUserKpis([soon, user({})], NOW, 0)
    expect(k.expiringSoon).toEqual([{ email: 'bientot@example.com', daysLeft: 2 }])
  })

  it('ne divise jamais par zéro quand il n’y a personne', () => {
    const k = computeUserKpis([], NOW, 0)
    expect(k).toMatchObject({ total: 0, conversionRate: null, churnRate30: null, avgDaysToCancel: null, mrr: 0 })
  })
})

describe('computeEventKpis', () => {
  const ev = (name: string, path: string, props: EventRow['props'] = null): EventRow => ({ name, path, props, created_at: iso(1) })

  it('agrège clics, sections, pages, durées et entonnoir', () => {
    const k = computeEventKpis([
      ev('pageview', '/'),
      ev('pageview', '/'),
      ev('pageview', '/inscription'),
      ev('CTA Click', '/', { location: 'hero' }),
      ev('CTA Click', '/', { location: 'hero' }),
      ev('CTA Click', '/', { location: 'final' }),
      ev('Section View', '/', { section: 'tarifs' }),
      ev('Time on Page', '/', { seconds: 30 }),
      ev('Time on Page', '/', { seconds: 90 }),
      ev('Signup Submit', '/inscription'),
      ev('Signup Success', '/inscription'),
      ev('Feature View', '/', { name: 'Plan de salle' }),
    ])
    expect(k.ctaByLocation).toEqual([
      { label: 'hero', count: 2 },
      { label: 'final', count: 1 },
    ])
    expect(k.sectionViews).toEqual([{ label: 'tarifs', count: 1 }])
    expect(k.topPages[0]).toEqual({ label: '/', count: 2 })
    expect(k.timeOnPage).toEqual([{ path: '/', avgSeconds: 60, visits: 2 }])
    expect(k.funnel.map((f) => f.count)).toEqual([2, 3, 1, 1, 0, 0])
    expect(k.featureViews).toEqual([{ label: 'Plan de salle', count: 1 }])
  })
})
