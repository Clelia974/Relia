import { useEffect } from 'react'
import { Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AuthenticatedHeader } from '@/app/layout/AuthenticatedHeader'
import { Button } from '@/components/ui/button'
import { BeforeAfterSection } from '@/features/landing/components/BeforeAfterSection'
import { FaqAccordion } from '@/features/landing/components/FaqAccordion'
import { FeatureCarousel } from '@/features/landing/components/FeatureCarousel'
import { FeatureExtras } from '@/features/landing/components/FeatureExtras'
import { HeroShowcase } from '@/features/landing/components/HeroShowcase'
import { PainPointCards } from '@/features/landing/components/PainPointCards'
import { PricingSection } from '@/features/landing/components/PricingSection'
import { SolutionSection } from '@/features/landing/components/SolutionSection'
import { WeddingTimelinePreview } from '@/features/landing/components/WeddingTimelinePreview'
import { WhoItsForSection } from '@/features/landing/components/WhoItsForSection'
import { CONTACT_EMAIL, TESTIMONIALS } from '@/features/landing/landingContent'
import { CookieNotice } from '@/features/legal/CookieNotice'
import { LegalLinks } from '@/features/legal/LegalLinks'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { useWorkspaceStore } from '@/store/workspaceStore'

const CONTAINER = 'mx-auto w-full max-w-5xl px-5 sm:px-8'
const SECTION = 'scroll-mt-20 py-16 sm:py-24'
const H2 = 'font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl'
const KICKER = 'text-xs font-medium uppercase tracking-[0.14em] text-thread-text'

const HERO_CHECKLIST = ['Moins de stress la veille du mariage', 'Ta marge, visible avant la fin de chaque mariage', 'Plus de temps pour ta créativité']

export function LandingPage() {
  const navigate = useNavigate()
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
  const ctaLabel = !isAuthenticated ? 'Commencer gratuitement' : onboarded ? "Ouvrir l'application" : 'Continuer'
  const start = () => {
    if (!isAuthenticated) navigate('/inscription')
    else navigate(onboarded ? '/aujourdhui' : '/onboarding')
  }
  /** Proposée uniquement tant que l'espace n'a jamais été configuré : charger la démo n'écrase ainsi aucune donnée. */
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

      {/* Un seul en-tête à la fois : AuthenticatedHeader une fois connectée (CTA app + menu compte),
          celui-ci sinon (nav de la page + Se connecter/Commencer) — les deux affichés ensemble
          dupliquaient le bouton d'accès à l'application. */}
      {isAuthenticated ? (
        <AuthenticatedHeader />
      ) : (
        <header className="sticky top-0 z-30 border-b border-border/60 bg-card/95 backdrop-blur">
          <div className={cn(CONTAINER, 'flex h-16 items-center justify-between gap-4')}>
            <a href="#haut" className="flex items-center gap-2" aria-label="RELIA — haut de page">
              <img src="/brand/relia-monogram.svg" alt="" className="size-9" />
              <span className="font-heading text-2xl font-semibold tracking-tight text-primary">Relia</span>
            </a>
            <nav aria-label="Sections de la page" className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
              <a href="#fonctionnalites" className="transition-colors hover:text-foreground">Comment ça marche</a>
              <a href="#tarifs" className="transition-colors hover:text-foreground">Tarifs</a>
              <a href="#questions" className="transition-colors hover:text-foreground">Questions</a>
            </nav>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate('/connexion')}>Se connecter</Button>
              <Button size="sm" onClick={start}>{ctaLabel}</Button>
            </div>
          </div>
        </header>
      )}

      <main id="contenu" className="flex flex-col">
        {/* 1 — HERO */}
        <section id="haut" className="overflow-hidden pb-16 pt-12 sm:pb-24 sm:pt-20">
          <div className={CONTAINER}>
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-8">
              <div className="mx-auto flex max-w-2xl flex-col items-start gap-6 text-left animate-page-in lg:mx-0">
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium uppercase tracking-[0.1em] text-thread-text">
                  <span className="size-1.5 rounded-full bg-thread" aria-hidden="true" />
                  Pour les décoratrices et décorateurs de mariage
                </span>
                <h1 className="text-balance font-heading text-4xl font-semibold leading-[1.05] tracking-tight text-primary sm:text-5xl">
                  Tout orchestré. <span className="italic text-thread-text">Enfin la paix.</span>
                </h1>
                <p className="max-w-xl text-pretty text-lg leading-relaxed text-foreground/80">
                  L’app pensée pour les décoratrices et décorateurs de mariage qui veulent enfin respirer le Jour J, passer
                  moins de temps à s’inquiéter et plus de temps à créer.
                </p>
                <ul className="flex flex-col gap-2.5 text-base">
                  {HERO_CHECKLIST.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-sage/30 text-success">
                        <Check className="size-3.5" aria-hidden="true" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>

                <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
                  <Button size="lg" className="h-12 w-full px-7 text-base sm:w-auto" onClick={start}>
                    {ctaLabel}
                  </Button>
                  {!onboarded && (
                    <Button variant="ghost" size="lg" className="h-12 w-full px-7 text-base sm:w-auto" onClick={openDemo}>
                      Voir une démo
                    </Button>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Compte gratuit en 1 minute · Tes données restent dans ton navigateur · Démo avec des mariages fictifs
                </p>

                <div className="mt-2 w-full">
                  <WeddingTimelinePreview ctaLabel={ctaLabel} onStart={start} />
                </div>
              </div>

              <HeroShowcase />
            </div>
          </div>
        </section>

        {/* 2 — PROBLÈME — bloc couleur */}
        <section id="probleme" className={cn(SECTION, 'bg-card')}>
          <div className={CONTAINER}>
            <div className="max-w-2xl">
              <p className={KICKER}>Le problème</p>
              <h2 className={cn(H2, 'mt-2')}>Tu connais déjà ces situations</h2>
              <p className="mt-3 text-muted-foreground">Ce qui bloque la plupart des décoratrices, et qui n’a rien à voir avec un manque d’organisation naturelle.</p>
            </div>
            <div className="mt-10">
              <PainPointCards />
            </div>
          </div>
        </section>

        {/* 3 — SOLUTION */}
        <section className={SECTION}>
          <div className={CONTAINER}>
            <div className="max-w-2xl">
              <p className={KICKER}>La solution</p>
              <h2 className={cn(H2, 'mt-2')}>Rencontre Relia</h2>
              <p className="mt-3 text-muted-foreground">
                RELIA est née d’une question simple : et si le Jour J n’était pas un chaos organisé, mais tout simplement…
                organisé ? Elle est pensée pour les décoratrices et décorateurs de mariage indépendants.
              </p>
            </div>
            <div className="mt-10">
              <SolutionSection />
            </div>
          </div>
        </section>

        {/* 4 — FONCTIONNALITÉS (carrousel, une grande fenêtre à la fois) — bloc couleur */}
        <section id="fonctionnalites" className={cn(SECTION, 'bg-card')}>
          <div className={CONTAINER}>
            <div className="max-w-2xl">
              <p className={KICKER}>Comment ça marche</p>
              <h2 className={cn(H2, 'mt-2')}>Ce que tu peux faire avec Relia</h2>
              <p className="mt-3 text-muted-foreground">6 fonctionnalités, une fenêtre à la fois.</p>
            </div>
            <div className="mt-10">
              <FeatureCarousel />
            </div>
            <div className="mt-12">
              <FeatureExtras />
            </div>
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

        {/* 6 — AVANT / APRÈS */}
        <section className={SECTION}>
          <div className={CONTAINER}>
            <div className="max-w-2xl">
              <p className={KICKER}>La différence</p>
              <h2 className={cn(H2, 'mt-2')}>Avant Relia. Après Relia.</h2>
            </div>
            <div className="mt-10">
              <BeforeAfterSection />
            </div>
          </div>
        </section>

        {/* 7 — POUR QUI — bloc couleur */}
        <section className={cn(SECTION, 'bg-card')}>
          <div className={CONTAINER}>
            <div className="max-w-2xl">
              <p className={KICKER}>Pour qui</p>
              <h2 className={cn(H2, 'mt-2')}>Relia a été pensé pour les personnes qui ont déjà une base</h2>
            </div>
            <div className="mt-10">
              <WhoItsForSection />
            </div>
          </div>
        </section>

        {/* 8 — TARIFS */}
        <section id="tarifs" className={SECTION}>
          <div className={CONTAINER}>
            <div className="mx-auto max-w-2xl text-center">
              <p className={KICKER}>Tarifs</p>
              <h2 className={cn(H2, 'mt-2')}>Tarifs simples, pas de piège</h2>
            </div>
            <div className="mt-10">
              <PricingSection ctaLabel={ctaLabel} onStart={start} />
            </div>
          </div>
        </section>

        {/* 9 — FAQ — bloc couleur */}
        <section id="questions" className={cn(SECTION, 'bg-card')} aria-labelledby="faq">
          <div className={cn(CONTAINER, 'max-w-3xl')}>
            <p className={KICKER}>Questions fréquentes</p>
            <h2 id="faq" className={cn(H2, 'mt-2')}>Tout ce que tu te demandes avant de commencer</h2>
            <div className="mt-8">
              <FaqAccordion />
            </div>
          </div>
        </section>

        {/* 10 — APPEL FINAL */}
        <section className="bg-primary py-20 text-primary-foreground sm:py-28" aria-labelledby="final">
          <div className={cn(CONTAINER, 'flex flex-col items-center gap-6 text-center')}>
            <h2 id="final" className="text-balance font-heading text-3xl font-semibold tracking-tight sm:text-5xl">
              Prêt·e à respirer le Jour J ?
            </h2>
            <p className="max-w-xl text-lg leading-relaxed text-primary-foreground/85">
              Commence avec ton prochain mariage. Compte gratuit, tes données restent chez toi.
            </p>
            <Button
              size="lg"
              className="h-12 bg-card px-7 text-base text-primary shadow-(--shadow-raised) hover:bg-card hover:shadow-(--shadow-raised)"
              onClick={start}
            >
              {ctaLabel}
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

