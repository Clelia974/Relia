import { Check } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { CONTACT_EMAIL } from '@/features/landing/landingContent'
import { BeforeAfterSection } from '@/features/landing/test/BeforeAfterSection'
import { FaqAccordion } from '@/features/landing/test/FaqAccordion'
import { FeatureCarousel } from '@/features/landing/test/FeatureCarousel'
import { FeatureExtras } from '@/features/landing/test/FeatureExtras'
import { HeroShowcase } from '@/features/landing/test/HeroShowcase'
import { PainPointCards } from '@/features/landing/test/PainPointCards'
import { PricingTestSection } from '@/features/landing/test/PricingTestSection'
import { SolutionSection } from '@/features/landing/test/SolutionSection'
import { WeddingTimelinePreview } from '@/features/landing/test/WeddingTimelinePreview'
import { WhoItsForSection } from '@/features/landing/test/WhoItsForSection'
import { cn } from '@/lib/utils'

const CONTAINER = 'mx-auto w-full max-w-5xl px-5 sm:px-8'
/** Même rythme vertical que LandingPage.tsx (SECTION) : le bloc couleur (bg-card) vient de cn(SECTION, 'bg-card'). */
const SECTION = 'scroll-mt-20 py-16 sm:py-24'
const H2 = 'font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl'
const KICKER = 'text-xs font-medium uppercase tracking-[0.14em] text-thread-text'

/** Repris tel quel de LandingPage.tsx (hero) — la checklist qui suit le sous-titre. */
const HERO_CHECKLIST = [
  'Moins de stress la veille du mariage',
  'Ta marge, visible avant la fin de chaque mariage',
  'Plus de temps pour ta créativité',
]

/**
 * Page de test isolée, complète de bout en bout — jamais liée depuis la
 * navigation, ne remplace pas LandingPage.tsx. Reprend la STRUCTURE et le
 * ton de gbcrea.com (badge → headline → widget interactif → problème →
 * carrousel de fenêtres → avant/après → qualification → tarifs → FAQ →
 * CTA final), avec uniquement du contenu déjà vrai chez Relia — aucun
 * chiffre d'usage, aucun témoignage inventé.
 * Fusion avec LandingPage.tsx (la vraie landing garde son texte fort :
 * titre, checklist hero, section Solution, grille complète des
 * fonctionnalités, CTA final, alternance de blocs couleur par section) —
 * LandingPage.tsx n'est pas modifiée.
 * Supprimable directement : ce fichier + src/features/landing/test/ + la
 * ligne de route "/landing-test" dans router.tsx.
 */
export function LandingPageTest() {
  const navigate = useNavigate()

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="border-b border-dashed border-warning/50 bg-warning-bg">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-5 py-2.5 text-sm sm:px-8">
          <p className="font-medium text-warning">Page de test — /landing-test, non liée à la production</p>
          <Link to="/" className="text-warning underline underline-offset-2">
            Retour à la vraie landing
          </Link>
        </div>
      </div>

      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className={CONTAINER + ' flex h-16 items-center justify-between gap-4'}>
          <Link to="/landing-test" className="flex items-center gap-2" aria-label="Relia">
            <img src="/brand/relia-monogram.svg" alt="" className="size-9" />
            <span className="font-heading text-2xl font-semibold tracking-tight text-primary">Relia</span>
          </Link>
          <nav aria-label="Sections de la page" className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a href="#probleme" className="transition-colors hover:text-foreground">Le problème</a>
            <a href="#fonctionnalites" className="transition-colors hover:text-foreground">Fonctionnalités</a>
            <a href="#tarifs" className="transition-colors hover:text-foreground">Tarifs</a>
            <a href="#questions" className="transition-colors hover:text-foreground">Questions</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/connexion')}>Se connecter</Button>
            <Button size="sm" onClick={() => navigate('/inscription')}>Commencer</Button>
          </div>
        </div>
      </header>

      <main className="flex flex-col">
        {/* 1 — HERO (pas de bloc couleur, comme LandingPage.tsx) */}
        <section className="overflow-hidden pb-16 pt-12 sm:pb-24 sm:pt-20">
          <div className={CONTAINER}>
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-8">
              <div className="mx-auto flex max-w-2xl flex-col items-start gap-6 text-left lg:mx-0">
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

                <div className="mt-4 w-full">
                  <WeddingTimelinePreview />
                </div>
                <p className="text-sm text-muted-foreground">Compte gratuit en 1 minute · Tes données restent dans ton navigateur</p>
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
              <h2 className={H2 + ' mt-2'}>Tu connais déjà ces situations</h2>
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
              <h2 className={H2 + ' mt-2'}>Rencontre Relia</h2>
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
              <h2 className={H2 + ' mt-2'}>Ce que tu peux faire avec Relia</h2>
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

        {/* 5 — AVANT / APRÈS */}
        <section className={SECTION}>
          <div className={CONTAINER}>
            <div className="max-w-2xl">
              <p className={KICKER}>La différence</p>
              <h2 className={H2 + ' mt-2'}>Avant Relia. Après Relia.</h2>
            </div>
            <div className="mt-10">
              <BeforeAfterSection />
            </div>
          </div>
        </section>

        {/* 6 — POUR QUI — bloc couleur */}
        <section className={cn(SECTION, 'bg-card')}>
          <div className={CONTAINER}>
            <div className="max-w-2xl">
              <p className={KICKER}>Pour qui</p>
              <h2 className={H2 + ' mt-2'}>Relia a été pensé pour les personnes qui ont déjà une base</h2>
            </div>
            <div className="mt-10">
              <WhoItsForSection />
            </div>
          </div>
        </section>

        {/* 7 — TARIFS */}
        <section id="tarifs" className={SECTION}>
          <div className={CONTAINER}>
            <div className="mx-auto max-w-2xl text-center">
              <p className={KICKER}>Tarifs</p>
              <h2 className={H2 + ' mt-2'}>Choisis ton forfait. Publie mieux, pas plus de mariages que tu ne peux en gérer.</h2>
            </div>
            <div className="mt-10">
              <PricingTestSection />
            </div>
          </div>
        </section>

        {/* 8 — FAQ — bloc couleur */}
        <section id="questions" className={cn(SECTION, 'bg-card')}>
          <div className={cn(CONTAINER, 'max-w-3xl')}>
            <p className={KICKER}>Questions fréquentes</p>
            <h2 className={H2 + ' mt-2'}>Tout ce que tu te demandes avant de commencer</h2>
            <div className="mt-8">
              <FaqAccordion />
            </div>
          </div>
        </section>

        {/* 9 — CTA FINAL — toute la section en bordeaux, comme LandingPage.tsx */}
        <section className="bg-primary py-20 text-primary-foreground sm:py-28">
          <div className={CONTAINER + ' flex flex-col items-center gap-5 text-center'}>
            <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Prêt·e à respirer le Jour J ?</h2>
            <p className="max-w-xl text-lg leading-relaxed text-primary-foreground/85">Commence avec ton prochain mariage. Compte gratuit, tes données restent chez toi.</p>
            <Button
              size="lg"
              className="h-12 bg-card px-7 text-base text-primary shadow-(--shadow-raised) hover:bg-card hover:shadow-(--shadow-raised)"
              onClick={() => navigate('/inscription')}
            >
              Commencer gratuitement
            </Button>
            <p className="text-sm text-primary-foreground/80">
              Une question ?{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium underline underline-offset-4">
                {CONTACT_EMAIL}
              </a>
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-10">
        <div className={CONTAINER + ' flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground'}>
          <span>© Relia</span>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link to="/confidentialite" className="hover:text-foreground">Confidentialité</Link>
            <Link to="/conditions" className="hover:text-foreground">Conditions</Link>
            <Link to="/cookies" className="hover:text-foreground">Cookies</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
