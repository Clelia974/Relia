import { useEffect, useRef, useState } from 'react'
import { ClipboardCheck, Clock, FileSpreadsheet, type LucideIcon, Package, Users, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'

type Step =
  | { kind: 'screenshot'; icon: LucideIcon; label: string; title: string; text: string; image: string; alt: string }
  | { kind: 'icon'; icon: LucideIcon; label: string; title: string; text: string }

/**
 * Carrousel horizontal à ancrage (scroll-snap) — une seule grande fenêtre
 * visible à la fois (comme gbcrea.com), pas plusieurs cartes qui se
 * chevauchent. `scroll-snap-stop: always` (CSS standard, pas de lib)
 * empêche de sauter une fenêtre sur un swipe rapide. Les 6 étapes montrent
 * désormais de vrais écrans (captures prises depuis l'app avec des
 * données réelles, pas la démo "Bonjour Démonstration").
 */
const STEPS: Step[] = [
  {
    kind: 'screenshot',
    icon: FileSpreadsheet,
    label: 'Import',
    title: 'Déjà tes mariages dans un tableur ? Importe-les en une fois',
    text: 'Glisse ton fichier Excel avec tes mariages, prestataires et budgets — RELIA reprend tout, sans ressaisie manuelle.',
    image: '/landing/import.jpg',
    alt: 'Aperçu de l’import d’un mariage et d’un prestataire depuis un fichier Excel dans RELIA',
  },
  {
    kind: 'screenshot',
    icon: ClipboardCheck,
    label: 'Tâches',
    title: 'Chaque matin, tu sais quoi faire',
    text: 'Priorités, dates limites, tâches reportées avec leur raison, et un calendrier mensuel filtrable par mariage ou par prestataire.',
    image: '/landing/tableau-de-bord.jpg',
    alt: 'Liste des tâches du jour dans RELIA, avec priorités et dates',
  },
  {
    kind: 'screenshot',
    icon: Clock,
    label: 'Jour J',
    title: 'Le déroulé de la journée, minute par minute',
    text: 'Filtre par moment (installation, cérémonie, réception, démontage), appelle un prestataire d’un geste, imprime ou enregistre le tout en PDF la veille.',
    image: '/landing/jour-j.jpg',
    alt: 'Le déroulé du Jour J dans RELIA',
  },
  {
    kind: 'screenshot',
    icon: Wallet,
    label: 'Finances',
    title: 'Le budget du couple et ta rentabilité, côte à côte',
    text: 'Ce qu’il reste à dépenser, ton profit prévisionnel et ta marge. Devis et factures indicatives numérotés automatiquement.',
    image: '/landing/finances.jpg',
    alt: 'L’onglet Finances de RELIA',
  },
  {
    kind: 'screenshot',
    icon: Package,
    label: 'Matériel',
    title: 'Une checklist par mariage',
    text: 'Quantité, statut, dégâts éventuels, destination au retour. Imprimable avant de partir.',
    image: '/landing/materiel.jpg',
    alt: 'La checklist Matériel de RELIA',
  },
  {
    kind: 'screenshot',
    icon: Users,
    label: 'Prestataires',
    title: 'Un carnet unique pour tous tes prestataires',
    text: 'Coordonnées, statut propre à chaque mariage, horaire d’arrivée et coûts.',
    image: '/landing/prestataires.jpg',
    alt: 'La liste des prestataires d’un mariage dans RELIA',
  },
  {
    kind: 'screenshot',
    icon: ClipboardCheck,
    label: 'Bilan',
    title: 'Un bilan à la fin de chaque mariage',
    text: 'Bilan financier, retours de ton client et ton portfolio avant/après.',
    image: '/landing/bilan.jpg',
    alt: 'Le bilan de clôture d’un mariage dans RELIA',
  },
]

export function FeatureCarousel() {
  const [activeIndex, setActiveIndex] = useState(0)
  const scrollerRef = useRef<HTMLDivElement | null>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const index = cardRefs.current.findIndex((el) => el === entry.target)
          if (index !== -1) setActiveIndex(index)
        }
      },
      { root: scroller, threshold: 0.6 },
    )
    for (const el of cardRefs.current) if (el) observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const goTo = (i: number) => {
    cardRefs.current[i]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }

  const step = STEPS[activeIndex]

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Fais glisser pour voir chaque fonctionnalité →</p>
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-thread-text">
          {String(activeIndex + 1).padStart(2, '0')} / {String(STEPS.length).padStart(2, '0')} · {step.label}
        </p>
      </div>

      <div ref={scrollerRef} className="flex snap-x snap-mandatory overflow-x-auto">
        {STEPS.map((s, i) => (
          <div
            key={s.label}
            ref={(el) => {
              cardRefs.current[i] = el
            }}
            className="w-full shrink-0 snap-center px-1"
            style={{ scrollSnapStop: 'always' }}
          >
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-(--shadow-raised)">
              {s.kind === 'screenshot' ? (
                <>
                  <div className="flex items-center gap-1.5 border-b border-border px-4 py-3">
                    <span className="size-2.5 rounded-full bg-risk/40" aria-hidden="true" />
                    <span className="size-2.5 rounded-full bg-warning/40" aria-hidden="true" />
                    <span className="size-2.5 rounded-full bg-success/40" aria-hidden="true" />
                    <span className="ml-2 text-xs text-muted-foreground">{s.label}</span>
                  </div>
                  <img src={s.image} alt={s.alt} width={1200} height={800} className="h-64 w-full object-cover object-top sm:h-[26rem]" />
                </>
              ) : (
                <div className="flex h-64 items-center justify-center bg-muted/40 sm:h-[26rem]">
                  <span className="flex size-20 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                    <s.icon className="size-9" aria-hidden="true" />
                  </span>
                </div>
              )}

              <div className="flex flex-col gap-2 p-6 sm:p-8">
                <h3 className="font-heading text-xl font-semibold text-foreground sm:text-2xl">{s.title}</h3>
                <p className="max-w-xl leading-relaxed text-muted-foreground">{s.text}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div role="tablist" aria-label="Étape affichée" className="flex items-center justify-center gap-2">
        {STEPS.map((s, i) => (
          <button
            key={s.label}
            type="button"
            role="tab"
            aria-selected={activeIndex === i}
            aria-label={s.label}
            onClick={() => goTo(i)}
            className={cn('h-1.5 rounded-full transition-all duration-300', activeIndex === i ? 'w-6 bg-primary' : 'w-1.5 bg-border')}
          />
        ))}
      </div>
    </div>
  )
}
