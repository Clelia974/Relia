import { useEffect } from 'react'
import {
  Brain,
  Camera,
  ChevronDown,
  Eye,
  Heart,
  ListChecks,
  Mail,
  MessageCircle,
  Moon,
  Phone,
  Power,
  Repeat,
  Sparkles,
  StickyNote,
  Users,
} from 'lucide-react'
import { CookieNotice } from '@/features/legal/CookieNotice'
import { LegalLinks } from '@/features/legal/LegalLinks'
import { JorduHowItWorks } from '@/features/jordu-landing/JorduHowItWorks'
import { JorduTimeCalculator } from '@/features/jordu-landing/JorduTimeCalculator'
import { JorduWaitlistForm } from '@/features/jordu-landing/JorduWaitlistForm'
import { cn } from '@/lib/utils'

// Couleurs de marque Jordu, écrites en dur ci-dessous à chaque usage (#DDE6EF fond,
// #680808 primaire, #A9B08F accent, #5F6B4C = accent assombri pour le texte) — volontairement
// distinctes des tokens --primary/--thread de l'app existante, laissés intacts ailleurs
// dans le produit tant que le rebrand complet n'est pas décidé.
const CONTAINER = 'mx-auto w-full max-w-4xl px-5 sm:px-8'
const SECTION = 'scroll-mt-20 py-14 sm:py-20'
// Note : classes Tailwind écrites en toutes lettres (jamais interpolées via les constantes
// ci-dessus) — le scanner de Tailwind lit le texte source tel quel, une valeur injectée par
// template literal ne serait pas détectée et la règle CSS ne serait jamais générée.
const H2 = 'font-heading text-2xl font-semibold tracking-tight text-[#680808] sm:text-3xl'
const KICKER = 'text-xs font-medium uppercase tracking-[0.14em] text-[#5F6B4C]'
const CARD_KICKER = 'flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-[#5F6B4C]'
const CONTACT_EMAIL = 'contact@evenementscles.com'

const HEAD_THOUGHTS = [
  { source: 'Instagram', icon: Camera, thought: '« Elle m’avait demandé quoi déjà ? »' },
  { source: 'WhatsApp', icon: MessageCircle, thought: '« Il faut que je lui réponde. »' },
  { source: 'Email', icon: Mail, thought: '« J’avais envoyé le devis ou pas ? »' },
  { source: 'Téléphone', icon: Phone, thought: '« Il faut que je rappelle cette cliente. »' },
  { source: 'Notes', icon: StickyNote, thought: '« J’avais noté ça quelque part… »' },
  { source: 'Ta tête', icon: Brain, thought: '« Ne rien oublier. »' },
]

const DAY_TIMELINE = [
  { time: '8h00', text: 'Je regarde juste mes messages.' },
  { time: '10h30', text: 'Tu dois retrouver une information pour préparer un devis.' },
  { time: '12h15', text: 'Une cliente t’écrit pendant que tu déjeunes.' },
  { time: '15h00', text: 'Tu te rappelles qu’il fallait relancer quelqu’un.' },
  { time: '18h00', text: 'Tu pourrais arrêter. Mais tu penses : « Je vais juste vérifier mes DM. »' },
  { time: '19h30', text: 'Tu réponds à deux messages.' },
  { time: '21h00', text: 'Tu recherches une information que tu avais vue quelque part.' },
]

const TIME_RECOVERED = [
  { icon: Users, title: 'Ta famille', text: 'Être vraiment là, sans téléphone à côté de toi.' },
  { icon: Sparkles, title: 'Ta créativité', text: 'Créer, chercher une idée, en avoir de nouveau envie.' },
  { icon: Heart, title: 'Ton couple', text: 'Dîner sans « attends, je réponds vite ».' },
  { icon: Moon, title: 'Toi', text: 'Sortir, lire, dormir, ne rien faire.' },
]

const BEFORE_AFTER = [
  { before: '« Elle m’avait écrit où déjà ? »', after: '« Je sais où regarder. »' },
  { before: '« Je dois penser à la relancer. »', after: '« Je vois ce qui est en attente. »' },
  { before: '« Je vais vérifier mes DM ce soir. »', after: '« Je sais ce qui peut attendre demain. »' },
  { before: '« J’ai tout dans ma tête. »', after: '« J’ai une vue d’ensemble. »' },
  { before: '« Mon téléphone me suit partout. »', after: '« Je peux le poser. »' },
  { before: '« Je continue après le dîner. »', after: '« Je sais où reprendre demain. »' },
]

const WHAT_JORDU_DOES_NOT = [
  'faire venir des clientes à ta place ;',
  'remplacer ton Instagram ;',
  'remplacer ton savoir-faire ;',
  'gérer tes événements à ta place ;',
  'te promettre X heures gagnées par semaine.',
]

const FOR_YOU = [
  'Tu es décoratrice événementielle.',
  'Tu reçois tes demandes sur plusieurs canaux.',
  'Tu dois régulièrement rechercher des informations.',
  'Tu as parfois des demandes ou des devis qui restent en attente.',
  'Tu veux arrêter de tout garder dans ta tête.',
  'Tu aimerais pouvoir fermer ton ordinateur sans continuer à travailler mentalement.',
  'Tu veux développer ton activité sans qu’elle prenne toute la place dans ta vie.',
]

const NOT_FOR_YOU = [
  'Tu reçois très peu de demandes et ton organisation actuelle te convient parfaitement.',
  'Tu n’as pas envie de changer ta façon de suivre tes demandes.',
  'Tu cherches avant tout un outil pour obtenir plus de clientes.',
]

const FAQ: { q: string; a: string }[] = [
  {
    q: 'Jordu est-il déjà disponible ?',
    a: 'Pas encore, c’est en construction. En t’inscrivant, tu seras informée des prochaines étapes et de l’ouverture des premiers tests.',
  },
  {
    q: 'Est-ce que Jordu va m’apporter plus de clientes ?',
    a: 'Non. Jordu ne remplace pas ton marketing — il s’intéresse à la gestion des demandes que tu reçois déjà.',
  },
  {
    q: 'Est-ce uniquement pour les mariages ?',
    a: 'Non, pour toute décoratrice événementielle : mariage, baptême, anniversaire, entreprise…',
  },
  {
    q: 'Est-ce que je devrai abandonner WhatsApp ou Instagram ?',
    a: 'Non. L’idée est de t’aider à gérer les demandes qui arrivent de différents endroits, pas de choisir un seul canal.',
  },
  {
    q: 'Quand pourrai-je tester Jordu ?',
    a: 'Les premières personnes inscrites seront informées dès l’ouverture des premiers tests.',
  },
]

/**
 * Landing "bis" — /jordu : uniquement une collecte d'emails en attendant que
 * le MVP Jordu soit prêt, distincte de la vraie landing "lancement" (RootGate /).
 * Jamais liée à un compte, jamais d'auth — juste api/waitlist.ts.
 */
export function JorduLandingPage() {
  useEffect(() => {
    const root = document.documentElement
    const wasDark = root.classList.contains('dark')
    root.classList.remove('dark')
    return () => {
      if (wasDark) root.classList.add('dark')
    }
  }, [])

  const scrollToInscription = () => {
    document.getElementById('inscription')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <div className="min-h-dvh bg-[#DDE6EF] text-foreground">
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-[#680808] focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-[#DDE6EF]"
      >
        Aller au contenu
      </a>

      {/* 1 — HEADER */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-card/95 backdrop-blur">
        <div className={cn(CONTAINER, 'flex h-16 items-center justify-between gap-4')}>
          <a href="#haut" aria-label="Jordu — haut de page">
            <img src="/brand/jordu-wordmark.svg" alt="Jordu — haut de page" width={76} height={32} className="h-8 w-auto" />
          </a>
          <nav aria-label="Sections de la page" className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a href="#probleme" className="transition-colors hover:text-foreground">Le problème</a>
            <a href="#comment-ca-marche" className="transition-colors hover:text-foreground">Comment ça marche</a>
            <a href="#pourquoi-jordu" className="transition-colors hover:text-foreground">Pourquoi Jordu</a>
            <a href="#faq" className="transition-colors hover:text-foreground">FAQ</a>
          </nav>
          <button
            type="button"
            onClick={scrollToInscription}
            className="rounded-lg bg-[#680808] px-4 py-2 text-sm font-medium text-[#DDE6EF] transition-colors hover:bg-[#680808]/90"
          >
            Je veux rejoindre Jordu
          </button>
        </div>
      </header>

      <main id="contenu" className="flex flex-col">
        {/* 2 — HERO */}
        <section id="haut" className="overflow-hidden pb-14 pt-14 sm:pb-20 sm:pt-20">
          <div className={cn(CONTAINER, 'flex flex-col items-center gap-6 text-center animate-page-in')}>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium uppercase tracking-[0.1em] text-[#5F6B4C]">
              <span className="size-1.5 rounded-full bg-[#A9B08F]" aria-hidden="true" />
              Jordu — en construction
            </span>
            <h1 className="text-balance font-heading text-4xl font-semibold leading-[1.1] tracking-tight text-[#680808] sm:text-5xl">
              Et si tu pouvais vraiment fermer ton ordinateur à 18h ?
            </h1>
            <p className="max-w-2xl text-pretty text-lg leading-relaxed text-foreground/80">
              Tu as créé ton activité pour décorer, créer, imaginer — pas pour répondre à WhatsApp à 21h ou chercher
              un devis pendant que ta famille t’attend. Jordu t’aide à mieux gérer tes demandes, pour que ton travail
              reprenne sa place.
            </p>

            <div className="mt-2 w-full max-w-md">
              <p className="mb-3 text-sm font-medium text-foreground">Je veux rejoindre Jordu →</p>
              <JorduWaitlistForm id="inscription" submitLabel="Je veux rejoindre Jordu" />
            </div>
            <p className="text-sm text-muted-foreground">
              Jordu est encore en construction. Rejoins les premières décoratrices qui veulent suivre l’aventure.
            </p>
          </div>
        </section>

        {/* 3 — MANIFESTE */}
        <section className={cn(SECTION, 'bg-card')}>
          <div className={cn(CONTAINER, 'max-w-2xl text-center')}>
            <h2 className={H2}>Ton travail a une place. Ta vie aussi.</h2>
            <p className="mt-4 text-base leading-relaxed text-foreground/80">
              Tu peux aimer créer, imaginer, voir un événement prendre vie — et ne pas avoir envie de répondre à des
              messages tous les soirs. Être à son compte, ce n’est pas être disponible tout le temps.
            </p>
          </div>
        </section>

        {/* 4 — LE PROBLÈME */}
        <section id="probleme" className={SECTION}>
          <div className={CONTAINER}>
            <div className="max-w-2xl">
              <p className={KICKER}>Le problème</p>
              <h2 className={cn(H2, 'mt-2')}>Tes demandes peuvent être partout</h2>
              <p className="mt-3 text-muted-foreground">
                Pas forcément trop de travail — plutôt des demandes éparpillées partout, et ta tête qui essaie de se
                souvenir de tout.
              </p>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {HEAD_THOUGHTS.map((item) => (
                <div key={item.source} className="rounded-xl border border-border bg-card p-5">
                  <p className={CARD_KICKER}>
                    <item.icon className="size-3.5 shrink-0" aria-hidden="true" />
                    {item.source}
                  </p>
                  <p className="mt-2 text-foreground">{item.thought}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5 — LA JOURNÉE QUI DÉBORDE */}
        <section className={cn(SECTION, 'bg-card')}>
          <div className={CONTAINER}>
            <div className="max-w-2xl">
              <h2 className={H2}>À quel moment ta journée finit vraiment ?</h2>
            </div>
            <ol className="mt-10 flex flex-col divide-y divide-border border-y border-border">
              {DAY_TIMELINE.map((item) => (
                <li key={item.time} className="flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:gap-6">
                  <span className="shrink-0 font-heading text-sm font-semibold text-[#680808] sm:w-16">{item.time}</span>
                  <span className="text-foreground/80">{item.text}</span>
                </li>
              ))}
            </ol>
            <p className="mt-8 max-w-2xl text-muted-foreground">
              Et demain, il faudra se souvenir de tout ce qui reste. Est-ce que ton travail sait vraiment s’arrêter ?
            </p>
          </div>
        </section>

        {/* 6 — LA VIE QUE TU VEUX RETROUVER */}
        <section className={SECTION}>
          <div className={cn(CONTAINER, 'max-w-2xl text-center')}>
            <h2 className={H2}>Imagine.</h2>
            <div className="mt-6 flex flex-col gap-3 text-lg leading-relaxed text-foreground/80">
              <p>
                18h05, tu poses ton téléphone. Tu sais ce qui est traité, en attente, ce que tu retrouveras demain —
                alors tu arrêtes, sans peur d’avoir oublié quelque chose.
              </p>
              <p className="font-medium text-foreground">Et le dimanche… tu ne regardes pas tes demandes.</p>
            </div>
          </div>
        </section>

        {/* 7 — LE TEMPS RÉCUPÉRÉ */}
        <section className={cn(SECTION, 'bg-card')}>
          <div className={CONTAINER}>
            <div className="max-w-2xl">
              <h2 className={H2}>Et le temps que tu récupères, tu en fais quoi ?</h2>
            </div>
            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {TIME_RECOVERED.map((item) => (
                <div key={item.title} className="rounded-xl border border-border bg-background p-6">
                  <p className={CARD_KICKER}>
                    <item.icon className="size-3.5 shrink-0" aria-hidden="true" />
                    {item.title}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-foreground">{item.text}</p>
                </div>
              ))}
            </div>
            <p className="mt-8 max-w-2xl text-muted-foreground">
              Jordu ne veut pas remplir ce temps. Il veut te permettre de choisir ce que tu en fais.
            </p>
          </div>
        </section>

        {/* 9 — JORDU, C'EST QUOI ? */}
        <section id="comment-ca-marche" className={cn(SECTION, 'bg-card')}>
          <div className={CONTAINER}>
            <div className="max-w-2xl">
              <p className={KICKER}>Comment ça marche</p>
              <h2 className={cn(H2, 'mt-2')}>Jordu, c’est quoi ?</h2>
              <p className="mt-3 text-muted-foreground">Une idée simple : une demande devrait avoir un endroit où aller.</p>
            </div>
            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {[
                { icon: Eye, title: 'Voir', text: 'Toutes tes demandes au même endroit.' },
                { icon: ListChecks, title: 'Savoir', text: 'Ce qui est à traiter, en attente, confirmé.' },
                { icon: Repeat, title: 'Suivre', text: 'Qui relancer, sans compter sur ta mémoire.' },
                { icon: Power, title: 'Décrocher', text: 'Fermer l’ordinateur en sachant où tu en es.' },
              ].map((item) => (
                <div key={item.title} className="rounded-xl border border-border bg-background p-6">
                  <p className={CARD_KICKER}>
                    <item.icon className="size-3.5 shrink-0" aria-hidden="true" />
                    {item.title}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-foreground">{item.text}</p>
                </div>
              ))}
            </div>
            <p className="mt-8 max-w-2xl text-muted-foreground">
              Pas une usine à gaz. Une organisation pensée pour la réalité d’une décoratrice événementielle.
            </p>
          </div>
        </section>

        {/* 10 — AVANT / APRÈS */}
        <section className={SECTION}>
          <div className={CONTAINER}>
            <div className="max-w-2xl">
              <p className={KICKER}>La différence</p>
              <h2 className={cn(H2, 'mt-2')}>Pas pour travailler plus vite. Pour avoir moins de choses à retenir.</h2>
            </div>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 sm:items-start">
              <div className="rounded-2xl border border-border bg-card p-6">
                <p className="text-sm font-semibold text-muted-foreground">Aujourd’hui</p>
                <ul className="mt-4 flex flex-col divide-y divide-border">
                  {BEFORE_AFTER.map((row) => (
                    <li key={row.before} className="py-2.5 text-sm text-muted-foreground first:pt-0 last:pb-0">
                      {row.before}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-[#680808]/30 bg-[#680808]/5 p-6">
                <p className="text-sm font-semibold text-[#680808]">Avec une organisation claire</p>
                <ul className="mt-4 flex flex-col divide-y divide-[#680808]/15">
                  {BEFORE_AFTER.map((row) => (
                    <li key={row.after} className="py-2.5 text-sm text-foreground first:pt-0 last:pb-0">
                      {row.after}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 11 — PETIT CALCULATEUR */}
        <section className={cn(SECTION, 'bg-card')}>
          <div className={cn(CONTAINER, 'max-w-2xl')}>
            <div className="text-center">
              <p className={KICKER}>Petit calculateur</p>
              <h2 className={cn(H2, 'mt-2')}>Et tout ce temps passé à gérer tes demandes ?</h2>
              <p className="mt-3 text-muted-foreground">
                Pendant les grosses périodes, quelques minutes par demande peuvent rapidement s’accumuler.
              </p>
            </div>
            <div className="mt-10">
              <JorduTimeCalculator />
            </div>
          </div>
        </section>

        {/* 12 — CE QUE JORDU NE PROMET PAS */}
        <section className={SECTION}>
          <div className={cn(CONTAINER, 'max-w-2xl')}>
            <h2 className={H2}>On ne va pas te raconter que Jordu va régler toute ton activité.</h2>
            <p className="mt-4 text-muted-foreground">Jordu ne va pas :</p>
            <ul className="mt-3 flex flex-col gap-2 text-foreground/80">
              {WHAT_JORDU_DOES_NOT.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-muted-foreground" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-muted-foreground">
              Ce n’est pas son rôle. Jordu s’intéresse à ce qui arrive après — comment suivre tes demandes sans tout
              garder dans ta tête.
            </p>
          </div>
        </section>

        {/* 13 — CONSTRUCTION */}
        <section className={cn(SECTION, 'bg-card')}>
          <div className={cn(CONTAINER, 'max-w-2xl text-center')}>
            <h2 className={H2}>Jordu est encore en construction.</h2>
            <p className="mt-3 font-heading text-lg text-foreground">On teste. On réfléchit. On construit. On écoute. On recommence.</p>
            <p className="mt-4 text-muted-foreground">
              Le but : quelque chose que les décoratrices auront réellement envie d’utiliser.
            </p>
          </div>
        </section>

        {/* 14 — POUR QUI ? */}
        <section className={SECTION}>
          <div className={CONTAINER}>
            <div className="max-w-2xl">
              <p className={KICKER}>Pour qui</p>
              <h2 className={cn(H2, 'mt-2')}>Jordu est pour toi si…</h2>
            </div>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 sm:items-start">
              <div className="rounded-2xl border border-success/30 bg-success/5 p-6">
                <p className="text-sm font-semibold text-success">Jordu est pour toi si…</p>
                <ul className="mt-4 flex flex-col gap-2.5">
                  {FOR_YOU.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-foreground/80">
                      <span className="mt-0.5 text-success">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-border bg-card p-6">
                <p className="text-sm font-semibold text-muted-foreground">Jordu n’est probablement pas pour toi si…</p>
                <ul className="mt-4 flex flex-col gap-2.5">
                  {NOT_FOR_YOU.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-muted-foreground">
                      <span className="mt-0.5">×</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <p className="mt-8 max-w-2xl text-muted-foreground">
              Jordu ne cherche pas à remplir ton agenda. Il cherche à t’aider à mieux vivre avec celui que tu as.
            </p>
          </div>
        </section>

        {/* 15 — COMMENT ÇA POURRAIT FONCTIONNER */}
        <section className={cn(SECTION, 'bg-card')}>
          <div className={CONTAINER}>
            <div className="max-w-2xl">
              <h2 className={H2}>Une demande arrive.</h2>
              <p className="mt-3 text-muted-foreground">Clique sur une étape pour la voir en action.</p>
            </div>
            <div className="mt-8">
              <JorduHowItWorks />
            </div>
          </div>
        </section>

        {/* 16 — POURQUOI JORDU ? (portrait) */}
        <section id="pourquoi-jordu" className={SECTION}>
          <div className={cn(CONTAINER, 'max-w-2xl')}>
            <p className={KICKER}>Pourquoi Jordu</p>
            <h2 className={cn(H2, 'mt-2')}>Je n’ai pas créé Jordu parce que j’avais toutes les réponses.</h2>
            <div className="mt-5 flex flex-col gap-4 text-base leading-relaxed text-foreground/80">
              <p>
                J’ai été décoratrice, avant comptable — et mon activité n’a pas fonctionné comme je l’espérais, pas
                assez de demandes pour en vivre.
              </p>
              <p>
                En regardant ce qui se passait autour de moi, j’ai remarqué autre chose : pendant les grosses
                périodes, des décoratrices parlaient de messages qui s’accumulaient, de devis en retard. Je me suis
                demandé : « Si un jour j’en arrive là, comment je vais gérer tout ça ? » C’est cette question qui m’a
                amenée à réfléchir à Jordu.
              </p>
              <p>
                Le nom vient de là aussi : « Jordu », ça veut dire <em>aujourd’hui</em> en créole réunionnais — la
                journée qu’on a sous les yeux, celle qu’on peut refermer le soir sans y penser jusqu’au lendemain.
              </p>
              <p className="font-medium text-foreground">Je ne sais pas encore jusqu’où Jordu ira. Mais je sais pourquoi j’ai commencé.</p>
            </div>
          </div>
        </section>

        {/* 17 — FAQ */}
        <section id="faq" className={cn(SECTION, 'bg-card')} aria-labelledby="faq-title">
          <div className={cn(CONTAINER, 'max-w-3xl')}>
            <p className={KICKER}>Questions fréquentes</p>
            <h2 id="faq-title" className={cn(H2, 'mt-2')}>Tout ce que tu te demandes avant de t’inscrire</h2>
            <div className="mt-8 divide-y divide-border border-y border-border">
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

        {/* 18 — APPEL FINAL */}
        <section className="bg-[#680808] py-20 text-[#DDE6EF] sm:py-28" aria-labelledby="final">
          <div className={cn(CONTAINER, 'flex flex-col items-center gap-6 text-center')}>
            <h2 id="final" className="text-balance font-heading text-3xl font-semibold tracking-tight sm:text-5xl">
              Ton travail a une place. Ta vie aussi.
            </h2>
            <p className="max-w-xl text-lg leading-relaxed text-[#DDE6EF]/85">
              Jordu est en construction — j’ai envie de le faire avec les décoratrices concernées par ce problème.
            </p>
            <div className="w-full max-w-md">
              <JorduWaitlistForm inverted submitLabel="Je veux rejoindre Jordu" />
            </div>
            <p className="text-sm text-[#DDE6EF]/80">
              Pas de spam. Juste les nouvelles importantes concernant Jordu. Une question ?{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium underline underline-offset-4">
                {CONTACT_EMAIL}
              </a>
            </p>
          </div>
        </section>
      </main>

      {/* 19 — FOOTER */}
      <footer className="border-t border-border py-8">
        <div className={cn(CONTAINER, 'flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between')}>
          <div className="flex items-center gap-3">
            <img src="/brand/jordu-wordmark.svg" alt="Jordu — organisation évènementielle" width={57} height={24} className="h-6 w-auto" />
            <p>L’organisation pensée pour les décoratrices événementielles.</p>
          </div>
          <p>© {new Date().getFullYear()} Jordu</p>
        </div>
        <div className={cn(CONTAINER, 'mt-4')}>
          <LegalLinks />
        </div>
      </footer>
      <CookieNotice brand="Jordu" />
    </div>
  )
}
