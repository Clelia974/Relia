import { useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { CookieNotice } from '@/features/legal/CookieNotice'
import { LegalLinks } from '@/features/legal/LegalLinks'
import { OuiTimeCalculator } from '@/features/oui-landing/OuiTimeCalculator'
import { OuiWaitlistForm } from '@/features/oui-landing/OuiWaitlistForm'
import { cn } from '@/lib/utils'

const CONTAINER = 'mx-auto w-full max-w-4xl px-5 sm:px-8'
const SECTION = 'scroll-mt-20 py-14 sm:py-20'
const H2 = 'font-heading text-2xl font-semibold tracking-tight text-primary sm:text-3xl'
const KICKER = 'text-xs font-medium uppercase tracking-[0.14em] text-thread-text'
const CONTACT_EMAIL = 'hello@relia.com'

const HEAD_THOUGHTS = [
  { source: 'Instagram', thought: '« Elle m’avait demandé quoi déjà ? »' },
  { source: 'WhatsApp', thought: '« Il faut que je lui réponde. »' },
  { source: 'Email', thought: '« J’avais envoyé le devis ou pas ? »' },
  { source: 'Téléphone', thought: '« Il faut que je rappelle cette cliente. »' },
  { source: 'Notes', thought: '« J’avais noté ça quelque part… »' },
  { source: 'Ta tête', thought: '« Ne surtout pas oublier cette demande. »' },
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
  { emoji: '👨‍👩‍👧', title: 'Ta famille', text: 'Être vraiment là. Sans téléphone posé à côté de toi au cas où une cliente écrive.' },
  { emoji: '✂️', title: 'Ta créativité', text: 'Créer un moodboard. Chercher une nouvelle idée. Préparer ton prochain projet — ou simplement avoir envie de créer à nouveau.' },
  { emoji: '❤️', title: 'Ton couple', text: 'Dîner sans dire : « Attends, je dois juste répondre à ce message. »' },
  { emoji: '🌙', title: 'Toi', text: 'Sortir. Lire. Dormir. Faire du sport. Ne rien faire.' },
]

const BEFORE_AFTER = [
  { before: '« Elle m’avait écrit où déjà ? »', after: '« Je sais où regarder. »' },
  { before: '« Je dois penser à la relancer. »', after: '« Je vois ce qui est en attente. »' },
  { before: '« Je vais vérifier mes DM ce soir. »', after: '« Je sais ce qui peut attendre demain. »' },
  { before: '« J’ai tout dans ma tête. »', after: '« J’ai une vue d’ensemble. »' },
  { before: '« Mon téléphone me suit partout. »', after: '« Je peux le poser. »' },
  { before: '« Je continue après le dîner. »', after: '« Je sais où reprendre demain. »' },
]

const WHAT_OUI_DOES_NOT = [
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

const HOW_IT_WORKS = [
  'Tu reçois une demande.',
  'Elle trouve sa place dans ton suivi.',
  'Tu sais ce qu’il reste à faire.',
  'Tu avances sans devoir tout retenir.',
  'Tu fermes ton ordinateur.',
]

const FAQ: { q: string; a: string }[] = [
  {
    q: 'OUI est-il déjà disponible ?',
    a: 'Pas encore. OUI est actuellement en construction. En t’inscrivant, tu seras informée des prochaines étapes et de l’ouverture des premiers tests.',
  },
  {
    q: 'Est-ce que OUI va m’apporter plus de clientes ?',
    a: 'Non. OUI ne remplace pas ton marketing et ne promet pas de générer des demandes. Il s’intéresse à la gestion des demandes que tu reçois déjà.',
  },
  {
    q: 'Est-ce uniquement pour les mariages ?',
    a: 'Non. OUI est pensé pour les décoratrices événementielles, quel que soit le type d’événement : mariage, baptême, anniversaire, communion, confirmation, événement professionnel…',
  },
  {
    q: 'Est-ce que je devrai abandonner WhatsApp ou Instagram ?',
    a: 'Non. L’objectif n’est pas de te demander où tes clientes doivent t’écrire. L’idée est justement de t’aider à mieux gérer les demandes qui arrivent de différents endroits.',
  },
  {
    q: 'Quand pourrai-je tester OUI ?',
    a: 'Les premières personnes inscrites seront informées lorsque les premiers tests seront disponibles.',
  },
  {
    q: 'Pourquoi m’inscrire maintenant ?',
    a: 'Parce que tu peux suivre la construction de OUI dès le début et, si tu le souhaites, participer aux réflexions et aux premiers tests.',
  },
]

/**
 * Landing "bis" — /oui : uniquement une collecte d'emails en attendant que
 * le MVP OUI soit prêt, distincte de la vraie landing RELIA (RootGate /).
 * Jamais liée à un compte, jamais d'auth — juste api/waitlist.ts.
 */
export function OuiLandingPage() {
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
    <div className="min-h-dvh bg-background text-foreground">
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Aller au contenu
      </a>

      {/* 1 — HEADER */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-card/95 backdrop-blur">
        <div className={cn(CONTAINER, 'flex h-16 items-center justify-between gap-4')}>
          <a href="#haut" className="font-heading text-2xl font-semibold tracking-tight text-primary" aria-label="OUI — haut de page">
            OUI
          </a>
          <nav aria-label="Sections de la page" className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a href="#probleme" className="transition-colors hover:text-foreground">Le problème</a>
            <a href="#comment-ca-marche" className="transition-colors hover:text-foreground">Comment ça marche</a>
            <a href="#pourquoi-oui" className="transition-colors hover:text-foreground">Pourquoi OUI</a>
            <a href="#faq" className="transition-colors hover:text-foreground">FAQ</a>
          </nav>
          <button
            type="button"
            onClick={scrollToInscription}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Je découvre OUI
          </button>
        </div>
      </header>

      <main id="contenu" className="flex flex-col">
        {/* 2 — HERO */}
        <section id="haut" className="overflow-hidden pb-14 pt-14 sm:pb-20 sm:pt-20">
          <div className={cn(CONTAINER, 'flex flex-col items-center gap-6 text-center')}>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium uppercase tracking-[0.1em] text-thread-text">
              <span className="size-1.5 rounded-full bg-thread" aria-hidden="true" />
              OUI — en construction
            </span>
            <h1 className="text-balance font-heading text-4xl font-semibold leading-[1.1] tracking-tight text-primary sm:text-5xl">
              Tu finis à 18h. Tu poses ton téléphone.
              <br className="hidden sm:block" /> Tu profites de ta soirée.
            </h1>
            <p className="max-w-2xl text-pretty text-lg leading-relaxed text-foreground/80">
              Tu as créé ton activité pour décorer, créer, imaginer de beaux événements. Pas pour répondre à WhatsApp à
              21h. Pas pour vérifier tes DM le dimanche. Pas pour chercher un devis pendant que ta famille t’attend.
            </p>
            <p className="max-w-2xl text-pretty text-base leading-relaxed text-foreground/80">
              OUI est pensé pour t’aider à mieux gérer tes demandes, pour que ton travail reprenne sa place.
            </p>

            <div className="mt-2 w-full max-w-md">
              <p className="mb-3 text-sm font-medium text-foreground">Je veux découvrir OUI →</p>
              <OuiWaitlistForm id="inscription" />
            </div>
            <p className="text-sm text-muted-foreground">
              OUI est encore en construction. Rejoins les premières décoratrices qui veulent suivre l’aventure.
            </p>
          </div>
        </section>

        {/* 3 — MANIFESTE */}
        <section className={cn(SECTION, 'bg-card')}>
          <div className={cn(CONTAINER, 'max-w-2xl text-center')}>
            <h2 className={H2}>Ton travail a une place. Ta vie aussi.</h2>
            <div className="mt-5 flex flex-col gap-4 text-base leading-relaxed text-foreground/80">
              <p>Tu peux aimer ton métier.</p>
              <p>Aimer créer. Aimer imaginer une décoration. Aimer voir un événement prendre vie.</p>
              <p>Et malgré tout, ne pas avoir envie de passer ta soirée à répondre à des messages.</p>
              <p>Parce qu’être à son compte, ce n’est pas être disponible tout le temps.</p>
              <p className="font-medium text-foreground">
                Ton activité mérite ton attention. Ta famille aussi. Tes soirées aussi. Tes dimanches aussi.
              </p>
            </div>
          </div>
        </section>

        {/* 4 — LE PROBLÈME */}
        <section id="probleme" className={SECTION}>
          <div className={CONTAINER}>
            <div className="max-w-2xl">
              <p className={KICKER}>Le problème</p>
              <h2 className={cn(H2, 'mt-2')}>Tes demandes peuvent être partout</h2>
              <p className="mt-3 text-muted-foreground">
                Le problème, ce n’est pas forcément que tu as trop de travail. C’est que tes demandes peuvent être
                partout — une sur Instagram, une autre sur WhatsApp, un mail pour un devis, un appel auquel tu dois
                penser à répondre, une note quelque part pour ne pas oublier une information.
              </p>
              <p className="mt-3 text-muted-foreground">Et au milieu de tout ça… ta tête essaie de se souvenir de tout.</p>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {HEAD_THOUGHTS.map((item) => (
                <div key={item.source} className="rounded-xl border border-border bg-card p-5">
                  <p className={KICKER}>{item.source}</p>
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
                  <span className="shrink-0 font-heading text-sm font-semibold text-primary sm:w-16">{item.time}</span>
                  <span className="text-foreground/80">{item.text}</span>
                </li>
              ))}
            </ol>
            <p className="mt-8 max-w-2xl text-muted-foreground">
              Et demain, il faudra se souvenir de tout ce qui reste. Tu travailles peut-être depuis chez toi. Mais
              est-ce que ton travail sait vraiment s’arrêter ?
            </p>
          </div>
        </section>

        {/* 6 — LA VIE QUE TU VEUX RETROUVER */}
        <section className={SECTION}>
          <div className={cn(CONTAINER, 'max-w-2xl text-center')}>
            <h2 className={H2}>Imagine.</h2>
            <div className="mt-6 flex flex-col gap-3 text-lg leading-relaxed text-foreground/80">
              <p>18h00. Tu fermes ton ordinateur.</p>
              <p>18h05. Tu poses ton téléphone.</p>
              <p>Tu sais ce qui est traité. Tu sais ce qui est en attente. Tu sais ce que tu retrouveras demain.</p>
              <p>Alors tu arrêtes.</p>
              <p>Pas parce que tu t’en fiches de tes clientes. Parce que tu sais que tu peux reprendre demain sans avoir peur d’avoir oublié quelque chose.</p>
              <p>Tu manges avec ta famille. Tu joues avec ton enfant. Tu regardes une série. Tu crées quelque chose. Tu lis. Tu sors. Ou tu ne fais rien.</p>
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
                  <p className="text-2xl" aria-hidden="true">{item.emoji}</p>
                  <p className="mt-2 font-heading text-lg font-semibold text-foreground">{item.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                </div>
              ))}
            </div>
            <p className="mt-8 max-w-2xl text-muted-foreground">
              OUI ne veut pas remplir le temps que tu récupères. Il veut te permettre de choisir ce que tu en fais.
            </p>
          </div>
        </section>

        {/* 8 — LE CONSTAT QUI A DONNÉ NAISSANCE À OUI */}
        <section className={SECTION}>
          <div className={cn(CONTAINER, 'max-w-2xl')}>
            <p className={KICKER}>D’où vient OUI</p>
            <h2 className={cn(H2, 'mt-2')}>Pourquoi j’ai commencé à réfléchir à OUI</h2>
            <div className="mt-5 flex flex-col gap-4 text-base leading-relaxed text-foreground/80">
              <p>Quand j’étais décoratrice, je regardais beaucoup ce que faisaient les autres décoratrices.</p>
              <p>
                Et pendant les grosses périodes, je voyais régulièrement passer des messages sur les retards de
                traitement des demandes, des devis qui prenaient du temps, des messages auxquels elles n’avaient pas
                encore répondu…
              </p>
              <p>Moi, je n’avais pas beaucoup de demandes à ce moment-là, donc je ne vivais pas encore ce problème.</p>
              <p>Mais ça m’a interpellée. Je me suis demandé : « Si un jour j’ai beaucoup plus de demandes, comment je vais gérer tout ça ? »</p>
              <p>
                Et surtout : « Est-ce qu’il n’y aurait pas une façon plus simple de suivre les demandes, les devis et
                les échanges, sans devoir tout chercher partout ? »
              </p>
              <p className="font-medium text-foreground">C’est là que j’ai commencé à réfléchir à OUI.</p>
            </div>
          </div>
        </section>

        {/* 9 — OUI, C'EST QUOI ? */}
        <section id="comment-ca-marche" className={cn(SECTION, 'bg-card')}>
          <div className={CONTAINER}>
            <div className="max-w-2xl">
              <p className={KICKER}>Comment ça marche</p>
              <h2 className={cn(H2, 'mt-2')}>OUI, c’est quoi ?</h2>
              <p className="mt-3 text-muted-foreground">
                OUI est pensé autour d’une idée simple : une demande devrait avoir un endroit où aller.
              </p>
            </div>
            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {[
                { n: '01', title: 'Voir', text: 'Retrouver tes demandes au même endroit — au lieu de chercher dans plusieurs conversations, applications ou notes.' },
                { n: '02', title: 'Savoir', text: 'Voir ce qui est à traiter, ce qui est en attente, ce qui est confirmé, ce qui peut attendre demain.' },
                { n: '03', title: 'Suivre', text: 'Ne plus avoir à compter uniquement sur ta mémoire pour savoir qui doit être relancé ou quel devis doit être traité.' },
                { n: '04', title: 'Décrocher', text: 'Fermer ton ordinateur en sachant où tu en es.' },
              ].map((item) => (
                <div key={item.n} className="rounded-xl border border-border bg-background p-6">
                  <p className="font-heading text-sm font-semibold text-thread-text">{item.n}</p>
                  <p className="mt-1 font-heading text-lg font-semibold text-foreground">{item.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                </div>
              ))}
            </div>
            <p className="mt-8 max-w-2xl text-muted-foreground">
              Pas une usine à gaz. Pas une application de plus à alimenter toute la journée. Une organisation pensée
              autour de la réalité d’une décoratrice événementielle.
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
            <div className="mt-10 overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[520px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-card text-left">
                    <th className="p-4 font-heading font-semibold text-foreground">Aujourd’hui</th>
                    <th className="p-4 font-heading font-semibold text-foreground">Avec une organisation claire</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {BEFORE_AFTER.map((row) => (
                    <tr key={row.before}>
                      <td className="p-4 align-top text-muted-foreground">{row.before}</td>
                      <td className="p-4 align-top text-foreground">{row.after}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
              <OuiTimeCalculator />
            </div>
          </div>
        </section>

        {/* 12 — CE QUE OUI NE PROMET PAS */}
        <section className={SECTION}>
          <div className={cn(CONTAINER, 'max-w-2xl')}>
            <h2 className={H2}>On ne va pas te raconter que OUI va régler toute ton activité.</h2>
            <p className="mt-4 text-muted-foreground">OUI ne va pas :</p>
            <ul className="mt-3 flex flex-col gap-2 text-foreground/80">
              {WHAT_OUI_DOES_NOT.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-muted-foreground" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-muted-foreground">Ce n’est pas son rôle.</p>
            <div className="mt-4 flex flex-col gap-2 text-foreground/80">
              <p>OUI s’intéresse à ce qui arrive après qu’une demande soit arrivée.</p>
              <p>Comment la suivre. Comment savoir où tu en es. Comment éviter de devoir tout garder dans ta tête.</p>
              <p className="font-medium text-foreground">Et peut-être, simplement… pouvoir fermer ton ordinateur sans culpabiliser.</p>
            </div>
          </div>
        </section>

        {/* 13 — CONSTRUCTION */}
        <section className={cn(SECTION, 'bg-card')}>
          <div className={cn(CONTAINER, 'max-w-2xl text-center')}>
            <h2 className={H2}>OUI est encore en construction.</h2>
            <p className="mt-4 text-muted-foreground">Et on ne va pas te raconter que tout est déjà réglé.</p>
            <p className="mt-3 font-heading text-lg text-foreground">On teste. On réfléchit. On construit. On écoute. On change. On recommence.</p>
            <p className="mt-4 text-muted-foreground">
              Parce que le but n’est pas de créer une application de plus. Le but est de construire quelque chose que
              les décoratrices auront réellement envie d’utiliser.
            </p>
            <p className="mt-2 text-muted-foreground">Et pour ça, j’ai besoin de comprendre ce dont elles ont vraiment besoin.</p>
          </div>
        </section>

        {/* 14 — POUR QUI ? */}
        <section className={SECTION}>
          <div className={CONTAINER}>
            <div className="max-w-2xl">
              <p className={KICKER}>Pour qui</p>
              <h2 className={cn(H2, 'mt-2')}>OUI est pour toi si…</h2>
            </div>
            <div className="mt-10 grid gap-8 sm:grid-cols-2">
              <ul className="flex flex-col gap-2.5">
                {FOR_YOU.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-foreground/80">
                    <span className="mt-0.5 text-success">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <div>
                <p className="mb-2.5 text-sm font-medium text-muted-foreground">OUI n’est probablement pas pour toi si…</p>
                <ul className="flex flex-col gap-2.5">
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
              OUI ne cherche pas à remplir ton agenda. Il cherche à t’aider à mieux vivre avec celui que tu as.
            </p>
          </div>
        </section>

        {/* 15 — COMMENT ÇA POURRAIT FONCTIONNER */}
        <section className={cn(SECTION, 'bg-card')}>
          <div className={cn(CONTAINER, 'max-w-2xl')}>
            <h2 className={H2}>Une demande arrive.</h2>
            <ol className="mt-8 flex flex-col gap-4">
              {HOW_IT_WORKS.map((step, i) => (
                <li key={step} className="flex items-center gap-4">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                    {i + 1}
                  </span>
                  <span className="text-foreground/80">{step}</span>
                </li>
              ))}
            </ol>
            <p className="mt-6 font-medium text-foreground">Et tu sais où reprendre demain.</p>
          </div>
        </section>

        {/* 16 — POURQUOI OUI ? (portrait) */}
        <section id="pourquoi-oui" className={SECTION}>
          <div className={cn(CONTAINER, 'max-w-2xl')}>
            <p className={KICKER}>Pourquoi OUI</p>
            <h2 className={cn(H2, 'mt-2')}>Je n’ai pas créé OUI parce que j’avais toutes les réponses.</h2>
            <div className="mt-5 flex flex-col gap-4 text-base leading-relaxed text-foreground/80">
              <p>J’ai été décoratrice. Avant ça, j’étais comptable.</p>
              <p>Le côté « faire tous les jours la même chose » m’avait lassée.</p>
              <p>Puis j’ai eu mon fils et j’ai eu envie d’être davantage présente pour lui.</p>
              <p>Je me suis tournée vers la décoration événementielle parce que j’avais envie de créer quelque chose qui me ressemblait davantage.</p>
              <p>Mais mon activité de décoration n’a pas fonctionné comme je l’espérais. J’ai eu quelques événements, mais pas suffisamment de demandes pour en vivre comme je le voulais.</p>
              <p>Et en regardant ce qui se passait autour de moi, j’ai commencé à remarquer autre chose.</p>
              <p>Pendant les grosses périodes, je voyais des décoratrices parler de messages qui s’accumulaient, de devis en retard, de demandes difficiles à suivre.</p>
              <p>Moi, je n’avais pas encore ce volume. Mais je me suis demandé : « Si un jour j’en arrive là, comment est-ce que je vais gérer tout ça ? »</p>
              <p>C’est cette question qui m’a amenée à réfléchir à OUI.</p>
              <p>
                Aujourd’hui, je cherche une autre façon de rester proche de cet univers, tout en travaillant depuis
                chez moi et en construisant quelque chose qui puisse aussi laisser de la place à ma vie de famille.
              </p>
              <p className="font-medium text-foreground">Je ne sais pas encore jusqu’où OUI ira. Mais je sais pourquoi j’ai commencé.</p>
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
        <section className="bg-primary py-20 text-primary-foreground sm:py-28" aria-labelledby="final">
          <div className={cn(CONTAINER, 'flex flex-col items-center gap-6 text-center')}>
            <h2 id="final" className="text-balance font-heading text-3xl font-semibold tracking-tight sm:text-5xl">
              Ton travail a une place. Ta vie aussi.
            </h2>
            <p className="max-w-xl text-lg leading-relaxed text-primary-foreground/85">
              OUI est en construction. Et cette fois, j’ai envie de construire quelque chose avec les décoratrices
              concernées par ce problème.
            </p>
            <div className="w-full max-w-md">
              <OuiWaitlistForm inverted submitLabel="Je découvre OUI" />
            </div>
            <p className="text-sm text-primary-foreground/80">
              Pas de spam. Juste les nouvelles importantes concernant OUI. Une question ?{' '}
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
          <div>
            <p className="font-heading text-lg font-semibold text-primary">OUI</p>
            <p>L’organisation pensée pour les décoratrices événementielles.</p>
          </div>
          <p>© {new Date().getFullYear()} OUI · un projet Relia</p>
        </div>
        <div className={cn(CONTAINER, 'mt-4')}>
          <LegalLinks />
        </div>
      </footer>
      <CookieNotice />
    </div>
  )
}
