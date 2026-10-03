import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PlanFeature } from '@/features/landing/components/PlanFeature'
import {
  ANNUAL_FREE_MONTHS,
  GRATUIT_FEATURES,
  LAUNCH_OFFER_ANNUAL_FREE_MONTHS,
  LAUNCH_OFFER_FREE_MONTHS,
  LAUNCH_OFFER_LIMIT,
  LAUNCH_OFFER_PRICE_ANNUAL,
  LAUNCH_OFFER_PRICE_MONTHLY,
  PRICE_ANNUAL,
  PRICE_MONTHLY,
  PRO_FEATURES,
  TRIAL_DAYS,
} from '@/features/landing/landingContent'
import { SubscriptionStatusBadge } from '@/features/payment/components/SubscriptionStatusBadge'
import { useLaunchOfferAvailability } from '@/features/payment/useLaunchOfferAvailability'
import { useStripeCheckout } from '@/features/payment/useStripeCheckout'
import { useStripeCustomerPortal } from '@/features/payment/useStripeCustomerPortal'
import { useSubscriptionCheck } from '@/features/payment/useSubscriptionCheck'
import { useWeddingLimit } from '@/features/payment/useWeddingLimit'
import { cn } from '@/lib/utils'

const euro = (n: number) => `${n} €`

const STATUS_MESSAGE: Record<string, string> = {
  trial: "Tu profites de l'essai Solo complet — aucune carte bancaire requise.",
  grace: "Ton essai Solo (14 jours) est terminé. Tu continues à utiliser SilkyPlace normalement — passe à Solo dès que tu es prête pour continuer à en profiter.",
  expired: "Ton essai Solo est terminé. Tu restes sur la version Gratuite — passe à Solo dès que tu es prête.",
  active: 'Merci ! Ton abonnement Solo est actif.',
  cancelled: 'Ton abonnement a été annulé. Réabonne-toi pour retrouver Solo.',
}

export function PaymentPage() {
  const { status, daysLeftInTrial, isLoading } = useSubscriptionCheck()
  const { createCheckoutSession, isLoading: isCheckoutLoading, error: checkoutError } = useStripeCheckout()
  const { openCustomerPortal, isLoading: isPortalLoading, error: portalError } = useStripeCustomerPortal()
  const { weddingCount, limit: weddingLimit, limitReached: weddingLimitReached } = useWeddingLimit()
  const { offer: launchOffer } = useLaunchOfferAvailability()
  const [billing, setBilling] = useState<'month' | 'year'>('month')
  const [searchParams, setSearchParams] = useSearchParams()

  // Réservée aux comptes qui n'ont encore jamais payé — "100 premières clientes", pas une réduction de réabonnement.
  const isEligibleForLaunchOffer = status === 'trial' || status === 'grace' || status === 'expired'
  // Tant que l'offre de lancement est disponible, c'est le SEUL prix affiché ; le tarif standard n'apparaît qu'ensuite.
  const showLaunchOffer = isEligibleForLaunchOffer && Boolean(launchOffer?.available)

  useEffect(() => {
    const result = searchParams.get('paiement')
    if (!result) return
    if (result === 'succes') toast.success('Paiement en cours de confirmation — ton abonnement sera actif dans quelques instants.')
    if (result === 'annule') toast.info('Paiement annulé — tu peux réessayer à tout moment.')
    const next = new URLSearchParams(searchParams)
    next.delete('paiement')
    setSearchParams(next, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const priceIdEnvKey = billing === 'month' ? 'VITE_STRIPE_PRICE_SOLO_MONTHLY' : 'VITE_STRIPE_PRICE_SOLO_YEARLY'
  const priceId = import.meta.env[priceIdEnvKey as keyof ImportMetaEnv] as string | undefined

  const handleUpgrade = () => {
    if (!priceId) {
      toast.error("Configuration de paiement incomplète — contactez le support.")
      return
    }
    createCheckoutSession(priceId)
  }

  const launchOfferPriceIdEnvKey = billing === 'month' ? 'VITE_STRIPE_PRICE_LAUNCH_OFFER' : 'VITE_STRIPE_PRICE_LAUNCH_OFFER_ANNUAL'
  const launchOfferPriceId = import.meta.env[launchOfferPriceIdEnvKey as keyof ImportMetaEnv] as string | undefined
  const handleLaunchOffer = () => {
    if (!launchOfferPriceId) {
      toast.error("Configuration de paiement incomplète — contactez le support.")
      return
    }
    createCheckoutSession(launchOfferPriceId)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground">Abonnement</h1>
        <p className="mt-1 text-sm text-muted-foreground">Passe à Solo quand tu es prête — jamais d'accès coupé entre-temps.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>Ton statut</CardTitle>
            {!isLoading && status && <SubscriptionStatusBadge status={status} />}
          </div>
          {!isLoading && status && <CardDescription>{STATUS_MESSAGE[status]}</CardDescription>}
        </CardHeader>
        {(status === 'trial' || weddingLimitReached) && (
          <CardContent className="flex flex-col gap-2">
            {status === 'trial' && daysLeftInTrial !== null && daysLeftInTrial !== undefined && (
              <p className="text-sm text-foreground">
                <strong>{daysLeftInTrial}</strong> jour{daysLeftInTrial > 1 ? 's' : ''} restant{daysLeftInTrial > 1 ? 's' : ''} sur ton essai de {TRIAL_DAYS} jours.
              </p>
            )}
            {weddingLimitReached && (
              <p className="text-sm text-warning">
                {weddingCount} / {weddingLimit} mariages — limite de la version Gratuite atteinte.
              </p>
            )}
          </CardContent>
        )}
      </Card>

      {(status === 'active' || status === 'cancelled') && (
        <Card>
          <CardHeader>
            <CardTitle>Gérer mon abonnement</CardTitle>
            <CardDescription>
              Moyen de paiement, factures, ou annulation — tout se passe sur une page sécurisée gérée par Stripe.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button variant="outline" className="w-fit" loading={isPortalLoading} onClick={openCustomerPortal}>
              {!isPortalLoading && 'Gérer mon abonnement et mes factures'}
            </Button>
            {portalError && <p className="text-sm text-risk">{portalError}</p>}
          </CardContent>
        </Card>
      )}

      {showLaunchOffer && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle>Offre de lancement — {LAUNCH_OFFER_LIMIT} premières clientes</CardTitle>
            <CardDescription>
              {LAUNCH_OFFER_FREE_MONTHS} mois offert{LAUNCH_OFFER_FREE_MONTHS > 1 ? 's' : ''} en plus de l’essai, puis ce tarif verrouillé — même si le tarif
              standard augmente plus tard, il reste le tien tant que tu restes abonnée.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div
              role="group"
              aria-label="Périodicité de facturation — offre de lancement"
              className="inline-flex w-fit rounded-full border border-border bg-card p-1 text-sm"
            >
              {(
                [
                  ['month', 'Mensuel'],
                  ['year', 'Annuel'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={billing === value}
                  onClick={() => setBilling(value)}
                  className={cn(
                    'rounded-full px-4 py-1.5 font-medium transition-[color,background-color] duration-200',
                    billing === value ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            <p className="font-heading text-4xl font-semibold tracking-tight text-foreground">
              {billing === 'month' ? euro(LAUNCH_OFFER_PRICE_MONTHLY) : euro(LAUNCH_OFFER_PRICE_ANNUAL)}
              <span className="text-base font-normal text-muted-foreground">{billing === 'month' ? ' / mois' : ' / an'}</span>
            </p>

            {/* Les deux avantages sont volontairement distingués : le mois offert (propre à cette offre) et la remise
                annuelle (identique pour toutes les clientes, offre ou pas) — jamais additionnés en "3 mois offerts",
                ce qui laisserait croire que la remise annuelle est un bonus réservé aux 100 premières. */}
            {billing === 'year' && (
              <p className="text-sm text-muted-foreground">
                {euro(LAUNCH_OFFER_PRICE_ANNUAL)}/an au lieu de {euro(LAUNCH_OFFER_PRICE_MONTHLY * 12)}/an : la remise annuelle habituelle
                ({LAUNCH_OFFER_ANNUAL_FREE_MONTHS} mois) s'ajoute au mois offert de l'offre de lancement, mais n'en fait pas partie.
              </p>
            )}

            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-semibold text-foreground">
                {launchOffer!.remaining} place{launchOffer!.remaining > 1 ? 's' : ''} restante{launchOffer!.remaining > 1 ? 's' : ''} sur{' '}
                {LAUNCH_OFFER_LIMIT}
              </p>
              <div
                role="progressbar"
                aria-label="Places prises sur l'offre de lancement"
                aria-valuenow={launchOffer!.redeemed}
                aria-valuemin={0}
                aria-valuemax={LAUNCH_OFFER_LIMIT}
                className="h-2.5 w-full max-w-sm overflow-hidden rounded-full bg-muted"
              >
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-500"
                  style={{ width: `${Math.min(100, (launchOffer!.redeemed / LAUNCH_OFFER_LIMIT) * 100)}%` }}
                />
              </div>
            </div>

            <Button size="lg" className="w-fit" loading={isCheckoutLoading} onClick={handleLaunchOffer}>
              {!isCheckoutLoading && "Profiter de l'offre de lancement"}
            </Button>
            {checkoutError && <p className="text-sm text-risk">{checkoutError}</p>}
          </CardContent>
        </Card>
      )}

      {status !== 'active' && (
        <Card>
          <CardHeader>
            <CardTitle>Comparer les offres</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <p className="font-heading text-lg font-semibold text-foreground">Gratuit</p>
              <ul className="mt-4 flex flex-col gap-2.5 text-sm">
                {GRATUIT_FEATURES.map((f) => (
                  <PlanFeature key={f}>{f}</PlanFeature>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-heading text-lg font-semibold text-foreground">Solo</p>
              <ul className="mt-4 flex flex-col gap-2.5 text-sm">
                {PRO_FEATURES.map((f) => (
                  <PlanFeature key={f}>{f}</PlanFeature>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {status !== 'active' && !showLaunchOffer && (
        <Card>
          <CardHeader>
            <CardTitle>Passer à Solo</CardTitle>
            <CardDescription>Accès complet, sans engagement, annulable à tout moment.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div
              role="group"
              aria-label="Périodicité de facturation"
              className="inline-flex w-fit rounded-full border border-border bg-card p-1 text-sm"
            >
              {(
                [
                  ['month', 'Mensuel'],
                  ['year', `Annuel · ${ANNUAL_FREE_MONTHS} mois offerts`],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={billing === value}
                  onClick={() => setBilling(value)}
                  className={cn(
                    'rounded-full px-4 py-1.5 font-medium transition-[color,background-color] duration-200',
                    billing === value ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            <p className="font-heading text-4xl font-semibold tracking-tight text-foreground">
              {billing === 'month' ? euro(PRICE_MONTHLY) : euro(PRICE_ANNUAL)}
              <span className="text-base font-normal text-muted-foreground">{billing === 'month' ? ' / mois' : ' / an'}</span>
            </p>

            <Button size="lg" className="w-fit" loading={isCheckoutLoading} onClick={handleUpgrade}>
              {!isCheckoutLoading && 'Passer à Solo'}
            </Button>

            {checkoutError && <p className="text-sm text-risk">{checkoutError}</p>}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
