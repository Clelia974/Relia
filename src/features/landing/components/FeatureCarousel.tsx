import { useEffect, useRef, useState } from 'react'
import { ClipboardCheck, Clock, FileSpreadsheet, Package, Users, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Step {
  icon: typeof FileSpreadsheet
  label: string
  quote: string
  text: string
  takeaway: string
  note?: string
  image: string
  alt: string
}

/**
 * Carrousel horizontal à ancrage (scroll-snap) — une seule grande fenêtre
 * visible à la fois (comme gbcrea.com), pas plusieurs cartes qui se
 * chevauchent. `scroll-snap-stop: always` (CSS standard, pas de lib)
 * empêche de sauter une fenêtre sur un swipe rapide. Chaque fonctionnalité
 * part d'un problème réel (quote) → ce que fait SilkyPlace (text) → la conséquence
 * concrète (takeaway) — repris tel quel du copywriting de Clélia. Les 7
 * étapes montrent de vrais écrans (captures prises depuis l'app avec des
 * données réelles, pas la démo "Bonjour Démonstration").
 */
const STEPS: Step[] = [
  {
    icon: FileSpreadsheet,
    label: 'Import',
    quote: 'Tout est déjà dans mon Excel. Je vais devoir tout recommencer ?',
    text: 'Non. Importe tes mariages, prestataires et budgets depuis ton fichier Excel.',
    takeaway: 'Tu continues là où tu t’es arrêtée, sans tout ressaisir.',
    image: '/landing/import.jpg',
    alt: 'Aperçu de l’import d’un mariage et d’un prestataire depuis un fichier Excel dans SilkyPlace',
  },
  {
    icon: ClipboardCheck,
    label: 'Tâches',
    quote: 'Qu’est-ce que je dois faire aujourd’hui ?',
    text: 'Toutes tes tâches au même endroit. Priorités, dates limites, tâches reportées et calendrier filtrable par mariage ou par prestataire.',
    takeaway: 'Chaque matin, tu sais ce qui mérite ton attention.',
    image: '/landing/tableau-de-bord.jpg',
    alt: 'Liste des tâches du jour dans SilkyPlace, avec priorités et dates',
  },
  {
    icon: Clock,
    label: 'Jour J',
    quote: 'Qui doit être où, et à quelle heure ?',
    text: 'SilkyPlace transforme ton planning en déroulé minute par minute. Installation, cérémonie, réception, démontage… Tu peux filtrer, appeler un prestataire directement et exporter ton déroulé en PDF.',
    takeaway: 'Tu vois les chevauchements avant qu’ils ne deviennent un problème le Jour J.',
    image: '/landing/jour-j.jpg',
    alt: 'Le déroulé du Jour J dans SilkyPlace',
  },
  {
    icon: Package,
    label: 'Matériel',
    quote: 'Il manque quoi déjà ?',
    text: 'Mobilier, arches, nappage : liste tout ton matériel par mariage. Quantités, statut, dégâts éventuels et destination au retour.',
    takeaway: 'Avant de partir, tu sais ce qui doit être dans le camion.',
    image: '/landing/materiel.jpg',
    alt: 'La checklist Matériel de SilkyPlace',
  },
  {
    icon: Users,
    label: 'Prestataires',
    quote: 'C’était qui déjà ? Et il arrive à quelle heure ?',
    text: 'Retrouve au même endroit les coordonnées, horaires, coûts et statut de chaque prestataire.',
    takeaway: 'Tu sais qui intervient, quand et où.',
    image: '/landing/prestataires.jpg',
    alt: 'La liste des prestataires d’un mariage dans SilkyPlace',
  },
  {
    icon: Wallet,
    label: 'Finances',
    quote: 'Est-ce que je gagne vraiment de l’argent sur ce mariage ?',
    text: 'Visualise le budget du couple et ta rentabilité côte à côte. Ce qu’il reste à dépenser. Ton profit prévisionnel. Ta marge. Tes devis et factures indicatifs.',
    takeaway: 'Tu ne découvres pas ta rentabilité à la fin du mariage.',
    note: 'Les documents générés sont indicatifs. Vérifie tes obligations légales avant émission.',
    image: '/landing/finances.jpg',
    alt: 'L’onglet Finances de SilkyPlace',
  },
  {
    icon: ClipboardCheck,
    label: 'Bilan',
    quote: 'Qu’est-ce que je dois retenir de ce mariage ?',
    text: 'À la fin de chaque mariage, retrouve au même endroit : le bilan financier, les retours client, les éléments importants, et ton portfolio avant / après.',
    takeaway: 'Chaque mariage terminé devient une information utile pour le suivant.',
    image: '/landing/bilan.jpg',
    alt: 'Le bilan de clôture d’un mariage dans SilkyPlace',
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
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#5F6B4C]">
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
              <div className="flex items-center gap-1.5 border-b border-border px-4 py-3">
                <span className="size-2.5 rounded-full bg-risk/40" aria-hidden="true" />
                <span className="size-2.5 rounded-full bg-warning/40" aria-hidden="true" />
                <span className="size-2.5 rounded-full bg-success/40" aria-hidden="true" />
                <span className="ml-2 text-xs text-muted-foreground">{s.label}</span>
              </div>
              <img src={s.image} alt={s.alt} width={1200} height={800} className="h-64 w-full object-cover object-top sm:h-[26rem]" />

              <div className="flex flex-col gap-2 p-6 sm:p-8">
                <p className="font-heading text-lg italic text-[#5F6B4C] sm:text-xl">« {s.quote} »</p>
                <p className="max-w-xl leading-relaxed text-muted-foreground">{s.text}</p>
                <p className="font-heading text-xl font-semibold text-foreground">{s.takeaway}</p>
                {s.note && <p className="mt-1 text-xs text-muted-foreground">{s.note}</p>}
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
            className={cn('h-1.5 rounded-full transition-all duration-300', activeIndex === i ? 'w-6 bg-[#520C0C]' : 'w-1.5 bg-border')}
          />
        ))}
      </div>
    </div>
  )
}
