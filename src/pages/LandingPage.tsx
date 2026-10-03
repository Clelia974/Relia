import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthenticatedHeader } from '@/app/layout/AuthenticatedHeader'
import { SilkyPlaceWordmark } from '@/components/brand/SilkyPlaceWordmark'
import { Button } from '@/components/ui/button'
import { LandingFooter } from '@/features/landing/components/LandingFooter'
import { HeroShowcase } from '@/features/landing/components/HeroShowcase'
import { PainPointCards } from '@/features/landing/components/PainPointCards'
import { SP_BUTTON } from '@/features/landing/brandColors'
import { CookieNotice } from '@/features/legal/CookieNotice'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { useWorkspaceStore } from '@/store/workspaceStore'

const CONTAINER = 'mx-auto w-full max-w-5xl px-5 sm:px-8'
const SECTION = 'scroll-mt-24 py-20 sm:py-32'
const H2 = 'text-balance font-heading text-4xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-5xl'
const KICKER = 'inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#5F6B4C]'
/** Boutons en pilule, comme le reste de la landing aérienne. */
const PILL = 'rounded-full'

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
  const ctaLabel = !isAuthenticated ? 'Voir comment ça marche en 1 minute' : onboarded ? "Ouvrir l'application" : 'Continuer'
  const start = () => {
    if (!isAuthenticated) navigate('/produit')
    else navigate(onboarded ? '/aujourdhui' : '/onboarding')
  }
  /** Proposée uniquement tant que l'espace n'a jamais été configuré : charger la démo n'écrase ainsi aucune donnée. */
  const openDemo = () => {
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
              <Link to="/produit#tarifs" className="transition-colors hover:text-foreground">Tarifs</Link>
              <Link to="/produit#questions" className="transition-colors hover:text-foreground">Questions</Link>
            </nav>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className={PILL} onClick={() => navigate('/connexion')}>Se connecter</Button>
              <Button size="sm" className={cn(SP_BUTTON, PILL, 'px-4')} onClick={start}>{isAuthenticated ? ctaLabel : 'Comment ça marche'}</Button>
            </div>
          </div>
        </header>
      )}

      <main id="contenu" className="flex flex-col">
        {/* 1 — HERO — court : promesse, une phrase, l'appel à l'action. */}
        <section id="haut" className="relative isolate overflow-hidden pb-24 pt-14 sm:pb-32 sm:pt-24">
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
                  <Button size="lg" className={cn('h-13 w-full px-8 text-base sm:w-auto', SP_BUTTON, PILL, 'shadow-(--shadow-raised)')} onClick={start}>
                    {ctaLabel}
                  </Button>
                  {!onboarded && (
                    <Button variant="ghost" size="lg" className={cn('h-13 w-full px-6 text-base text-muted-foreground sm:w-auto', PILL)} onClick={openDemo}>
                      Voir une démo
                    </Button>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">14 jours gratuits · Sans carte bancaire · Installation en 1 minute</p>
              </div>

              <HeroShowcase />
            </div>
          </div>
        </section>

        {/* 2 — LE PROBLÈME — 4 cartes + la phrase-clé du manifeste. */}
        <section id="probleme" className={cn(SECTION, 'bg-card')}>
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

        {/* 11 — APPEL FINAL */}
        <section className="bg-[#520C0C] py-24 text-[#DDE6EF] sm:py-36" aria-labelledby="final">
          <div className={cn(CONTAINER, 'flex flex-col items-center gap-6 text-center')}>
            <h2 id="final" className="text-balance font-heading text-4xl font-semibold tracking-tight sm:text-6xl">
              Tu as un mariage à organiser ?
            </h2>
            <p className="text-xl text-[#DDE6EF]/85">Commence par celui-là.</p>
            <Button
              size="lg"
              className="mt-4 h-13 rounded-full bg-card px-8 text-base text-[#520C0C] shadow-(--shadow-raised) hover:bg-card hover:shadow-(--shadow-raised)"
              onClick={start}
            >
              {ctaLabel}
            </Button>
            <p className="text-sm text-[#DDE6EF]/80">14 jours gratuits · Sans carte bancaire · Installation en 1 minute</p>
          </div>
        </section>
      </main>

      <LandingFooter />
      <CookieNotice />
    </div>
  )
}
