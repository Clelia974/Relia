import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CalendarPlus, Check, CircleCheck, Copy, LayoutDashboard, Mail, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CONTACT_EMAIL, LAUNCH_OFFER_ANNUAL_FREE_MONTHS } from '@/features/landing/landingContent'
import { track } from '@/lib/analytics'
import { cn } from '@/lib/utils'

/** URL d'une courte vidéo de prise en main (YouTube/Vimeo « embed »). Vide tant qu'elle n'existe pas : le bloc est alors masqué. */
const ONBOARDING_VIDEO_URL = ''

const SITE_URL = 'https://silkyplace.evenementscles.com'
const SHARE_TEXT = 'Je viens de ranger tous mes mariages au même endroit avec SilkyPlace.'

const STEPS = [
  { icon: CircleCheck, title: 'Ton abonnement s’active', text: 'Quelques instants suffisent, il n’y a rien à faire de ton côté.' },
  { icon: CalendarPlus, title: 'Ajoute ton prochain mariage', text: 'Ou importe ceux que tu as déjà dans ton fichier Excel.' },
  { icon: LayoutDashboard, title: 'Ouvre ton tableau du jour', text: 'Tu vois ce qui est confirmé, ce qui reste à faire et ce qui doit être payé.' },
]

const SHARE_LINKS = [
  { label: 'WhatsApp', href: `https://wa.me/?text=${encodeURIComponent(`${SHARE_TEXT} ${SITE_URL}`)}` },
  { label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SITE_URL)}` },
  { label: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(SITE_URL)}` },
]

export function ThankYouPage() {
  const [searchParams] = useSearchParams()
  const [copied, setCopied] = useState(false)
  // Posé par api/stripe/checkout-session.ts selon le prix choisi : l'upsell annuel n'a de sens que pour le mensuel.
  const isMonthly = searchParams.get('formule') === 'mensuel'

  // Objectif de conversion « achat » : la cliente arrive ici depuis Stripe, une fois le paiement validé.
  useEffect(() => {
    track('Payment Success', { formule: searchParams.get('formule') ?? 'inconnue' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const copyLink = async () => {
    track('Share Click', { network: 'lien' })
    try {
      await navigator.clipboard.writeText(SITE_URL)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 py-6">
      <header className="flex flex-col items-center gap-4 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-[#A9B08F]/30 text-[#5F6B4C]">
          <Check className="size-7" aria-hidden="true" />
        </span>
        <h1 className="text-balance font-heading text-4xl font-semibold tracking-tight text-[#520C0C] sm:text-5xl">
          Merci, tu fais maintenant partie de SilkyPlace
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          Ton paiement est bien reçu. Tu n’as plus rien à garder en tête : on s’occupe du reste.
        </p>
        <Button asChild size="lg" className="mt-2 h-12 rounded-full bg-[#520C0C] px-8 text-base text-[#FBF3EA] hover:bg-[#520C0C]/90">
          <Link to="/aujourdhui">Ouvrir SilkyPlace</Link>
        </Button>
      </header>

      <section aria-labelledby="suite">
        <h2 id="suite" className="font-heading text-2xl font-semibold text-foreground">Et maintenant ?</h2>
        <ol className="mt-5 grid gap-4 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="rounded-2xl border border-border bg-card p-5 shadow-(--shadow-card)">
              <div className="flex items-center gap-3">
                <span className="font-heading text-2xl font-semibold text-[#520C0C]/30">{i + 1}</span>
                <step.icon className="size-5 text-[#5F6B4C]" aria-hidden="true" />
              </div>
              <p className="mt-3 font-heading text-lg font-semibold text-foreground">{step.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {ONBOARDING_VIDEO_URL && (
        <section aria-labelledby="video">
          <h2 id="video" className="font-heading text-2xl font-semibold text-foreground">Prise en main en 90 secondes</h2>
          <div className="mt-5 aspect-video overflow-hidden rounded-2xl border border-border shadow-(--shadow-card)">
            <iframe
              src={ONBOARDING_VIDEO_URL}
              title="Prise en main de SilkyPlace"
              className="size-full"
              allow="accelerometer; encrypted-media; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          </div>
        </section>
      )}

      {isMonthly && (
        <section aria-labelledby="annuel" className="flex flex-col gap-3 rounded-2xl border border-[#520C0C]/20 bg-secondary p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="annuel" className="flex items-center gap-2 font-heading text-xl font-semibold text-[#520C0C]">
              <Sparkles className="size-5" aria-hidden="true" />
              Passe à l’annuel : {LAUNCH_OFFER_ANNUAL_FREE_MONTHS} mois offerts
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">Même formule Solo, payée à l’année. Tu peux changer quand tu veux depuis Abonnement.</p>
          </div>
          <Button asChild variant="outline" className="rounded-full border-[#520C0C] text-[#520C0C]">
            <Link to="/paiement">Voir l’offre annuelle</Link>
          </Button>
        </section>
      )}

      <section aria-labelledby="partage" className="flex flex-col gap-3">
        <h2 id="partage" className="font-heading text-2xl font-semibold text-foreground">Une collègue en a besoin ?</h2>
        <div className="flex flex-wrap gap-2">
          {SHARE_LINKS.map((s) => (
            <Button key={s.label} asChild variant="outline" className="rounded-full">
              <a href={s.href} target="_blank" rel="noopener noreferrer" onClick={() => track('Share Click', { network: s.label })}>{s.label}</a>
            </Button>
          ))}
          <Button variant="outline" className={cn('rounded-full')} onClick={copyLink}>
            <Copy className="size-4" aria-hidden="true" />
            {copied ? 'Lien copié' : 'Copier le lien'}
          </Button>
        </div>
      </section>

      <footer className="flex items-center gap-3 border-t border-border pt-6 text-sm text-muted-foreground">
        <Mail className="size-4 shrink-0" aria-hidden="true" />
        <p>
          Une question sur ton abonnement ? Écris à{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-foreground underline underline-offset-4">{CONTACT_EMAIL}</a>
        </p>
      </footer>
    </div>
  )
}
