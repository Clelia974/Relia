import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Check, Pin } from 'lucide-react'
import { AuthenticatedHeader } from '@/app/layout/AuthenticatedHeader'
import { SilkyPlaceWordmark } from '@/components/brand/SilkyPlaceWordmark'
import { Button } from '@/components/ui/button'
import { FaqAccordion } from '@/features/landing/components/FaqAccordion'
import { FeatureCardsGrid } from '@/features/landing/components/FeatureCardsGrid'
import { LandingFooter } from '@/features/landing/components/LandingFooter'
import { PricingSection } from '@/features/landing/components/PricingSection'
import { SP_BUTTON } from '@/features/landing/brandColors'
import { CookieNotice } from '@/features/legal/CookieNotice'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { useWorkspaceStore } from '@/store/workspaceStore'

const CONTAINER = 'mx-auto w-full max-w-5xl px-5 sm:px-8'
const SECTION = 'scroll-mt-24 py-20 sm:py-28'
const H2 = 'text-balance font-heading text-4xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-5xl'
const KICKER = 'inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#5F6B4C]'
const PILL = 'rounded-full'

/** Cinq résultats concrets — ce que la décoratrice vit après, pas les fonctionnalités. */
const QUICK_BENEFITS = [
  'Tu vois en un coup d’œil ce qui est confirmé, ce qui reste à faire et ce qui doit être payé.',
  'Ton déroulé du Jour J, minute par minute.',
  'Matériel, prestataires et plan de salle au même endroit.',
  'Tes devis et factures, sans tout ressaisir.',
  'Ta marge sur chaque mariage, enfin claire.',
]

/** « Dans SilkyPlace, tu as » — bénéfices, pas seulement fonctionnalités. */
const WHATS_INSIDE = [
  'Un planning par mariage : tu sais qui arrive, et à quelle heure.',
  'Une liste de matériel : tu vérifies une fois, pas trois.',
  'Tes prestataires : qui a confirmé, qui doit encore répondre.',
  'Un plan de salle et de table, prêt sans refaire la veille.',
  'Un moodboard : palette, matières et ambiance à envoyer aux mariés.',
  'Tes finances et ton bilan : ta marge, mariage par mariage.',
]

const FINAL_CTA = 'Commencer mon premier mariage'

export function ProductPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const onboarded = useWorkspaceStore((s) => s.workspace.userProfile.onboarded)

  useEffect(() => {
    const root = document.documentElement
    const wasDark = root.classList.contains('dark')
    root.classList.remove('dark')
    window.scrollTo(0, 0)
    return () => {
      if (wasDark) root.classList.add('dark')
    }
  }, [])

  const ctaLabel = !isAuthenticated ? FINAL_CTA : onboarded ? "Ouvrir l'application" : 'Continuer'
  const start = () => {
    if (!isAuthenticated) navigate('/inscription')
    else navigate(onboarded ? '/aujourdhui' : '/onboarding')
  }

  return (
    <div className="landing-airy min-h-dvh bg-background text-foreground">
      {isAuthenticated ? (
        <AuthenticatedHeader />
      ) : (
        <header className="sticky top-0 z-30 border-b border-border/70 bg-card/80 backdrop-blur-md">
          <div className={cn(CONTAINER, 'flex h-20 items-center justify-between gap-4')}>
            <Link to="/" aria-label="SilkyPlace — accueil">
              <SilkyPlaceWordmark className="text-[26px] sm:text-[32px]" />
            </Link>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className={PILL} onClick={() => navigate('/connexion')}>Se connecter</Button>
              <Button size="sm" className={cn(SP_BUTTON, PILL, 'px-4')} onClick={start}>{ctaLabel}</Button>
            </div>
          </div>
        </header>
      )}

      <main id="contenu" className="flex flex-col">
        {/* POUR QUI — un paragraphe émotionnel : valide, enlève la honte, nomme la frustration. */}
        <section className={SECTION}>
          <div className={cn(CONTAINER, 'max-w-3xl text-center')}>
            <p className={KICKER}>Pour qui</p>
            <h1 className={cn(H2, 'mt-3')}>Pour les décoratrices de mariage qui jonglent avec tout</h1>
            <p className="mt-8 text-pretty text-lg leading-relaxed text-foreground/80 sm:text-xl">
              WhatsApp, mails, Excel, post-it, et le reste dans ta tête. Ce n’est pas que tu t’organises mal : c’est que
              tout est éparpillé, et c’est toi qui fais le lien, à chaque fois. Tu n’as pas à en avoir honte. SilkyPlace
              remet tout au même endroit, pour que tu puisses enfin souffler.
            </p>
          </div>
        </section>

        {/* BÉNÉFICES RAPIDES + CE QU'IL Y A DEDANS — deux colonnes, comme le schéma. */}
        <section className={cn(SECTION, 'bg-card')}>
          <div className={cn(CONTAINER, 'grid grid-cols-1 gap-12 lg:grid-cols-2')}>
            <div>
              <h2 className="font-heading text-3xl font-semibold tracking-tight text-[#520C0C]">Ce que tu gagnes</h2>
              <ul className="mt-8 flex flex-col gap-4">
                {QUICK_BENEFITS.map((b) => (
                  <li key={b} className="flex items-start gap-3 text-lg leading-snug text-foreground/90">
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#A9B08F]/30 text-[#5F6B4C]">
                      <Check className="size-4" aria-hidden="true" />
                    </span>
                    {b}
                  </li>
                ))}
              </ul>
              <p className="mt-8 rounded-2xl bg-secondary px-5 py-4 text-base leading-relaxed text-foreground/80">
                Rien à installer, rien à paramétrer. Tu peux même importer tes mariages depuis Excel.
              </p>
            </div>
            <div>
              <h2 className="font-heading text-3xl font-semibold tracking-tight text-[#520C0C]">Dans SilkyPlace, tu as :</h2>
              <ul className="mt-8 flex flex-col gap-4">
                {WHATS_INSIDE.map((w) => (
                  <li key={w} className="flex items-start gap-3 text-lg leading-snug text-foreground/90">
                    <Pin className="mt-1 size-5 shrink-0 text-[#520C0C]/70" aria-hidden="true" />
                    {w}
                  </li>
                ))}
              </ul>
              <p className="mt-8 text-base font-medium text-[#520C0C]">
                Tout est simple et pas à pas : tu crées ton espace, tu ajoutes un mariage, tu avances.
              </p>
            </div>
          </div>
        </section>

        {/* LES ÉCRANS — cartes cliquables existantes. */}
        <section id="fonctionnalites" className={SECTION}>
          <div className={CONTAINER}>
            <div className="mx-auto max-w-2xl text-center">
              <p className={KICKER}>Tout au même endroit</p>
              <h2 className={cn(H2, 'mt-3')}>Chaque fonctionnalité part d’un problème réel</h2>
              <p className="mt-5 text-lg text-muted-foreground">Clique sur une carte pour voir l’écran.</p>
            </div>
            <div className="mt-14">
              <FeatureCardsGrid />
            </div>
          </div>
        </section>

        {/* TARIFS — phrase de prix, un seul bouton, risque réduit. */}
        <section id="tarifs" className={cn(SECTION, 'bg-card')}>
          <div className={CONTAINER}>
            <div className="mx-auto max-w-2xl text-center">
              <p className={KICKER}>Tarifs</p>
              <h2 className={cn(H2, 'mt-3')}>14 jours pour essayer SilkyPlace</h2>
              <p className="mt-5 text-lg text-muted-foreground">
                Moins d’un euro par jour, pour ne plus rien garder en tête.
              </p>
            </div>
            <div className="mt-14">
              <PricingSection ctaLabel={ctaLabel} onStart={start} />
            </div>
            <ul className="mx-auto mt-10 flex max-w-2xl flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <li>14 jours gratuits pour tout essayer</li>
              <li>Aucune carte bancaire demandée</li>
              <li>Tu importes tes mariages depuis Excel</li>
              <li>Gratuite jusqu’à 3 mariages si tu ne continues pas</li>
            </ul>
          </div>
        </section>

        <section id="questions" className={SECTION} aria-labelledby="faq">
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

        <section className="bg-[#520C0C] py-24 text-[#DDE6EF] sm:py-32" aria-labelledby="final">
          <div className={cn(CONTAINER, 'flex flex-col items-center gap-6 text-center')}>
            <h2 id="final" className="text-balance font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
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
