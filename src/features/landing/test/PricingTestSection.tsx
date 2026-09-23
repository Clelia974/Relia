import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { PlanFeature } from '@/features/landing/components/PlanFeature'
import { ANNUAL_FREE_MONTHS, GRATUIT_FEATURES, PRICE_ANNUAL, PRICE_MONTHLY, PRO_FEATURES, TRIAL_DAYS } from '@/features/landing/landingContent'
import { cn } from '@/lib/utils'

const euro = (n: number) => `${n} €`

/** Mêmes chiffres/fonctionnalités que la vraie landing (Tarifs) — juste la mise en page reprend le cadrage "Choisis ton forfait" du site de référence. */
export function PricingTestSection() {
  const navigate = useNavigate()
  const [billing, setBilling] = useState<'month' | 'year'>('month')

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

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <article className="flex flex-col rounded-2xl border border-border bg-card p-8">
          <h3 className="font-heading text-2xl font-semibold text-foreground">Gratuit</h3>
          <p className="mt-4 font-heading text-5xl font-semibold tracking-tight text-foreground">0 €</p>
          <p className="mt-1 text-sm text-muted-foreground">Sans limite de durée</p>
          <ul className="mt-8 flex flex-col gap-3 text-sm">
            {GRATUIT_FEATURES.map((f) => (
              <PlanFeature key={f}>{f}</PlanFeature>
            ))}
          </ul>
          <Button variant="outline" size="lg" className="mt-8 w-full" onClick={() => navigate('/inscription')}>
            Commencer gratuitement
          </Button>
        </article>

        <article className="relative flex flex-col rounded-2xl border-2 border-primary bg-card p-8 shadow-(--shadow-raised)">
          <span className="absolute -top-3 left-8 rounded-full bg-accent px-3 py-0.5 text-xs font-medium text-accent-foreground">
            Essai gratuit {TRIAL_DAYS} jours
          </span>
          <h3 className="font-heading text-2xl font-semibold text-foreground">Pro</h3>
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
          <Button size="lg" className="mt-8 w-full" onClick={() => navigate('/inscription')}>
            Essai gratuit {TRIAL_DAYS} jours
          </Button>
          <p className="mt-3 text-center text-xs text-muted-foreground">Sans carte bancaire</p>
        </article>
      </div>
    </div>
  )
}
