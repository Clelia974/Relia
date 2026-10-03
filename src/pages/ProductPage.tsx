import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Check, Pin } from 'lucide-react'
import { AuthenticatedHeader } from '@/app/layout/AuthenticatedHeader'
import { SilkyPlaceWordmark } from '@/components/brand/SilkyPlaceWordmark'
import { Button } from '@/components/ui/button'
import { BeforeAfterSection } from '@/features/landing/components/BeforeAfterSection'
import { DayTimeline } from '@/features/landing/components/DayTimeline'
import { FaqAccordion } from '@/features/landing/components/FaqAccordion'
import { FeatureCardsGrid } from '@/features/landing/components/FeatureCardsGrid'
import { HeroShowcase } from '@/features/landing/components/HeroShowcase'
import { LandingFooter } from '@/features/landing/components/LandingFooter'
import { PricingSection } from '@/features/landing/components/PricingSection'
import { WeddingTimelinePreview } from '@/features/landing/components/WeddingTimelinePreview'
import { WhoItsForSection } from '@/features/landing/components/WhoItsForSection'
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

const DAY_TIMELINE = [
  { time: '8h00', text: 'Tu regardes tes messages avant même ton café.' },
  { time: '11h00', text: 'Une cliente demande où en est son devis.' },
  { time: '14h30', text: 'Tu cherches le numéro d’un prestataire dans tes mails.' },
  { time: '18h00', text: 'Tu voudrais t’arrêter. Mais tu penses à ce qu’il reste à faire.' },
  { time: '21h00', text: 'Tu reprends ton téléphone. « Juste pour vérifier. » Et demain, il faudra recommencer.' },
]

/** 3 étapes ; la 3e (« Profite de ta soirée ») choisie par Clélia le 2026-10-01 — remplace « Respire », qui sonnait traduit de l'anglais. */
const STEPS = [
  { title: 'Crée ton espace', text: 'Installation en 1 minute, sans carte bancaire.' },
  { title: 'Ajoute ton mariage', text: 'Ou importe ceux que tu as déjà dans ton fichier Excel.' },
  { title: 'Profite de ta soirée', text: 'Demain matin, tu sais exactement par quoi commencer.' },
]

const TIME_RECOVERED = [
  { title: 'Ta créativité', lines: ['Créer.', 'Chercher une idée.', 'Tester une nouvelle ambiance.', 'Avoir à nouveau envie de créer.'] },
  { title: 'Ta famille', lines: ['Être vraiment présente.', 'Sans une tâche qui tourne dans un coin de ta tête.'] },
  { title: 'Ton couple', lines: ['Dîner sans : « Attends, je réponds juste à ça. »'] },
  { title: 'Toi', lines: ['Sortir.', 'Lire.', 'Dormir.', 'Faire du sport.', 'Ou ne rien faire.'] },
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
        {/* POUR QUI — un paragraphe émotionnel + le produit en vrai, sur le dégradé beige. */}
        <section className="relative isolate overflow-hidden py-16 sm:py-24">
          <div aria-hidden="true" className="pointer-events-none absolute -left-40 -top-40 -z-10 size-[42rem] rounded-full bg-[#F6D9C4] opacity-60 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -right-40 -top-20 -z-10 size-[36rem] rounded-full bg-[#DDE6EF] opacity-70 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute bottom-0 left-1/3 -z-10 size-[28rem] rounded-full bg-[#E9E4CF] opacity-60 blur-3xl" />
          <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-12 px-5 sm:px-8 lg:grid-cols-[1fr_1.15fr] lg:gap-8">
            <div className="mx-auto max-w-2xl text-left lg:mx-0">
              <p className={KICKER}>Pour qui</p>
              <h1 className={cn(H2, 'mt-3')}>Pour les décoratrices de mariage qui jonglent avec tout</h1>
              <p className="mt-8 text-pretty text-lg leading-relaxed text-foreground/80">
                WhatsApp, mails, Excel, post-it, et le reste dans ta tête. Ce n’est pas que tu t’organises mal : c’est que
                tout est éparpillé, et c’est toi qui fais le lien, à chaque fois. Tu n’as pas à en avoir honte. SilkyPlace
                remet tout au même endroit, pour que tu puisses enfin souffler.
              </p>
            </div>
            <HeroShowcase />
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

        {/* LA JOURNÉE QUI DÉBORDE — frise interactive. */}
        <section className={SECTION}>
          <div className={CONTAINER}>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className={H2}>À quel moment ta journée finit vraiment ?</h2>
            </div>
            <p className="mt-4 text-center text-muted-foreground">Clique sur une heure.</p>
            <div className="mt-12">
              <DayTimeline
                moments={DAY_TIMELINE}
                conclusion="SilkyPlace ne réduit pas le nombre de mariages que tu as à gérer. Il réduit ce que tu dois garder en tête pour les gérer."
              />
            </div>
          </div>
        </section>

        {/* LES ÉCRANS — cartes cliquables existantes. */}
        <section id="fonctionnalites" className={cn(SECTION, 'bg-card')}>
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

        {/* EN 3 ÉTAPES + essai sans compte. */}
        <section className={cn(SECTION, 'bg-card')}>
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
              <WeddingTimelinePreview ctaLabel={ctaLabel} onStart={start} />
            </div>
          </div>
        </section>

        <section className={SECTION}>
          <div className={CONTAINER}>
            <div className="mx-auto max-w-2xl text-center">
              <p className={KICKER}>La différence</p>
              <h2 className={cn(H2, 'mt-3')}>Avant SilkyPlace. Avec SilkyPlace.</h2>
            </div>
            <div className="mt-14">
              <BeforeAfterSection />
            </div>
          </div>
        </section>

        <section className={cn(SECTION, 'bg-card')}>
          <div className={CONTAINER}>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className={H2}>Et le temps que tu récupères, tu en fais quoi ?</h2>
              <p className="mt-5 text-lg text-muted-foreground">Le temps que tu récupères n’a pas besoin d’être productif.</p>
            </div>
            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {TIME_RECOVERED.map((item) => (
                <div key={item.title} className="rounded-2xl border border-border bg-card p-7 shadow-(--shadow-card)">
                  <p className="font-heading text-lg font-semibold text-[#520C0C]">{item.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.lines.join(' ')}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={SECTION}>
          <div className={CONTAINER}>
            <div className="mx-auto max-w-2xl text-center">
              <p className={KICKER}>Pour qui</p>
              <h2 className={cn(H2, 'mt-3')}>SilkyPlace est fait pour toi si…</h2>
            </div>
            <div className="mt-14">
              <WhoItsForSection ctaLabel={ctaLabel} onStart={start} />
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
