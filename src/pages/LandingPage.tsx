import { useEffect, useState } from 'react'
import {
  ArrowRight,
  Check,
  ChevronDown,
  ClipboardCheck,
  Clock,
  Package,
  Search,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  ANNUAL_FREE_MONTHS,
  BILLING_LIVE,
  CONTACT_EMAIL,
  FAQ,
  GRATUIT_FEATURES,
  LAUNCH_OFFER_FREE_MONTHS,
  LAUNCH_OFFER_LIMIT,
  PAIN_POINTS,
  PRICE_ANNUAL,
  PRICE_MONTHLY,
  PRO_FEATURES,
  SOLUTION_POINTS,
  TESTIMONIALS,
  TRIAL_DAYS,
} from '@/features/landing/landingContent'
import { AuthenticatedHeader } from '@/app/layout/AuthenticatedHeader'
import { PlanFeature } from '@/features/landing/components/PlanFeature'
import { CookieNotice } from '@/features/legal/CookieNotice'
import { LegalLinks } from '@/features/legal/LegalLinks'
import { useLaunchOfferAvailability } from '@/features/payment/useLaunchOfferAvailability'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { useWorkspaceStore } from '@/store/workspaceStore'

const CONTAINER = 'mx-auto w-full max-w-6xl px-5 sm:px-8'
const SECTION = 'scroll-mt-20 py-16 sm:py-24'
const H2 = 'text-balance font-heading text-3xl font-semibold tracking-tight text-primary dark:text-accent-foreground sm:text-4xl'
const CTA_BUTTON = 'h-12 px-7 text-base'

const euro = (n: number) => `${n} €`

export function LandingPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const resetWorkspace = useWorkspaceStore((s) => s.resetWorkspace)
  const [billing, setBilling] = useState<'month' | 'year'>('month')
  const { offer: launchOffer } = useLaunchOfferAvailability()

  useEffect(() => {
    const root = document.documentElement
    const wasDark = root.classList.contains('dark')
    root.classList.remove('dark')
    return () => {
      if (wasDark) root.classList.add('dark')
    }
  }, [])

  const onboarded = useWorkspaceStore((s) => s.workspace.userProfile.onboarded)
  /** Compte requis pour tout le reste de l'app (cf. ProtectedRoute sur AppLayout/onboarding) : la landing doit d'abord faire créer un compte avant de proposer onboarding/app. */
  const ctaLabel = !isAuthenticated ? 'Commencer gratuitement' : onboarded ? "Ouvrir l'application" : 'Continuer'
  const start = () => {
    if (!isAuthenticated) navigate('/inscription')
    else navigate(onboarded ? '/aujourdhui' : '/onboarding')
  }
  /** Proposée uniquement tant que l'espace n'a jamais été configuré : charger la démo n'écrase ainsi aucune donnée. Sans compte, la démo pré-remplit l'espace local puis renvoie vers l'inscription — elle sera là, déjà peuplée, une fois connecté·e. */
  const openDemo = () => {
    resetWorkspace('demo')
    navigate(isAuthenticated ? '/aujourdhui' : '/inscription')
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Aller au contenu
      </a>

      <AuthenticatedHeader />

      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className={cn(CONTAINER, 'flex h-16 items-center justify-between gap-4')}>
          <a href="#haut" className="flex items-center gap-2" aria-label="RELIA — haut de page">
            <img src="/brand/relia-monogram.svg" alt="" className="size-9" />
            <span className="font-heading text-2xl font-semibold tracking-tight text-primary">Relia</span>
          </a>
          <nav aria-label="Sections de la page" className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a href="#fonctionnalites" className="transition-colors hover:text-foreground">Fonctionnalités</a>
            <a href="#tarifs" className="transition-colors hover:text-foreground">Tarifs</a>
            <a href="#questions" className="transition-colors hover:text-foreground">Questions</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={start}>{ctaLabel}</Button>
          </div>
        </div>
      </header>

      <main id="contenu">
        {/* 1 — HERO */}
        <section id="haut" className="overflow-hidden pb-16 pt-12 sm:pb-24 sm:pt-20">
          <div className={cn(CONTAINER, 'grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16')}>
            <div className="flex flex-col items-start gap-6 animate-page-in">
              <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-thread-text">
                <span className="size-1.5 rounded-full bg-thread" aria-hidden="true" />
                Le fil conducteur de vos mariages
              </span>
              <h1 className="text-balance font-heading text-4xl font-semibold leading-[1.05] tracking-tight text-primary dark:text-accent-foreground sm:text-5xl lg:text-6xl">
                Tout orchestré. Enfin la paix.
              </h1>
              <p className="max-w-xl text-pretty text-lg leading-relaxed text-foreground/80 sm:text-xl">
                L’app pensée pour les décoratrices et décorateurs de mariage qui veulent enfin respirer le Jour J, passer
                moins de temps à s’inquiéter et plus de temps à créer.
              </p>
              <ul className="flex flex-col gap-2.5 text-base">
                {[
                  'Moins de stress la veille du mariage',
                  'Tâches, matériel, prestataires et finances, tout est relié',
                  'Plus de temps pour ta créativité',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-sage/30 text-success">
                      <Check className="size-3.5" aria-hidden="true" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
                <Button size="lg" className={cn(CTA_BUTTON, 'w-full sm:w-auto')} onClick={start}>
                  {ctaLabel}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Button>
                {!onboarded && (
                  <Button variant="ghost" size="lg" className={cn(CTA_BUTTON, 'w-full sm:w-auto')} onClick={openDemo}>
                    Voir une démo
                  </Button>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Compte gratuit en 1 minute · Tes données restent dans ton navigateur · Démo avec des mariages fictifs
              </p>
            </div>

            <figure className="relative">
              <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-sage/20 blur-2xl" aria-hidden="true" />
              <img
                src="/landing/tableau-de-bord.jpg"
                width={1200}
                height={762}
                alt="Le tableau de bord de RELIA : les tâches du jour, les mariages à surveiller et les prochains événements"
                fetchPriority="high"
                decoding="async"
                className="w-full rounded-2xl border border-border bg-card shadow-(--shadow-raised)"
              />
            </figure>
          </div>
        </section>

        {/* 2 — LE PROBLÈME */}
        <section className={cn(SECTION, 'bg-card')} aria-labelledby="probleme">
          <div className={CONTAINER}>
            <div className="max-w-2xl">
              <h2 id="probleme" className={H2}>Le chaos du Jour J n’est pas une fatalité</h2>
              <p className="mt-4 text-lg leading-relaxed text-foreground/80">
                Si tu décores des mariages, tu connais cette sensation : quarante-huit heures avant, tu as l’impression
                d’avoir oublié quelque chose. Reconnais-toi ?
              </p>
            </div>
            <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {PAIN_POINTS.map((point) => (
                <li key={point.title} className="flex gap-4 rounded-xl border border-border bg-background p-5">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-risk-bg text-risk">
                    <X className="size-4" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-heading text-lg font-semibold text-foreground">{point.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{point.text}</p>
                  </div>
                </li>
              ))}
              <li className="flex items-center rounded-xl bg-primary p-6 text-primary-foreground sm:col-span-2 lg:col-span-1">
                <p className="font-heading text-xl font-semibold leading-snug">
                  Ce n’est pas toi. C’est l’outil qui manque.
                </p>
              </li>
            </ul>
          </div>
        </section>

        {/* 3 — LA SOLUTION */}
        <section className={SECTION} aria-labelledby="solution">
          <div className={CONTAINER}>
            <div className="max-w-2xl">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-success">La solution</p>
              <h2 id="solution" className={cn(H2, 'mt-3')}>Rencontre RELIA</h2>
              <p className="mt-4 text-lg leading-relaxed text-foreground/80">
                RELIA est née d’une question simple : et si le Jour J n’était pas un chaos organisé, mais tout
                simplement… organisé ? Elle est pensée pour les décoratrices et décorateurs de mariage indépendants.
              </p>
            </div>
            <ul className="mt-12 grid gap-x-10 gap-y-8 md:grid-cols-2">
              {SOLUTION_POINTS.map((point) => (
                <li key={point.title} className="flex gap-4">
                  <span className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-sage/30 text-success">
                    <Check className="size-4" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-heading text-xl font-semibold text-foreground">{point.title}</p>
                    <p className="mt-1.5 leading-relaxed text-muted-foreground">{point.text}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-12 font-heading text-2xl font-semibold text-primary dark:text-accent-foreground">Le résultat ? Tu respires. Tu crées. Tu réussis.</p>
          </div>
        </section>

        {/* 4 — FONCTIONNALITÉS */}
        <section id="fonctionnalites" className={cn(SECTION, 'bg-card')} aria-labelledby="fonctionnalites-titre">
          <div className={CONTAINER}>
            <div className="max-w-2xl">
              <h2 id="fonctionnalites-titre" className={H2}>Ce que tu peux faire avec RELIA</h2>
            </div>

            <div className="mt-14 flex flex-col gap-20">
              <FeatureRow
                image="/landing/tableau-de-bord.jpg"
                imageHeight={762}
                alt="Liste des tâches du jour dans RELIA, avec priorités et dates"
                icon={<ClipboardCheck className="size-5" aria-hidden="true" />}
                label="Tâches"
                title="Chaque matin, tu sais quoi faire"
                text="« Que dois-je faire aujourd’hui ? » : RELIA te répond. Priorités, dates limites, tâches reportées avec leur raison, et un calendrier mensuel filtrable par mariage ou par prestataire."
                bullets={['Priorités et échéances claires', 'Report d’une tâche avec sa raison', 'Calendrier mensuel avec filtres']}
              />
              <FeatureRow
                reverse
                image="/landing/jour-j.jpg"
                imageHeight={632}
                alt="Le déroulé du Jour J dans RELIA : les moments de la journée, avec le lieu et un bouton pour appeler le prestataire"
                icon={<Clock className="size-5" aria-hidden="true" />}
                label="Jour J"
                title="Le déroulé de la journée, minute par minute"
                text="Le déroulé chronologique du mariage, en liste ou en vue Gantt. Filtre par moment (installation, cérémonie, réception, démontage), appelle un prestataire d’un geste, et imprime ou enregistre le tout en PDF la veille."
                bullets={['Chevauchements de planning repérés', 'Appeler ou écrire au prestataire en un clic', 'Impression ou PDF du déroulé']}
              />
              <FeatureRow
                image="/landing/finances.jpg"
                imageHeight={632}
                alt="L'onglet Finances de RELIA : le budget restant à dépenser sur un mariage, avec une barre de progression"
                icon={<Wallet className="size-5" aria-hidden="true" />}
                label="Finances"
                title="Le budget du couple et ta rentabilité, côte à côte"
                text="Ce qu’il reste à dépenser pour le mariage, ton profit prévisionnel et ta marge. Tes devis et factures indicatives sont numérotés automatiquement, avec les coordonnées de ton client."
                bullets={['Reste à dépenser en un coup d’œil', 'Marge calculée pour chaque mariage', 'Devis et factures numérotés']}
              />
            </div>

            <ul className="mt-20 grid gap-5 md:grid-cols-3">
              {[
                {
                  icon: <Package className="size-5" aria-hidden="true" />,
                  title: 'Matériel',
                  text: 'Une checklist par mariage : quantité, statut, dégâts éventuels, destination au retour. Imprimable.',
                },
                {
                  icon: <Users className="size-5" aria-hidden="true" />,
                  title: 'Prestataires',
                  text: 'Un carnet unique : coordonnées, statut propre à chaque mariage, horaire d’arrivée et coûts.',
                },
                {
                  icon: <ClipboardCheck className="size-5" aria-hidden="true" />,
                  title: 'Bilan post-mariage',
                  text: 'Clôture le mariage avec son bilan financier, les retours de ton client et ton portfolio avant/après.',
                },
              ].map((item) => (
                <li key={item.title} className="rounded-xl border border-border bg-background p-6">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">{item.icon}</span>
                  <p className="mt-4 font-heading text-xl font-semibold text-foreground">{item.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                </li>
              ))}
            </ul>

            <p className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Et aussi :</span>
              <span className="inline-flex items-center gap-1.5"><Search className="size-3.5" aria-hidden="true" /> Recherche instantanée (Ctrl + K)</span>
              <span>Suivi du contrat</span>
              <span>Mode sombre</span>
              <span>Export de tes données</span>
            </p>
          </div>
        </section>

        {/* 5 — TÉMOIGNAGES (affichés uniquement s'il y en a de vrais) */}
        {TESTIMONIALS.length > 0 && (
          <section className={SECTION} aria-labelledby="temoignages">
            <div className={CONTAINER}>
              <h2 id="temoignages" className={H2}>Ce que disent les décoratrices et décorateurs</h2>
              <ul className="mt-12 grid gap-6 md:grid-cols-3">
                {TESTIMONIALS.map((t) => (
                  <li key={t.author} className="rounded-xl border border-border bg-card p-6">
                    <p className="font-heading text-xl font-semibold text-foreground">{t.headline}</p>
                    <blockquote className="mt-3 leading-relaxed text-muted-foreground">{t.quote}</blockquote>
                    <p className="mt-5 text-sm font-medium text-foreground">{t.author}</p>
                    <p className="text-sm text-muted-foreground">{t.role}</p>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* 6 — TARIFS */}
        <section id="tarifs" className={SECTION} aria-labelledby="tarifs-titre">
          <div className={CONTAINER}>
            <div className="mx-auto max-w-2xl text-center">
              <h2 id="tarifs-titre" className={H2}>Tarifs simples, pas de piège</h2>

              {launchOffer?.available && (
                <p className="mx-auto mt-4 w-fit rounded-full border border-primary/30 bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground">
                  Offre de lancement : {LAUNCH_OFFER_FREE_MONTHS} mois offert{LAUNCH_OFFER_FREE_MONTHS > 1 ? 's' : ''}, tarif verrouillé —{' '}
                  {launchOffer.remaining} place{launchOffer.remaining > 1 ? 's' : ''} restante{launchOffer.remaining > 1 ? 's' : ''} sur{' '}
                  {LAUNCH_OFFER_LIMIT}
                </p>
              )}

              <div
                role="group"
                aria-label="Périodicité de facturation"
                className="mt-8 inline-flex rounded-full border border-border bg-card p-1 text-sm"
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
            </div>

            <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
              <article className="flex flex-col rounded-2xl border border-border bg-card p-8">
                <h3 className="font-heading text-2xl font-semibold text-foreground">Gratuit</h3>
                <p className="mt-4 font-heading text-5xl font-semibold tracking-tight text-foreground">0 €</p>
                <p className="mt-1 text-sm text-muted-foreground">Sans limite de durée</p>
                <ul className="mt-8 flex flex-col gap-3 text-sm">
                  {GRATUIT_FEATURES.map((f) => (
                    <PlanFeature key={f}>{f}</PlanFeature>
                  ))}
                </ul>
                <Button variant="outline" size="lg" className={cn(CTA_BUTTON, 'mt-8 w-full')} onClick={start}>
                  {ctaLabel}
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
                <Button size="lg" className={cn(CTA_BUTTON, 'mt-8 w-full')} onClick={start}>
                  Essai gratuit {TRIAL_DAYS} jours
                </Button>
                <p className="mt-3 text-center text-xs text-muted-foreground">Sans carte bancaire</p>
              </article>
            </div>

            <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-muted-foreground">
              Pas de contrat, pas de surprise. Tes données t’appartiennent toujours.
              {!BILLING_LIVE && ' L’abonnement ouvre avec la connexion en ligne, très bientôt : d’ici là, RELIA est en accès libre.'}
            </p>
          </div>
        </section>

        {/* 7 — FAQ */}
        <section id="questions" className={cn(SECTION, 'bg-card')} aria-labelledby="faq">
          <div className={cn(CONTAINER, 'max-w-3xl')}>
            <h2 id="faq" className={H2}>Questions fréquentes</h2>
            <div className="mt-10 divide-y divide-border border-y border-border">
              {FAQ.map((item) => (
                <details key={item.q} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-md text-left font-heading text-lg font-semibold text-foreground outline-none marker:content-none focus-visible:ring-3 focus-visible:ring-ring/40">
                    {item.q}
                    <ChevronDown className="size-5 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" aria-hidden="true" />
                  </summary>
                  <p className="mt-3 leading-relaxed text-muted-foreground">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* 8 — APPEL FINAL */}
        <section className="bg-primary py-20 text-primary-foreground sm:py-28" aria-labelledby="final">
          <div className={cn(CONTAINER, 'flex flex-col items-center gap-6 text-center')}>
            <h2 id="final" className="text-balance font-heading text-3xl font-semibold tracking-tight sm:text-5xl">
              Prêt à respirer le Jour J ?
            </h2>
            <p className="max-w-xl text-lg leading-relaxed text-primary-foreground/85">
              Commence avec ton prochain mariage. Compte gratuit, tes données restent chez toi.
            </p>
            <Button
              size="lg"
              className={cn(CTA_BUTTON, 'bg-card text-primary shadow-(--shadow-raised) hover:bg-card hover:shadow-(--shadow-raised) dark:text-accent-foreground')}
              onClick={start}
            >
              {ctaLabel}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
            <p className="text-sm text-primary-foreground/80">
              Une question ? Écris à{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium underline underline-offset-4">
                {CONTACT_EMAIL}
              </a>
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className={cn(CONTAINER, 'flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between')}>
          <p>© {new Date().getFullYear()} RELIA · Le fil conducteur de vos mariages</p>
          <p>Les devis et factures générés sont indicatifs : vérifie tes obligations légales avant émission.</p>
        </div>
        <div className={cn(CONTAINER, 'mt-4')}>
          <LegalLinks />
        </div>
      </footer>
      <CookieNotice />
    </div>
  )
}

interface FeatureRowProps {
  image: string
  imageHeight: number
  alt: string
  icon: React.ReactNode
  label: string
  title: string
  text: string
  bullets: string[]
  reverse?: boolean
}

function FeatureRow({ image, imageHeight, alt, icon, label, title, text, bullets, reverse }: FeatureRowProps) {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
      <div className={cn('flex flex-col items-start gap-4', reverse && 'lg:order-2')}>
        <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
          {icon}
          {label}
        </span>
        <h3 className="text-balance font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h3>
        <p className="leading-relaxed text-muted-foreground">{text}</p>
        <ul className="mt-1 flex flex-col gap-2 text-sm">
          {bullets.map((b) => (
            <PlanFeature key={b}>{b}</PlanFeature>
          ))}
        </ul>
      </div>
      <img
        src={image}
        width={1200}
        height={imageHeight}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={cn('w-full rounded-2xl border border-border bg-background shadow-(--shadow-card)', reverse && 'lg:order-1')}
      />
    </div>
  )
}
