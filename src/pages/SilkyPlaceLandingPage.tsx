import { useEffect } from 'react'
import {
  Armchair,
  ArrowRight,
  Brain,
  Camera,
  ChevronDown,
  LayoutGrid,
  Mail,
  MessageCircle,
  Palette,
  Phone,
  StickyNote,
  type LucideIcon,
} from 'lucide-react'
import { CookieNotice } from '@/features/legal/CookieNotice'
import { LegalLinks } from '@/features/legal/LegalLinks'
import { SilkyPlaceWordmark } from '@/components/brand/SilkyPlaceWordmark'
import { BORDEAUX_GRADIENT, ComparisonPanels } from '@/features/landing/components/BeforeAfterSection'
import { DayTimeline } from '@/features/landing/components/DayTimeline'
import { AudienceCards } from '@/features/landing/components/WhoItsForSection'
import { SilkyPlaceHowItWorks } from '@/features/silkyplace-landing/SilkyPlaceHowItWorks'
import { SilkyPlaceTimeCalculator } from '@/features/silkyplace-landing/SilkyPlaceTimeCalculator'
import { SilkyPlaceWaitlistForm } from '@/features/silkyplace-landing/SilkyPlaceWaitlistForm'
import { cn } from '@/lib/utils'

// Couleurs de marque SilkyPlace, écrites en dur ci-dessous à chaque usage (#DDE6EF fond,
// #520C0C primaire, #A9B08F accent, #5F6B4C = accent assombri pour le texte) — volontairement
// distinctes des tokens --primary/--thread de l'app existante, laissés intacts ailleurs
// dans le produit tant que le rebrand complet n'est pas décidé.
const CONTAINER = 'mx-auto w-full max-w-5xl px-5 sm:px-8'
const SECTION = 'scroll-mt-24 py-20 sm:py-32'
// Note : classes Tailwind écrites en toutes lettres (jamais interpolées via les constantes
// ci-dessus) — le scanner de Tailwind lit le texte source tel quel, une valeur injectée par
// template literal ne serait pas détectée et la règle CSS ne serait jamais générée.
const H2 = 'text-balance font-heading text-4xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-5xl'
const KICKER = 'text-xs font-semibold uppercase tracking-[0.16em] text-[#5F6B4C]'
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


/** Après le « oui » : ce qui se prépare ensuite dans SilkyPlace. */
const AFTER_YES = [
  {
    icon: Palette,
    title: 'Le moodboard',
    text: 'Palette, matières, photos d’inspiration : tu poses tout librement, puis tu l’envoies aux mariés en PDF ou en image.',
  },
  {
    icon: LayoutGrid,
    title: 'Le plan de salle',
    text: 'Tu redessines la salle, même biscornue, et tu places tables, piste de danse, bar et buffet où tu veux.',
  },
  {
    icon: Armchair,
    title: 'Le plan de table',
    text: 'Tu assois chaque invité d’un glisser-déposer, et tu imprimes la liste par table pour le jour J.',
  },
]

const BEFORE_AFTER = [
  { before: '« Elle m’avait écrit où déjà ? »', after: '« Je sais où regarder. »' },
  { before: '« Je dois penser à la relancer. »', after: '« Je vois ce qui est en attente. »' },
  { before: '« Je vais vérifier mes DM ce soir. »', after: '« Je sais ce qui peut attendre demain. »' },
  { before: '« J’ai tout dans ma tête. »', after: '« J’ai une vue d’ensemble. »' },
  { before: '« Mon téléphone me suit partout. »', after: '« Je peux le poser. »' },
  { before: '« Je continue après le dîner. »', after: '« Je sais où reprendre demain. »' },
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
    q: 'SilkyPlace est-il déjà disponible ?',
    a: 'Pas encore, c’est en construction. En t’inscrivant, tu seras informée des prochaines étapes et de l’ouverture des premiers tests.',
  },
  {
    q: 'Est-ce que SilkyPlace va m’apporter plus de clientes ?',
    a: 'Non. SilkyPlace ne remplace pas ton marketing — il s’intéresse à la gestion des demandes que tu reçois déjà.',
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
    q: 'Quand pourrai-je tester SilkyPlace ?',
    a: 'Les premières personnes inscrites seront informées dès l’ouverture des premiers tests.',
  },
]

/** Teintes de marque en alternance pour les pastilles d'icône — mêmes que la landing. */
const TILE_TONES = ['bg-[#DDE6EF] text-[#520C0C]', 'bg-[#A9B08F]/25 text-[#5F6B4C]', 'bg-[#520C0C]/[0.07] text-[#520C0C]']


/** Carte à pastille d'icône — même gabarit que les cartes de fonctionnalités de la landing. */
function IconCard({ icon: Icon, title, text, tone }: { icon: LucideIcon; title: string; text: string; tone: number }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-7 shadow-(--shadow-card)">
      <span className={cn('flex size-11 items-center justify-center rounded-xl', TILE_TONES[tone % TILE_TONES.length])}>
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <p className="mt-1 font-heading text-lg font-semibold text-foreground">{title}</p>
      <p className="text-sm leading-relaxed text-muted-foreground">{text}</p>
    </div>
  )
}

/**
 * Landing "bis" — /liste-attente : uniquement une collecte d'emails en attendant que
 * le MVP SilkyPlace soit prêt, distincte de la vraie landing "lancement" (RootGate /).
 * Jamais liée à un compte, jamais d'auth — juste api/waitlist.ts. Même style
 * « aérien » que la landing (classe landing-airy, cartes, halos).
 */
export function SilkyPlaceLandingPage() {
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
    <div className="landing-airy min-h-dvh bg-background text-foreground">
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-[#520C0C] focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-[#DDE6EF]"
      >
        Aller au contenu
      </a>

      {/* 1 — HEADER */}
      <header className="sticky top-0 z-30 border-b border-border/70 bg-card/80 backdrop-blur-md">
        <div className={cn(CONTAINER, 'flex h-20 items-center justify-between gap-4')}>
          <a href="#haut" aria-label="SilkyPlace — haut de page">
            <SilkyPlaceWordmark className="text-[26px] sm:text-[32px]" />
          </a>
          <nav aria-label="Sections de la page" className="hidden items-center gap-7 text-sm text-muted-foreground lg:flex">
            <a href="#probleme" className="transition-colors hover:text-foreground">Le problème</a>
            <a href="#comment-ca-marche" className="transition-colors hover:text-foreground">Comment ça marche</a>
            <a href="#pourquoi-silkyplace" className="transition-colors hover:text-foreground">Pourquoi SilkyPlace</a>
            <a href="#faq" className="transition-colors hover:text-foreground">FAQ</a>
          </nav>
          <button
            type="button"
            onClick={scrollToInscription}
            className="rounded-full bg-[#520C0C] px-5 py-2.5 text-sm font-medium text-[#DDE6EF] shadow-(--shadow-raised) transition-colors hover:bg-[#520C0C]/90"
          >
            Je veux rejoindre SilkyPlace
          </button>
        </div>
      </header>

      <main id="contenu" className="flex flex-col">
        {/* 2 — HERO */}
        <section id="haut" className="relative isolate overflow-hidden pb-24 pt-16 sm:pb-32 sm:pt-28">
          <div aria-hidden="true" className="pointer-events-none absolute -left-40 -top-40 -z-10 size-[42rem] rounded-full bg-[#DDE6EF] opacity-70 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -right-32 top-24 -z-10 size-[30rem] rounded-full bg-[#520C0C] opacity-[0.05] blur-3xl" />
          <div className={cn(CONTAINER, 'flex flex-col items-center gap-8 text-center animate-page-in')}>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3.5 py-1.5 text-xs font-medium uppercase tracking-[0.12em] text-[#5F6B4C] shadow-(--shadow-card)">
              <span className="size-1.5 rounded-full bg-[#A9B08F]" aria-hidden="true" />
              SilkyPlace — en construction
            </span>
            <h1 className="max-w-4xl text-balance font-heading text-5xl font-semibold leading-[1.04] tracking-tight text-[#520C0C] sm:text-7xl">
              Et si tu pouvais vraiment fermer ton ordinateur à 18h ?
            </h1>
            <p className="max-w-2xl text-pretty text-lg leading-relaxed text-foreground/80">
              Tu as créé ton activité pour décorer, créer, imaginer — pas pour répondre à WhatsApp à 21h ou chercher
              un devis pendant que ta famille t’attend. SilkyPlace t’aide à mieux gérer tes demandes, pour que ton travail
              reprenne sa place.
            </p>
            <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 text-left shadow-(--shadow-raised)">
              <p className="mb-3 text-sm font-medium text-foreground">Je veux rejoindre SilkyPlace →</p>
              <SilkyPlaceWaitlistForm id="inscription" submitLabel="Je veux rejoindre SilkyPlace" />
            </div>
            <p className="text-sm text-muted-foreground">
              SilkyPlace est encore en construction. Rejoins les premières décoratrices qui veulent suivre l’aventure.
            </p>
          </div>
        </section>

        {/* 2 — LE PROBLÈME */}
        <section id="probleme" className={cn(SECTION, 'bg-card')}>
          <div className={CONTAINER}>
            <div className="mx-auto max-w-2xl text-center">
              <p className={KICKER}>Le problème</p>
              <h2 className={cn(H2, 'mt-3')}>Tes demandes peuvent être partout</h2>
              <p className="mt-5 text-lg text-muted-foreground">
                Pas forcément trop de travail — plutôt des demandes éparpillées partout, et ta tête qui essaie de se
                souvenir de tout.
              </p>
            </div>
            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {HEAD_THOUGHTS.map((item, i) => (
                <IconCard key={item.source} icon={item.icon} title={item.thought} text={item.source} tone={i} />
              ))}
            </div>
          </div>
        </section>

        {/* 3 — LA JOURNÉE QUI DÉBORDE — frise interactive (sa conclusion reprend « Imagine… ») */}
        <section className={SECTION}>
          <div className={CONTAINER}>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className={H2}>À quel moment ta journée finit vraiment ?</h2>
              <p className="mt-4 text-muted-foreground">Clique sur une heure.</p>
            </div>
            <div className="mt-12">
              <DayTimeline
                moments={DAY_TIMELINE}
                conclusion="Et demain, il faudra se souvenir de tout ce qui reste. Imagine plutôt : 18h05, tu poses ton téléphone, sans peur d’avoir oublié quelque chose."
              />
            </div>
          </div>
        </section>

        {/* 4 — UNE DEMANDE ARRIVE (démo interactive) */}
        <section id="comment-ca-marche" className={cn(SECTION, 'bg-card')}>
          <div className={CONTAINER}>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className={H2}>Une demande arrive.</h2>
              <p className="mt-4 text-muted-foreground">Clique sur une étape pour la voir en action.</p>
            </div>
            <div className="mt-12 rounded-[2rem] border border-border bg-background p-6 shadow-(--shadow-card) sm:p-10">
              <SilkyPlaceHowItWorks />
            </div>
          </div>
        </section>

        {/* 5 — APRÈS LE OUI : moodboard, plan de salle, plan de table */}
        <section id="apres-le-oui" className={SECTION}>
          <div className={CONTAINER}>
            <div className="mx-auto max-w-2xl text-center">
              <p className={KICKER}>Après le oui</p>
              <h2 className={cn(H2, 'mt-3')}>Et une fois le mariage signé ?</h2>
              <p className="mt-5 text-lg text-muted-foreground">
                Tout se prépare au même endroit : de l’ambiance au placement des invités, sans jongler entre Canva, Excel
                et une feuille de papier.
              </p>
            </div>
            <div className="mt-14 grid gap-5 sm:grid-cols-3">
              {AFTER_YES.map((item, i) => (
                <IconCard key={item.title} icon={item.icon} title={item.title} text={item.text} tone={i} />
              ))}
            </div>
          </div>
        </section>

        {/* 6 — AVANT / APRÈS */}
        <section className={cn(SECTION, 'bg-card')}>
          <div className={CONTAINER}>
            <div className="mx-auto max-w-2xl text-center">
              <p className={KICKER}>La différence</p>
              <h2 className={cn(H2, 'mt-3')}>Pas pour travailler plus vite. Pour avoir moins de choses à retenir.</h2>
            </div>
            <div className="mt-14">
              <ComparisonPanels
                before={{ label: 'Avant', title: 'Aujourd’hui', rows: BEFORE_AFTER.map((row) => ({ text: row.before })) }}
                after={{ label: 'Après', title: 'Avec une organisation claire', rows: BEFORE_AFTER.map((row) => ({ text: row.after })) }}
              />
            </div>
          </div>
        </section>

        {/* 7 — PETIT CALCULATEUR */}
        <section className={SECTION}>
          <div className={cn(CONTAINER, 'max-w-3xl')}>
            <div className="text-center">
              <p className={KICKER}>Petit calculateur</p>
              <h2 className={cn(H2, 'mt-3')}>Et tout ce temps passé à gérer tes demandes ?</h2>
              <p className="mt-5 text-lg text-muted-foreground">
                Pendant les grosses périodes, quelques minutes par demande peuvent rapidement s’accumuler.
              </p>
            </div>
            <div className="mt-12">
              <SilkyPlaceTimeCalculator />
            </div>
          </div>
        </section>

        {/* 8 — POUR QUI ? */}
        <section className={cn(SECTION, 'bg-card')}>
          <div className={CONTAINER}>
            <div className="mx-auto max-w-2xl text-center">
              <p className={KICKER}>Pour qui</p>
              <h2 className={cn(H2, 'mt-3')}>SilkyPlace est pour toi si…</h2>
            </div>
            <div className="mt-14">
              <AudienceCards
                items={FOR_YOU}
                notForLabel="Pas pour toi si…"
                notFor={
                  <ul className="flex flex-col gap-3">
                    {NOT_FOR_YOU.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                }
                fitLabel="Exactement au bon endroit si…"
                fit={
                  <>
                    <p className="text-xl leading-relaxed sm:text-2xl">
                      SilkyPlace ne cherche pas à remplir ton agenda.{' '}
                      <span className="font-semibold text-white">Il cherche à t’aider à mieux vivre avec celui que tu as.</span>
                    </p>
                    <button
                      type="button"
                      onClick={scrollToInscription}
                      className="inline-flex w-fit items-center gap-2 rounded-full bg-[#DDE6EF] px-7 py-3.5 text-base font-medium text-[#520C0C] shadow-(--shadow-raised) transition-colors hover:bg-white"
                    >
                      Je veux rejoindre SilkyPlace
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </button>
                  </>
                }
              />
            </div>
          </div>
        </section>

        {/* 9 — POURQUOI SilkyPlace ? (portrait + origine du nom) */}
        <section id="pourquoi-silkyplace" className={SECTION}>
          <div className={cn(CONTAINER, 'max-w-3xl')}>
            <div className="rounded-[2rem] border border-border bg-card p-8 shadow-(--shadow-card) sm:p-12">
              <p className={KICKER}>Pourquoi SilkyPlace</p>
              <h2 className="mt-3 text-balance font-heading text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
                Je n’ai pas créé SilkyPlace parce que j’avais toutes les réponses.
              </h2>
              <div className="mt-6 flex flex-col gap-4 text-lg leading-relaxed text-foreground/80">
                <p>
                  J’ai été comptable, avant décoratrice — et mon activité de décoratrice n’a pas fonctionné comme je
                  l’espérais, pas assez de demandes pour en vivre.
                </p>
                <p>
                  En regardant ce qui se passait autour de moi, j’ai remarqué autre chose : pendant les grosses
                  périodes, des décoratrices parlaient de messages qui s’accumulaient, de devis en retard. Je me suis
                  demandé : « Si un jour j’en arrive là, comment je vais gérer tout ça ? » C’est cette question qui m’a
                  amenée à réfléchir à SilkyPlace.
                </p>
                <p>
                  Le nom vient de là aussi. <em>Silky</em>, c’est la soie : ce qui glisse, sans accroc. <em>Place</em>,
                  c’est un lieu. SilkyPlace, c’est l’endroit où tes projets s’enchaînent en douceur et où chaque pièce
                  trouve sa place, pour que tu retrouves l’esprit libre, et du temps.
                </p>
                <p className="font-heading text-xl font-semibold text-[#520C0C]">
                  Je ne sais pas encore jusqu’où SilkyPlace ira. Mais je sais pourquoi j’ai commencé.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 10 — FAQ */}
        <section id="faq" className={cn(SECTION, 'bg-card')} aria-labelledby="faq-title">
          <div className={cn(CONTAINER, 'max-w-3xl')}>
            <div className="text-center">
              <p className={KICKER}>Questions fréquentes</p>
              <h2 id="faq-title" className={cn(H2, 'mt-3')}>Tout ce que tu te demandes avant de t’inscrire</h2>
            </div>
            <div className="mt-12 flex flex-col gap-3">
              {FAQ.map((item) => (
                <details key={item.q} className="group rounded-2xl border border-border bg-background px-6 py-5 shadow-(--shadow-card)">
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

        {/* 11 — APPEL FINAL */}
        <section className={cn('py-24 text-[#DDE6EF] sm:py-36', BORDEAUX_GRADIENT)} aria-labelledby="final">
          <div className={cn(CONTAINER, 'flex flex-col items-center gap-6 text-center')}>
            <h2 id="final" className="text-balance font-heading text-4xl font-semibold tracking-tight text-white sm:text-6xl">
              Ton travail a une place. Ta vie aussi.
            </h2>
            <p className="max-w-xl text-lg leading-relaxed text-[#DDE6EF]/85">
              SilkyPlace est en construction — j’ai envie de le faire avec les décoratrices concernées par ce problème.
            </p>
            <div className="w-full max-w-md">
              <SilkyPlaceWaitlistForm inverted submitLabel="Je veux rejoindre SilkyPlace" />
            </div>
            <p className="text-sm text-[#DDE6EF]/80">
              Pas de spam. Juste les nouvelles importantes concernant SilkyPlace. Une question ?{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium underline underline-offset-4">
                {CONTACT_EMAIL}
              </a>
            </p>
          </div>
        </section>
      </main>

      {/* 12 — FOOTER */}
      <footer className="border-t border-border py-12">
        <div className={cn(CONTAINER, 'flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between')}>
          <div className="flex items-center gap-3">
            <SilkyPlaceWordmark className="text-xl" />
            <p>L’organisation pensée pour les décoratrices événementielles.</p>
          </div>
          <p>© {new Date().getFullYear()} SilkyPlace</p>
        </div>
        <div className={cn(CONTAINER, 'mt-4')}>
          <LegalLinks />
        </div>
      </footer>
      <CookieNotice brand="SilkyPlace" />
    </div>
  )
}
