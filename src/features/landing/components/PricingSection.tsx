import { useState } from 'react'
import { Button } from '@/components/ui/button'
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
import { useLaunchOfferAvailability } from '@/features/payment/useLaunchOfferAvailability'
import { cn } from '@/lib/utils'

const euro = (n: number) => `${n} €`

interface PricingSectionProps {
  /** Auth-aware : "Commencer gratuitement" tant qu'il n'y a pas de compte, "Ouvrir l'application"/"Continuer" ensuite. */
  ctaLabel: string
  onStart: () => void
}

/**
 * Tarifs de la landing publique. L'offre de lancement, quand elle est
 * disponible, prend sa propre carte plutôt qu'un simple bandeau au-dessus
 * du choix Gratuit/Pro — même raison qu'sur /paiement (PaymentPage.tsx) :
 * le mois offert (propre aux 100 premières) et la remise annuelle
 * habituelle (la même pour toutes) doivent rester visuellement distincts,
 * jamais additionnés en "3 mois offerts".
 *
 * Aucun bouton ici ne parle à Stripe directement : la landing ne fait que
 * qualifier et envoyer vers l'inscription (onStart) — le choix du tarif
 * (standard ou offre de lancement) se fait après coup sur /paiement, où
 * la session Checkout est réellement créée.
 */
export function PricingSection({ ctaLabel, onStart }: PricingSectionProps) {
  const [billing, setBilling] = useState<'month' | 'year'>('month')
  const { offer: launchOffer } = useLaunchOfferAvailability()
  const hasLaunchOffer = Boolean(launchOffer?.available)

  return (
    <div className="flex flex-col gap-8">
      <div
        role="group"
        aria-label="Périodicité de facturation"
        className="mx-auto inline-flex w-fit rounded-full border border-border bg-card p-1 text-sm"
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

      <div className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
        <article className="flex flex-col rounded-2xl border border-border bg-card p-8">
          <h3 className="font-heading text-2xl font-semibold text-foreground">Gratuit</h3>
          <p className="mt-4 font-heading text-5xl font-semibold tracking-tight text-foreground">0 €</p>
          <p className="mt-1 text-sm text-muted-foreground">Sans limite de durée</p>
          <ul className="mt-8 flex flex-col gap-3 text-sm">
            {GRATUIT_FEATURES.map((f) => (
              <PlanFeature key={f}>{f}</PlanFeature>
            ))}
          </ul>
          <Button variant="outline" size="lg" className="mt-8 w-full" onClick={onStart}>
            {ctaLabel}
          </Button>
        </article>

        {hasLaunchOffer ? (
          <article className="relative flex flex-col rounded-2xl border-2 border-primary bg-card p-8 shadow-(--shadow-raised)">
            <span className="absolute -top-3 left-8 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-sm">
              🎉 Offre de lancement — {LAUNCH_OFFER_LIMIT} premières clientes
            </span>
            <h3 className="font-heading text-2xl font-semibold text-foreground">Solo — offre de lancement</h3>
            <p className="mt-4 font-heading text-5xl font-semibold tracking-tight text-foreground">
              {billing === 'month' ? euro(LAUNCH_OFFER_PRICE_MONTHLY) : euro(LAUNCH_OFFER_PRICE_ANNUAL)}
              <span className="text-base font-normal text-muted-foreground">{billing === 'month' ? ' / mois' : ' / an'}</span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {LAUNCH_OFFER_FREE_MONTHS} mois offert{LAUNCH_OFFER_FREE_MONTHS > 1 ? 's' : ''}, puis {euro(LAUNCH_OFFER_PRICE_MONTHLY)}/mois
              verrouillé à vie pour toi. Une fois les {LAUNCH_OFFER_LIMIT} places prises, le tarif standard passe à {euro(PRICE_MONTHLY)}/mois
              pour les nouvelles inscriptions.
            </p>
            {billing === 'year' && (
              <p className="mt-2 text-xs text-muted-foreground">
                {euro(LAUNCH_OFFER_PRICE_ANNUAL)}/an au lieu de {euro(LAUNCH_OFFER_PRICE_MONTHLY * 12)}/an : la remise annuelle habituelle
                ({LAUNCH_OFFER_ANNUAL_FREE_MONTHS} mois) s'ajoute au mois offert, mais n'en fait pas partie.
              </p>
            )}
            <ul className="mt-8 flex flex-col gap-3 text-sm">
              {PRO_FEATURES.map((f) => (
                <PlanFeature key={f}>{f}</PlanFeature>
              ))}
            </ul>
            <Button size="lg" className="mt-8 w-full" onClick={onStart}>
              {ctaLabel}
            </Button>
            <div className="mt-4 flex flex-col gap-1.5">
              <p className="text-center text-sm font-semibold text-foreground">
                {launchOffer!.remaining} place{launchOffer!.remaining > 1 ? 's' : ''} restante{launchOffer!.remaining > 1 ? 's' : ''} sur{' '}
                {LAUNCH_OFFER_LIMIT}
              </p>
              <div
                role="progressbar"
                aria-label="Places prises sur l'offre de lancement"
                aria-valuenow={launchOffer!.redeemed}
                aria-valuemin={0}
                aria-valuemax={LAUNCH_OFFER_LIMIT}
                className="h-2.5 w-full overflow-hidden rounded-full bg-muted"
              >
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-500"
                  style={{ width: `${Math.min(100, (launchOffer!.redeemed / LAUNCH_OFFER_LIMIT) * 100)}%` }}
                />
              </div>
            </div>
          </article>
        ) : (
          <article className="relative flex flex-col rounded-2xl border-2 border-primary bg-card p-8 shadow-(--shadow-raised)">
            <span className="absolute -top-3 left-8 rounded-full bg-accent px-3 py-0.5 text-xs font-medium text-accent-foreground">
              Essai gratuit {TRIAL_DAYS} jours
            </span>
            <h3 className="font-heading text-2xl font-semibold text-foreground">Solo</h3>
            <p className="mt-4 font-heading text-5xl font-semibold tracking-tight text-foreground">
              {billing === 'month' ? euro(PRICE_MONTHLY) : euro(PRICE_ANNUAL)}
              <span className="text-base font-normal text-muted-foreground">{billing === 'month' ? ' / mois' : ' / an'}</span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {billing === 'month' ? 'Sans engagement, annulable à tout moment' : `Soit ${ANNUAL_FREE_MONTHS} mois offerts par rapport au mensuel`}
            </p>
            <ul className="mt-8 flex flex-col gap-3 text-sm">
              {PRO_FEATURES.map((f) => (
                <PlanFeature key={f}>{f}</PlanFeature>
              ))}
            </ul>
            <Button size="lg" className="mt-8 w-full" onClick={onStart}>
              Essai gratuit {TRIAL_DAYS} jours
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">Sans carte bancaire</p>
          </article>
        )}
      </div>

      <p className="mx-auto max-w-2xl text-center text-sm text-muted-foreground">
        Résilie en un clic, sans justification à donner. Tes mariages, tâches et finances restent stockés sur ton appareil — exportables
        en un clic à tout moment, même si tu arrêtes RELIA.
      </p>
    </div>
  )
}
