import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthenticatedHeader } from '@/app/layout/AuthenticatedHeader'
import { SilkyPlaceWordmark } from '@/components/brand/SilkyPlaceWordmark'
import { Button } from '@/components/ui/button'
import { DayTimeline } from '@/features/landing/components/DayTimeline'
import { FaqAccordion } from '@/features/landing/components/FaqAccordion'
import { FeatureShowcase } from '@/features/landing/components/FeatureShowcase'
import { PricingSection } from '@/features/landing/components/PricingSection'
import { WeddingTimelinePreview } from '@/features/landing/components/WeddingTimelinePreview'
import { LandingFooter } from '@/features/landing/components/LandingFooter'
import { HeroShowcase } from '@/features/landing/components/HeroShowcase'
import { PainPointCards } from '@/features/landing/components/PainPointCards'
import { SP_BUTTON } from '@/features/landing/brandColors'
import { TESTIMONIALS, TRIAL_DAYS } from '@/features/landing/landingContent'
import { CookieNotice } from '@/features/legal/CookieNotice'
import { useAuth } from '@/hooks/useAuth'
import { track } from '@/lib/analytics'
import { useSectionViews } from '@/lib/useAnalytics'
import { cn } from '@/lib/utils'
import { useWorkspaceStore } from '@/store/workspaceStore'

const CONTAINER = 'mx-auto w-full max-w-5xl px-5 sm:px-8'
const SECTION = 'scroll-mt-24 py-20 sm:py-32'
const H2 = 'text-balance font-heading text-4xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-5xl'
const KICKER = 'inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#5F6B4C]'
/** Boutons en pilule, comme le reste de la landing aérienne. */
const PILL = 'rounded-full'

/** « Ta journée avec SilkyPlace » — les mêmes heures que la frise du problème, vues après : ce que la décoratrice gagne, au fil de la journée. */
const DAY_WITH_SILKYPLACE = [
  { time: '8h00', text: 'Tu ouvres SilkyPlace : ce qui est confirmé, ce qui reste à faire, ce qui doit être payé. Tout est là.' },
  { time: '11h00', text: 'Une cliente demande où en est son devis : tu le retrouves tout de suite, sans fouiller tes mails.' },
  { time: '14h30', text: 'Il te faut le numéro d’un prestataire ? Il est dans la fiche du mariage, avec son horaire.' },
  { time: '18h00', text: 'Tu fermes ton ordi. Tu sais exactement par quoi commencer demain.' },
  { time: '21h00', text: 'Tu dînes sans « juste vérifier ». Ton déroulé, ton plan de table et ta marge sont déjà rangés.' },
]

const STEPS = [
  { title: 'Crée ton espace', text: 'Installation en 1 minute, sans carte bancaire.' },
  { title: 'Ajoute ton mariage', text: 'Ou importe ceux que tu as déjà dans ton fichier Excel.' },
  { title: 'Profite de ta soirée', text: 'Demain matin, tu sais exactement par quoi commencer.' },
]

/** Lien « embed » de la démo de 60-90 s (YouTube non répertorié, Vimeo ou Loom). Vide tant que la vidéo n'existe pas : la section est alors masquée. */
const DEMO_VIDEO_URL = ''


export function LandingPage() {
  const navigate = useNavigate()
  useSectionViews()
  const { isAuthenticated } = useAuth()
  const resetWorkspace = useWorkspaceStore((s) => s.resetWorkspace)
  const onboarded = useWorkspaceStore((s) => s.workspace.userProfile.onboarded)

  useEffect(() => {
    const root = document.documentElement
    const wasDark = root.classList.contains('dark')
    root.classList.remove('dark')
    return () => {
      if (wasDark) root.classList.add('dark')
    }
  }, [])

  /** Compte requis pour tout le reste de l'app (cf. ProtectedRoute sur AppLayout/onboarding) : la landing doit d'abord faire créer un compte avant de proposer onboarding/app. */
  const ctaLabel = !isAuthenticated ? 'Commencer mon premier mariage' : onboarded ? "Ouvrir l'application" : 'Continuer'
  /** `where` : l'endroit de la page d'où part le clic (hero, header, étapes, tarifs, final) — pour savoir quel bouton convertit. */
  const start = (where: string) => {
    if (!isAuthenticated) {
      track('CTA Click', { location: where })
      navigate('/inscription')
    } else navigate(onboarded ? '/aujourdhui' : '/onboarding')
  }
  /** Proposée uniquement tant que l'espace n'a jamais été configuré : charger la démo n'écrase ainsi aucune donnée. */
  const openDemo = () => {
    track('Demo Click')
    resetWorkspace('demo')
    navigate(isAuthenticated ? '/aujourdhui' : '/inscription')
  }

  return (
    <div className="landing-airy min-h-dvh bg-background text-foreground">
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-[#520C0C] focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-[#DDE6EF]"
      >
        Aller au contenu
      </a>

      {/* Un seul en-tête à la fois : AuthenticatedHeader une fois connectée (CTA app + menu compte),
          celui-ci sinon (nav de la page + Se connecter/Commencer) — les deux affichés ensemble
          dupliquaient le bouton d'accès à l'application. */}
      {isAuthenticated ? (
        <AuthenticatedHeader />
      ) : (
        <header className="sticky top-0 z-30 border-b border-border/70 bg-card/80 backdrop-blur-md">
          <div className={cn(CONTAINER, 'flex h-20 items-center justify-between gap-4')}>
            <a href="#haut" aria-label="SilkyPlace — haut de page">
              <SilkyPlaceWordmark className="text-[26px] sm:text-[32px]" />
            </a>
            <nav aria-label="Sections de la page" className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
              <a href="#fonctionnalites" className="transition-colors hover:text-foreground">Comment ça marche</a>
              <a href="#tarifs" className="transition-colors hover:text-foreground">Tarifs</a>
              <a href="#questions" className="transition-colors hover:text-foreground">Questions</a>
            </nav>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className={PILL} onClick={() => navigate('/connexion')}>Se connecter</Button>
              <Button size="sm" className={cn(SP_BUTTON, PILL, 'px-4')} onClick={() => start('header')}>{ctaLabel}</Button>
            </div>
          </div>
        </header>
      )}

      <main id="contenu" className="landing-halos flex flex-col">
        {/* 1 — HERO — court : promesse, une phrase, l'appel à l'action. */}
        <section data-section="hero" id="haut" className="relative isolate overflow-hidden pb-24 pt-14 sm:pb-32 sm:pt-24">
          {/* Halos très doux (bleu pâle de marque + une pointe de bordeaux) — donnent la profondeur « aérienne » sans aplat de couleur. */}
          <div aria-hidden="true" className="pointer-events-none absolute -left-40 -top-40 -z-10 size-[42rem] rounded-full bg-[#F6D9C4] opacity-60 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -right-40 -top-20 -z-10 size-[36rem] rounded-full bg-[#DDE6EF] opacity-70 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute bottom-0 left-1/3 -z-10 size-[28rem] rounded-full bg-[#E9E4CF] opacity-60 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -right-32 top-24 -z-10 size-[30rem] rounded-full bg-[#520C0C] opacity-[0.05] blur-3xl" />
          <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-8">
              <div className="mx-auto flex max-w-2xl flex-col items-start gap-8 text-left animate-page-in lg:mx-0">
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3.5 py-1.5 text-xs font-medium uppercase tracking-[0.12em] text-[#5F6B4C] shadow-(--shadow-card)">
                  <span className="size-1.5 rounded-full bg-[#A9B08F]" aria-hidden="true" />
                  Pour les décoratrices et décorateurs de mariage
                </span>
                <h1 className="text-balance font-heading text-5xl font-semibold leading-[1.02] tracking-tight text-[#520C0C] sm:text-7xl">
                  Tu sais où tu en es, sur chaque mariage. <span className="mt-3 block text-[0.72em] italic leading-[1.08] text-[#5F6B4C]">Ferme ton ordi sans arrière-pensée.</span>
                </h1>
                <div className="max-w-xl space-y-3 text-pretty text-lg leading-relaxed text-foreground/80">
                  <p>
                    <strong className="font-semibold text-foreground">Tu n’as pas besoin</strong> d’un logiciel compliqué, d’une formation, de tout
                    ressaisir, ni de passer tes soirées dessus.
                  </p>
                  <p>
                    <strong className="font-semibold text-foreground">Tu as juste besoin</strong> d’un endroit qui te montre ce qui est confirmé, ce qui
                    reste à faire, ce qui doit être payé, et où tu en es sur chaque mariage.
                  </p>
                  <p>Tu peux même importer tes mariages depuis Excel.</p>
                </div>
                <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
                  <Button size="lg" className={cn('h-13 w-full px-8 text-base sm:w-auto', SP_BUTTON, PILL, 'shadow-(--shadow-raised)')} onClick={() => start('hero')}>
                    {ctaLabel}
                  </Button>
                  {!onboarded && (
                    <Button variant="ghost" size="lg" className={cn('h-13 w-full px-6 text-base text-muted-foreground sm:w-auto', PILL)} onClick={openDemo}>
                      Voir une démo
                    </Button>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{TRIAL_DAYS} jours gratuits · Sans carte bancaire · Installation en 1 minute</p>
              </div>

              <HeroShowcase />
            </div>
          </div>
        </section>

        {/* 2 — LE PROBLÈME — 4 cartes + la phrase-clé du manifeste. */}
        <section data-section="probleme" id="probleme" className={cn(SECTION, 'bg-card/50')}>
          <div className={CONTAINER}>
            <div className="mx-auto max-w-2xl text-center">
              <p className={KICKER}>Le problème</p>
              <h2 className={cn(H2, 'mt-3')}>Tu connais déjà ces moments</h2>
            </div>
            <div className="mt-14">
              <PainPointCards />
            </div>
            <p className="mx-auto mt-14 max-w-2xl text-balance text-center font-heading text-2xl font-semibold leading-snug text-[#520C0C]">
              Le problème, ce n’est pas que tu ne sais pas t’organiser : c’est que les informations sont éparpillées,
              et c’est ta tête qui fait le lien.
            </p>
          </div>
        </section>

        {/* LA SOLUTION — ta journée avec SilkyPlace : ce que tu gagnes, au fil des heures. */}
        <section data-section="solution" className={SECTION}>
          <div className={CONTAINER}>
            <div className="mx-auto max-w-2xl text-center">
              <p className={KICKER}>Ce que tu gagnes</p>
              <h2 className={H2}>Ta journée avec SilkyPlace</h2>
            </div>
            <p className="mt-4 text-center text-muted-foreground">Clique sur une heure.</p>
            <div className="mt-12">
              <DayTimeline
                moments={DAY_WITH_SILKYPLACE}
                conclusion="Rien à installer, rien à paramétrer. Tu peux même importer tes mariages depuis Excel : tu avances pas à pas, sans tout garder en tête."
              />
            </div>
          </div>
        </section>

        {DEMO_VIDEO_URL && (
          <section data-section="demo" className={SECTION} aria-labelledby="demo">
            <div className={cn(CONTAINER, 'max-w-4xl text-center')}>
              <h2 id="demo" className={H2}>SilkyPlace en 90 secondes</h2>
              <div className="mt-10 aspect-video overflow-hidden rounded-2xl border border-border shadow-(--shadow-raised)">
                <iframe
                  src={DEMO_VIDEO_URL}
                  title="Démo de SilkyPlace"
                  className="size-full"
                  allow="accelerometer; encrypted-media; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            </div>
          </section>
        )}

        {/* LES FONCTIONNALITÉS — la vraie capture de chaque écran, dans un portable. */}
        <section data-section="fonctionnalites" id="fonctionnalites" className={SECTION}>
          <div className={CONTAINER}>
            <div className="mx-auto max-w-2xl text-center">
              <p className={KICKER}>Tout au même endroit</p>
              <h2 className={cn(H2, 'mt-3')}>Chaque fonctionnalité part d’un problème réel</h2>
              <p className="mt-5 text-lg text-muted-foreground">Choisis un écran pour le voir tel qu’il est dans SilkyPlace.</p>
            </div>
            <div className="mt-14">
              <FeatureShowcase />
            </div>
          </div>
        </section>

        {/* EN 3 ÉTAPES + essai sans compte. */}
        <section data-section="etapes" className={cn(SECTION, 'bg-card/50')}>
          <div className={CONTAINER}>
            <div className="grid grid-cols-1 items-start gap-14 lg:grid-cols-2">
              <div>
                <p className={KICKER}>Simple</p>
                <h2 className={cn(H2, 'mt-3')}>Commence en trois étapes</h2>
                <ol className="mt-10 flex flex-col gap-8">
                  {STEPS.map((step, i) => (
                    <li key={step.title} className="flex gap-5">
                      <span className="font-heading text-3xl font-semibold leading-none text-[#520C0C]/30">{String(i + 1).padStart(2, '0')}</span>
                      <div>
                        <p className="font-heading text-lg font-semibold text-foreground">{step.title}</p>
                        <p className="mt-1 text-muted-foreground">{step.text}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
              <WeddingTimelinePreview ctaLabel={ctaLabel} onStart={() => start('etapes')} />
            </div>
          </div>
        </section>

        {/* PREUVE SOCIALE — uniquement de vrais avis, jamais inventés : la section n'existe pas tant qu'il n'y en a pas. */}
        {TESTIMONIALS.length > 0 && (
          <section data-section="temoignages" className={SECTION} aria-labelledby="temoignages">
            <div className={CONTAINER}>
              <h2 id="temoignages" className={H2}>Ce que disent les décoratrices et décorateurs</h2>
              <ul className="mt-12 grid gap-6 md:grid-cols-3">
                {TESTIMONIALS.map((t) => (
                  <li key={t.author} className="rounded-2xl border border-border bg-card p-7 shadow-(--shadow-card)">
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

        {/* TARIFS — phrase de prix, un seul bouton, risque réduit. */}
        <section data-section="tarifs" id="tarifs" className={cn(SECTION, 'bg-card/50')}>
          <div className={CONTAINER}>
            <div className="mx-auto max-w-2xl text-center">
              <p className={KICKER}>Tarifs</p>
              <h2 className={cn(H2, 'mt-3')}>1 mois pour essayer SilkyPlace</h2>
              <p className="mt-5 text-lg text-muted-foreground">
                Moins d’un euro par jour, pour ne plus rien garder en tête.
              </p>
            </div>
            <div className="mt-14">
              <PricingSection ctaLabel={ctaLabel} onStart={() => start('tarifs')} />
            </div>
            <ul className="mx-auto mt-10 flex max-w-2xl flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <li>{TRIAL_DAYS} jours gratuits pour tout essayer</li>
              <li>Aucune carte bancaire demandée</li>
              <li>Tu importes tes mariages depuis Excel</li>
              <li>Gratuite jusqu’à 3 mariages si tu ne continues pas</li>
            </ul>
          </div>
        </section>

        <section data-section="faq" id="questions" className={SECTION} aria-labelledby="faq">
          <div className={cn(CONTAINER, 'max-w-3xl')}>
            <div className="text-center">
              <p className={KICKER}>Questions</p>
              <h2 id="faq" className={cn(H2, 'mt-3')}>Tout ce que tu te demandes avant de commencer</h2>
            </div>
            <div className="mt-12">
              <FaqAccordion />
            </div>
          </div>
        </section>

        {/* 11 — APPEL FINAL */}
        <section data-section="appel-final" className="bg-[#520C0C] py-24 text-[#DDE6EF] sm:py-36" aria-labelledby="final">
          <div className={cn(CONTAINER, 'flex flex-col items-center gap-6 text-center')}>
            <h2 id="final" className="text-balance font-heading text-4xl font-semibold tracking-tight sm:text-6xl">
              Tu as un mariage à organiser ?
            </h2>
            <p className="text-xl text-[#DDE6EF]/85">Commence par celui-là.</p>
            <Button
              size="lg"
              className="mt-4 h-13 rounded-full bg-card px-8 text-base text-[#520C0C] shadow-(--shadow-raised) hover:bg-card hover:shadow-(--shadow-raised)"
              onClick={() => start('final')}
            >
              {ctaLabel}
            </Button>
            <p className="text-sm text-[#DDE6EF]/80">{TRIAL_DAYS} jours gratuits · Sans carte bancaire · Installation en 1 minute</p>
          </div>
        </section>
      </main>

      <LandingFooter />
      <CookieNotice />
    </div>
  )
}
