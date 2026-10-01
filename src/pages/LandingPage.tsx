import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthenticatedHeader } from '@/app/layout/AuthenticatedHeader'
import { SilkyPlaceWordmark } from '@/components/brand/SilkyPlaceWordmark'
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
import { SP_BUTTON } from '@/features/landing/brandColors'
import { CookieNotice } from '@/features/legal/CookieNotice'
import { LegalLinks } from '@/features/legal/LegalLinks'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { useWorkspaceStore } from '@/store/workspaceStore'

const CONTAINER = 'mx-auto w-full max-w-5xl px-5 sm:px-8'
const SECTION = 'scroll-mt-20 py-16 sm:py-24'
const H2 = 'font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl'
const KICKER = 'text-xs font-medium uppercase tracking-[0.14em] text-[#5F6B4C]'

/** Copywriting complet fourni par Clélia (2026-09-29) — repris texte pour texte, à l'endroit indiqué dans son message. */
const DAY_TIMELINE = [
  { time: '8h00', text: 'Tu regardes tes messages avant même ton café.' },
  { time: '11h00', text: 'Une cliente demande où en est son devis.' },
  { time: '14h30', text: 'Tu cherches le numéro d’un prestataire dans tes mails.' },
  { time: '18h00', text: 'Tu voudrais t’arrêter. Mais tu penses à ce qu’il reste à faire.' },
  { time: '21h00', text: 'Tu reprends ton téléphone. « Juste pour vérifier. » Et demain, il faudra recommencer.' },
]

const TIME_RECOVERED = [
  { title: 'Ta créativité', lines: ['Créer.', 'Chercher une idée.', 'Tester une nouvelle ambiance.', 'Avoir à nouveau envie de créer.'] },
  { title: 'Ta famille', lines: ['Être vraiment présente.', 'Sans une tâche qui tourne dans un coin de ta tête.'] },
  { title: 'Ton couple', lines: ['Dîner sans : « Attends, je réponds juste à ça. »'] },
  { title: 'Toi', lines: ['Sortir.', 'Lire.', 'Dormir.', 'Faire du sport.', 'Ou ne rien faire.'] },
]

const WHAT_SILKYPLACE_DOES_NOT = [
  'remplir ton carnet de commandes à ta place.',
  'remplacer ton savoir-faire.',
  'remplacer ta créativité.',
  'gérer tes mariages à ta place.',
  'te promettre un nombre d’heures gagnées chaque semaine.',
  'rendre les imprévus impossibles.',
]

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
  const ctaLabel = !isAuthenticated ? 'Créer mon espace gratuitement' : onboarded ? "Ouvrir l'application" : 'Continuer'
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
    <div className="min-h-dvh bg-[#F7EFE6] text-foreground">
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-[#520C0C] focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-[#F7EFE6]"
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
            <a href="#haut" aria-label="SilkyPlace — haut de page">
              <SilkyPlaceWordmark className="font-heading text-2xl font-semibold tracking-tight" />
            </a>
            <nav aria-label="Sections de la page" className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
              <a href="#fonctionnalites" className="transition-colors hover:text-foreground">Comment ça marche</a>
              <a href="#tarifs" className="transition-colors hover:text-foreground">Tarifs</a>
              <a href="#questions" className="transition-colors hover:text-foreground">Questions</a>
            </nav>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate('/connexion')}>Se connecter</Button>
              <Button size="sm" className={SP_BUTTON} onClick={start}>{ctaLabel}</Button>
            </div>
          </div>
        </header>
      )}

      <main id="contenu" className="flex flex-col">
        {/* 1 — HERO */}
        <section id="haut" className="overflow-hidden pb-16 pt-12 sm:pb-24 sm:pt-20">
          <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-8">
              <div className="mx-auto flex max-w-2xl flex-col items-start gap-6 text-left animate-page-in lg:mx-0">
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium uppercase tracking-[0.1em] text-[#5F6B4C]">
                  <span className="size-1.5 rounded-full bg-[#A9B08F]" aria-hidden="true" />
                  Pour les décoratrices et décorateurs de mariage
                </span>
                <h1 className="text-balance font-heading text-5xl font-semibold leading-[1.03] tracking-tight text-[#520C0C] sm:text-6xl">
                  Ton travail a une place. Ta vie aussi. <span className="italic text-[#5F6B4C]">Enfin de l’air.</span>
                </h1>
                <div className="flex flex-col gap-3">
                  <p className="max-w-xl text-pretty text-lg font-medium leading-relaxed text-foreground">
                    SilkyPlace rassemble tout ce qu’il faut pour gérer tes mariages au même endroit.
                  </p>
                  <p className="max-w-xl text-pretty text-base font-medium leading-relaxed text-[#5F6B4C]">
                    Moins de choses à chercher. Moins de choses à retenir. Plus de place pour créer.
                  </p>
                  <p className="max-w-xl text-pretty leading-relaxed text-foreground/80">
                    Tâches, budget, matériel, prestataires, devis et déroulé du Jour J : tout est réuni dans un seul espace.
                  </p>
                </div>

                <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
                  <Button size="lg" className={cn('h-12 w-full px-7 text-base sm:w-auto', SP_BUTTON)} onClick={start}>
                    {ctaLabel}
                  </Button>
                  {!onboarded && (
                    <Button variant="ghost" size="lg" className="h-12 w-full px-7 text-base sm:w-auto" onClick={openDemo}>
                      Voir une démo
                    </Button>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground/80">14 jours gratuits avec toutes les fonctionnalités Solo. Sans carte bancaire.</p>
                  <p className="mt-1">Installation en 1 minute · Tes données restent sous ton contrôle · Tu peux commencer avec un mariage fictif</p>
                </div>

                <div className="mt-2 w-full">
                  <WeddingTimelinePreview ctaLabel={ctaLabel} onStart={start} />
                </div>
              </div>

              <HeroShowcase />
            </div>
          </div>
        </section>

        {/* 2 — MANIFESTE — bloc couleur (fusion de "Tout ton mariage au même endroit" + "Ton travail a une place" : même sujet, une seule section) */}
        <section className={cn(SECTION, 'bg-card')}>
          <div className={cn(CONTAINER, 'max-w-2xl text-center')}>
            <h2 className={H2}>Ton travail a une place. Ta vie aussi.</h2>
            <p className="mt-4 text-base leading-relaxed text-foreground/80">
              Un mariage, ce n’est pas qu’un joli décor : l’installation, le démontage, le mobilier, les arches, le
              nappage, l’inventaire, le retour matériel, les prestataires déco, les devis — et des dizaines de
              petites informations à retrouver au bon moment.
            </p>
            <p className="mt-3 text-base leading-relaxed text-foreground/80">
              Tu peux aimer créer, imaginer un décor, voir une salle prendre vie — et pourtant ne pas avoir envie de
              répondre à des messages à 22h30. Être à ton compte ne devrait pas vouloir dire être disponible tout le
              temps.
            </p>
            <p className="mt-3 font-heading text-xl font-semibold text-[#520C0C]">
              Le problème, ce n’est pas que tu ne sais pas t’organiser : c’est que les informations dont tu as besoin
              sont souvent éparpillées, et c’est ta tête qui fait le lien.
            </p>
          </div>
        </section>

        {/* 3 — PROBLÈME */}
        <section id="probleme" className={SECTION}>
          <div className={CONTAINER}>
            <div className="max-w-2xl">
              <p className={KICKER}>Le problème</p>
              <h2 className={cn(H2, 'mt-2')}>Tu connais déjà ces moments</h2>
            </div>
            <div className="mt-10">
              <PainPointCards />
            </div>
          </div>
        </section>

        {/* 4 — LA JOURNÉE QUI DÉBORDE */}
        <section className={SECTION}>
          <div className={CONTAINER}>
            <div className="max-w-2xl">
              <h2 className={H2}>À quel moment ta journée finit vraiment ?</h2>
            </div>
            <ol className="mt-10 flex flex-col divide-y divide-border border-y border-border">
              {DAY_TIMELINE.map((item) => (
                <li key={item.time} className="flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:gap-6">
                  <span className="shrink-0 font-heading text-sm font-semibold text-[#520C0C] sm:w-16">{item.time}</span>
                  <span className="text-foreground/80">{item.text}</span>
                </li>
              ))}
            </ol>
            <p className="mt-8 max-w-2xl font-heading text-lg font-semibold text-[#520C0C]">
              SilkyPlace ne réduit pas le nombre de mariages que tu as à gérer. Il réduit ce que tu dois garder en tête pour les gérer.
            </p>
          </div>
        </section>

        {/* 5 — SOLUTION — bloc couleur */}
        <section className={cn(SECTION, 'bg-card')}>
          <div className={CONTAINER}>
            <div className="max-w-2xl">
              <p className={KICKER}>La solution</p>
              <h2 className={cn(H2, 'mt-2')}>SilkyPlace, c’est quoi ?</h2>
              <p className="mt-3 text-muted-foreground">
                Un espace pensé pour les décoratrices et décorateurs de mariage indépendants. Installation, décoration
                cérémonie, réception, démontage, inventaire, retour matériel, prestataires déco : un seul endroit
                pour piloter chaque mariage :
              </p>
            </div>
            <div className="mt-10">
              <SolutionSection />
            </div>
          </div>
        </section>

        {/* 6 — FONCTIONNALITÉS (carrousel, une grande fenêtre à la fois) */}
        <section id="fonctionnalites" className={SECTION}>
          <div className={CONTAINER}>
            <div className="max-w-2xl">
              <p className={KICKER}>Les fonctionnalités</p>
              <h2 className={cn(H2, 'mt-2')}>Chaque fonctionnalité part d’un problème réel</h2>
            </div>
            <div className="mt-10">
              <FeatureCarousel />
            </div>
            <div className="mt-12">
              <FeatureExtras />
            </div>
          </div>
        </section>

        {/* 7 — TÉMOIGNAGES (affichés uniquement s'il y en a de vrais) — bloc couleur */}
        {TESTIMONIALS.length > 0 && (
          <section className={cn(SECTION, 'bg-card')} aria-labelledby="temoignages">
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

        {/* 8 — LE TEMPS RÉCUPÉRÉ */}
        <section className={SECTION}>
          <div className={CONTAINER}>
            <div className="max-w-2xl">
              <h2 className={H2}>Et le temps que tu récupères, tu en fais quoi ?</h2>
              <p className="mt-3 text-muted-foreground">SilkyPlace ne veut pas remplir ce temps à ta place. Il veut te permettre de choisir.</p>
            </div>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {TIME_RECOVERED.map((item) => (
                <div key={item.title} className="rounded-xl border border-border bg-card p-6">
                  <p className="text-sm font-semibold text-[#5F6B4C]">{item.title}</p>
                  <ul className="mt-2 flex flex-col gap-1 text-sm leading-relaxed text-foreground">
                    {item.lines.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="mt-8 max-w-2xl font-heading text-lg font-semibold text-[#520C0C]">
              Le temps que tu récupères n’a pas besoin d’être productif.
            </p>
          </div>
        </section>

        {/* 9 — AVANT / AVEC SilkyPlace — bloc couleur */}
        <section className={cn(SECTION, 'bg-card')}>
          <div className={CONTAINER}>
            <div className="max-w-2xl">
              <p className={KICKER}>La différence</p>
              <h2 className={cn(H2, 'mt-2')}>Avant SilkyPlace. Avec SilkyPlace.</h2>
            </div>
            <div className="mt-10">
              <BeforeAfterSection />
            </div>
            <blockquote className="mt-10 max-w-2xl text-balance font-heading text-2xl font-semibold leading-snug text-[#520C0C] sm:text-3xl">
              SilkyPlace ne réduit pas le nombre de mariages à gérer — il réduit ce que tu dois garder en tête pour les gérer.
            </blockquote>
          </div>
        </section>

        {/* 10 — CE QUE SilkyPlace NE PROMET PAS */}
        <section className={SECTION}>
          <div className={cn(CONTAINER, 'max-w-2xl')}>
            <h2 className={H2}>On ne va pas te raconter que SilkyPlace va régler toute ton activité.</h2>
            <p className="mt-4 text-muted-foreground">SilkyPlace ne va pas :</p>
            <ul className="mt-3 flex flex-col gap-2 text-foreground/80">
              {WHAT_SILKYPLACE_DOES_NOT.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span aria-hidden="true">❌</span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-6 font-heading text-lg font-semibold text-[#520C0C]">Ce n’est pas son rôle.</p>
            <p className="mt-2 text-muted-foreground">
              SilkyPlace s’occupe de ce qui arrive après la demande : comment tout suivre sans tout garder dans ta tête.
            </p>
          </div>
        </section>

        {/* 11 — POUR QUI */}
        <section className={SECTION}>
          <div className={CONTAINER}>
            <div className="max-w-2xl">
              <p className={KICKER}>Pour qui</p>
              <h2 className={cn(H2, 'mt-2')}>SilkyPlace est fait pour toi si…</h2>
            </div>
            <div className="mt-10">
              <WhoItsForSection />
            </div>
          </div>
        </section>

        {/* 12 — TARIFS — bloc couleur (fusion de "Commencer est simple" + "Tarifs" : l'explication de l'essai mène directement aux cartes, pas besoin de deux sections) */}
        <section id="tarifs" className={cn(SECTION, 'bg-card')}>
          <div className={CONTAINER}>
            <div className="mx-auto max-w-2xl text-center">
              <p className={KICKER}>Tarifs</p>
              <h2 className={cn(H2, 'mt-2')}>14 jours pour essayer SilkyPlace</h2>
              <p className="mt-4 text-muted-foreground">
                Sans carte bancaire. Teste avec ton prochain mariage ou un mariage fictif. À la fin de l’essai : reste
                gratuite jusqu’à 3 mariages, ou passe à Solo pour les mariages illimités.
              </p>
            </div>
            <div className="mt-10">
              <PricingSection ctaLabel={ctaLabel} onStart={start} />
            </div>
          </div>
        </section>

        {/* 13 — FAQ */}
        <section id="questions" className={SECTION} aria-labelledby="faq">
          <div className={cn(CONTAINER, 'max-w-3xl')}>
            <p className={KICKER}>Les questions que tu te poses probablement</p>
            <h2 id="faq" className={cn(H2, 'mt-2')}>Tout ce que tu te demandes avant de commencer</h2>
            <div className="mt-8">
              <FaqAccordion />
            </div>
          </div>
        </section>

        {/* 14 — APPEL FINAL */}
        <section className="bg-[#520C0C] py-20 text-[#F7EFE6] sm:py-28" aria-labelledby="final">
          <div className={cn(CONTAINER, 'flex flex-col items-center gap-6 text-center')}>
            <div className="flex flex-col gap-1">
              <h2 id="final" className="text-balance font-heading text-3xl font-semibold tracking-tight sm:text-5xl">
                Tu as un mariage à organiser ?
              </h2>
              <p className="mt-2 text-lg text-[#F7EFE6]/85">Commence par celui-là.</p>
            </div>
            <p className="max-w-xl text-lg font-medium leading-relaxed text-[#F7EFE6]">
              Pas besoin de tout changer, tout importer ou tout comprendre avant de commencer. Crée ton espace,
              ajoute ton mariage, et regarde si SilkyPlace peut te faire respirer un peu plus.
            </p>
            <p className="text-balance font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              Ton travail a une place. Ta vie aussi.
            </p>
            <Button
              size="lg"
              className="h-12 bg-card px-7 text-base text-[#520C0C] shadow-(--shadow-raised) hover:bg-card hover:shadow-(--shadow-raised)"
              onClick={start}
            >
              {ctaLabel}
            </Button>
            <p className="text-sm text-[#F7EFE6]/80">14 jours de fonctionnalités Solo · Sans carte bancaire · 1 minute</p>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className={cn(CONTAINER, 'flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between')}>
          <p>
            Une question ? Écris à{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-foreground underline underline-offset-4">
              {CONTACT_EMAIL}
            </a>
          </p>
          <p>© {new Date().getFullYear()} SilkyPlace · Événements Clés</p>
        </div>
        <div className={cn(CONTAINER, 'mt-2 text-sm text-muted-foreground')}>
          <p>SilkyPlace — L’organisation pensée pour les décoratrices et décorateurs de mariage indépendants.</p>
          <p className="mt-1">Les devis et factures générés sont indicatifs : vérifie tes obligations légales avant émission.</p>
        </div>
        <div className={cn(CONTAINER, 'mt-4')}>
          <LegalLinks />
        </div>
      </footer>
      <CookieNotice />
    </div>
  )
}
