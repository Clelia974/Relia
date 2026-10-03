/**
 * Calcul des indicateurs du tableau de bord /admin — fonctions pures (aucun accès réseau) pour pouvoir les tester.
 * Les prix sont ceux de src/features/landing/landingContent.ts (dupliqués ici car api/ n'importe pas src/) :
 * Solo 39 €/mois ou 390 €/an, offre de lancement 29 €/mois ou 290 €/an.
 */
export interface UserRow {
  email: string
  subscription_status: 'trial' | 'active' | 'cancelled'
  created_at: string
  trial_end_date: string
  subscribed_at: string | null
  cancelled_at: string | null
  billing_interval: 'month' | 'year' | null
  is_launch_offer: boolean
  cancellation_reason?: string | null
}

export interface EventRow {
  name: string
  path: string
  props: Record<string, string | number | boolean> | null
  created_at: string
}

const DAY = 86_400_000

const PRICES = { month: 39, year: 390, launchMonth: 29, launchYear: 290 }

function daysBetween(from: string, to: string) {
  return (new Date(to).getTime() - new Date(from).getTime()) / DAY
}

function round1(n: number) {
  return Math.round(n * 10) / 10
}

function countBy<T>(items: T[], key: (item: T) => string | undefined) {
  const map = new Map<string, number>()
  for (const item of items) {
    const k = key(item)
    if (k) map.set(k, (map.get(k) ?? 0) + 1)
  }
  return [...map.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count)
}

export function computeUserKpis(users: UserRow[], now: Date, launchRedeemed: number) {
  const nowMs = now.getTime()
  const total = users.length
  const active = users.filter((u) => u.subscription_status === 'active')
  const cancelled = users.filter((u) => u.subscription_status === 'cancelled')
  const trials = users.filter((u) => u.subscription_status === 'trial')
  const trialsRunning = trials.filter((u) => new Date(u.trial_end_date).getTime() > nowMs)
  const trialsExpired = trials.filter((u) => new Date(u.trial_end_date).getTime() <= nowMs)

  const signups = (days: number) => users.filter((u) => nowMs - new Date(u.created_at).getTime() <= days * DAY).length

  // Inscriptions par jour sur 30 jours (du plus ancien au plus récent).
  const signupsByDay: { day: string; count: number }[] = []
  for (let i = 29; i >= 0; i--) {
    const day = new Date(nowMs - i * DAY).toISOString().slice(0, 10)
    signupsByDay.push({ day, count: users.filter((u) => u.created_at.slice(0, 10) === day).length })
  }

  // Essais qui se terminent dans 3 jours ou moins : les clientes à relancer.
  const expiringSoon = trialsRunning
    .map((u) => ({ email: u.email, daysLeft: Math.max(0, Math.ceil((new Date(u.trial_end_date).getTime() - nowMs) / DAY)) }))
    .filter((u) => u.daysLeft <= 3)
    .sort((a, b) => a.daysLeft - b.daysLeft)

  const everSubscribed = active.length + cancelled.length
  const cancelled30 = cancelled.filter((u) => u.cancelled_at && nowMs - new Date(u.cancelled_at).getTime() <= 30 * DAY)
  // Taux de résiliation sur 30 jours : annulées sur la période / (abonnées actuelles + annulées sur la période).
  const churnBase = active.length + cancelled30.length
  const churnRate30 = churnBase > 0 ? round1((cancelled30.length / churnBase) * 100) : null

  const daysToCancel = cancelled.filter((u) => u.subscribed_at && u.cancelled_at).map((u) => daysBetween(u.subscribed_at!, u.cancelled_at!))
  const avgDaysToCancel = daysToCancel.length ? round1(daysToCancel.reduce((a, b) => a + b, 0) / daysToCancel.length) : null
  const cancelBuckets = [
    { label: 'Moins de 7 jours', count: daysToCancel.filter((d) => d < 7).length },
    { label: '7 à 30 jours', count: daysToCancel.filter((d) => d >= 7 && d < 30).length },
    { label: '30 à 90 jours', count: daysToCancel.filter((d) => d >= 30 && d < 90).length },
    { label: 'Plus de 90 jours', count: daysToCancel.filter((d) => d >= 90).length },
  ]

  const daysToPay = users.filter((u) => u.subscribed_at).map((u) => daysBetween(u.created_at, u.subscribed_at!))
  const avgDaysToFirstPayment = daysToPay.length ? round1(daysToPay.reduce((a, b) => a + b, 0) / daysToPay.length) : null

  // Revenu mensuel récurrent estimé : le prix dépend de l'offre de lancement et de la périodicité (mensuel par défaut si inconnue).
  const mrr = active.reduce((sum, u) => {
    if (u.billing_interval === 'year') return sum + (u.is_launch_offer ? PRICES.launchYear : PRICES.year) / 12
    return sum + (u.is_launch_offer ? PRICES.launchMonth : PRICES.month)
  }, 0)

  return {
    total,
    active: active.length,
    cancelled: cancelled.length,
    trialsRunning: trialsRunning.length,
    trialsExpired: trialsExpired.length,
    signups7: signups(7),
    signups30: signups(30),
    signupsByDay,
    expiringSoon,
    conversionRate: total > 0 ? round1((everSubscribed / total) * 100) : null,
    churnRate30,
    cancelled30: cancelled30.length,
    avgDaysToCancel,
    cancelBuckets,
    cancelReasons: countBy(cancelled, (u) => u.cancellation_reason ?? 'non_precise'),
    avgDaysToFirstPayment,
    mrr: Math.round(mrr),
    launchOffer: { redeemed: launchRedeemed, limit: 100 },
  }
}

export function computeEventKpis(events: EventRow[]) {
  const named = (name: string) => events.filter((e) => e.name === name)
  const prop = (e: EventRow, key: string) => {
    const v = e.props?.[key]
    return v === undefined ? undefined : String(v)
  }

  const timeByPath = new Map<string, { total: number; n: number }>()
  for (const e of named('Time on Page')) {
    const seconds = Number(e.props?.seconds)
    if (!Number.isFinite(seconds)) continue
    const cur = timeByPath.get(e.path) ?? { total: 0, n: 0 }
    cur.total += seconds
    cur.n += 1
    timeByPath.set(e.path, cur)
  }

  const landingViews = events.filter((e) => e.name === 'pageview' && e.path === '/').length
  const funnel = [
    { label: 'Visites de la page d’accueil', count: landingViews },
    { label: 'Clic sur un bouton d’appel à l’action', count: named('CTA Click').length },
    { label: 'Formulaire d’inscription envoyé', count: named('Signup Submit').length },
    { label: 'Compte créé', count: named('Signup Success').length },
    { label: 'Paiement commencé', count: named('Checkout Start').length },
    { label: 'Paiement réussi', count: named('Payment Success').length },
  ]

  return {
    totalEvents: events.length,
    funnel,
    ctaByLocation: countBy(named('CTA Click'), (e) => prop(e, 'location')),
    sectionViews: countBy(named('Section View'), (e) => prop(e, 'section')),
    topPages: countBy(named('pageview'), (e) => e.path).slice(0, 15),
    timeOnPage: [...timeByPath.entries()]
      .map(([path, { total, n }]) => ({ path, avgSeconds: Math.round(total / n), visits: n }))
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 15),
    featureViews: countBy(named('Feature View'), (e) => prop(e, 'name')),
    faqOpens: countBy(named('FAQ Open'), (e) => prop(e, 'question')).slice(0, 10),
    demoClicks: named('Demo Click').length,
  }
}
