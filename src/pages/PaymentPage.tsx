import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PlanFeature } from '@/features/landing/components/PlanFeature'
import { ANNUAL_FREE_MONTHS, GRATUIT_FEATURES, PRICE_ANNUAL, PRICE_MONTHLY, PRO_FEATURES, TRIAL_DAYS } from '@/features/landing/landingContent'
import { SubscriptionStatusBadge } from '@/features/payment/components/SubscriptionStatusBadge'
import { useStripeCheckout } from '@/features/payment/useStripeCheckout'
import { useStripeCustomerPortal } from '@/features/payment/useStripeCustomerPortal'
import { useSubscriptionCheck } from '@/features/payment/useSubscriptionCheck'
import { useWeddingLimit } from '@/features/payment/useWeddingLimit'
import { cn } from '@/lib/utils'

const euro = (n: number) => `${n} €`

const STATUS_MESSAGE: Record<string, string> = {
  trial: "Vous profitez de l'essai Pro complet — aucune carte bancaire requise.",
  grace: "Votre essai Pro (14 jours) est terminé. Vous continuez à utiliser Relia normalement — passez au Pro dès que vous êtes prête pour continuer à en profiter.",
  expired: "Votre essai Pro est terminé. Vous restez sur la version Gratuite — passez au Pro dès que vous êtes prête.",
  active: 'Merci ! Votre abonnement Pro est actif.',
  cancelled: 'Votre abonnement a été annulé. Réabonnez-vous pour retrouver le Pro.',
}

export function PaymentPage() {
  const { status, daysLeftInTrial, isLoading } = useSubscriptionCheck()
  const { createCheckoutSession, isLoading: isCheckoutLoading, error: checkoutError } = useStripeCheckout()
  const { openCustomerPortal, isLoading: isPortalLoading, error: portalError } = useStripeCustomerPortal()
  const { weddingCount, limit: weddingLimit, limitReached: weddingLimitReached } = useWeddingLimit()
  const [billing, setBilling] = useState<'month' | 'year'>('month')
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    const result = searchParams.get('paiement')
    if (!result) return
    if (result === 'succes') toast.success('Paiement en cours de confirmation — votre abonnement sera actif dans quelques instants.')
    if (result === 'annule') toast.info('Paiement annulé — vous pouvez réessayer à tout moment.')
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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground">Abonnement</h1>
        <p className="mt-1 text-sm text-muted-foreground">Passez au Pro quand vous êtes prête — jamais d'accès coupé entre-temps.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>Votre statut</CardTitle>
            {!isLoading && status && <SubscriptionStatusBadge status={status} />}
          </div>
          {!isLoading && status && <CardDescription>{STATUS_MESSAGE[status]}</CardDescription>}
        </CardHeader>
        {(status === 'trial' || weddingLimitReached) && (
          <CardContent className="flex flex-col gap-2">
            {status === 'trial' && daysLeftInTrial !== null && daysLeftInTrial !== undefined && (
              <p className="text-sm text-foreground">
                <strong>{daysLeftInTrial}</strong> jour{daysLeftInTrial > 1 ? 's' : ''} restant{daysLeftInTrial > 1 ? 's' : ''} sur votre essai de {TRIAL_DAYS} jours.
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
              <p className="font-heading text-lg font-semibold text-foreground">Pro</p>
              <ul className="mt-4 flex flex-col gap-2.5 text-sm">
                {PRO_FEATURES.map((f) => (
                  <PlanFeature key={f}>{f}</PlanFeature>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {status !== 'active' && (
        <Card>
          <CardHeader>
            <CardTitle>Passer au Pro</CardTitle>
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
              {!isCheckoutLoading && 'Passer au Pro'}
            </Button>

            {checkoutError && <p className="text-sm text-risk">{checkoutError}</p>}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
