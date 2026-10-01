import { useState } from 'react'
import {
  Armchair,
  ClipboardCheck,
  Clock,
  Eye,
  FileSpreadsheet,
  FileText,
  Images,
  LayoutGrid,
  type LucideIcon,
  Package,
  PackageCheck,
  Palette,
  Users,
  Wallet,
} from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface FeatureCard {
  icon: LucideIcon
  title: string
  /** La question que se pose la décoratrice. */
  quote: string
  /** La conclusion en une ligne. */
  takeaway: string
  /** Capture réelle de l'app (1200×800), montrée en grand au clic. */
  image: string
  alt: string
}

/**
 * Grille « tout ce qu'il te faut », à la manière de Wedli : une carte par
 * fonctionnalité, avec le vocabulaire du métier (installation,
 * désinstallation, chargement, formules déco…). Un clic ouvre la capture
 * réelle de l'écran correspondant — remplace l'ancien carrousel.
 */
const CARDS: FeatureCard[] = [
  {
    icon: Clock,
    title: 'Installation et Jour J',
    quote: 'Qui doit être où, et à quelle heure ?',
    takeaway: 'Installation, cérémonie, réception, démontage : ton déroulé minute par minute.',
    image: '/landing/jour-j.jpg',
    alt: 'Le déroulé du Jour J dans SilkyPlace, avec les alertes de marge entre deux moments',
  },
  {
    icon: Package,
    title: 'Matériel et chargement',
    quote: 'Il manque quoi déjà ?',
    takeaway: 'Mobilier, arches, nappage : avant de partir, tu sais ce qui doit être dans le camion.',
    image: '/landing/materiel.jpg',
    alt: 'La checklist Matériel d’un mariage dans SilkyPlace',
  },
  {
    icon: PackageCheck,
    title: 'Désinstallation et retour',
    quote: 'Tout est bien revenu ?',
    takeaway: 'Récupéré, abîmé ou à rendre au loueur : zone par zone, rien ne se perd.',
    image: '/landing/desinstallation.jpg',
    alt: 'Le suivi de désinstallation dans SilkyPlace, matériel récupéré zone par zone',
  },
  {
    icon: Users,
    title: 'Prestataires',
    quote: 'C’était qui déjà ? Et il arrive à quelle heure ?',
    takeaway: 'Fleuriste, loueur, traiteur : coordonnées, horaires et coûts au même endroit.',
    image: '/landing/prestataires.jpg',
    alt: 'La liste des prestataires d’un mariage dans SilkyPlace',
  },
  {
    icon: FileText,
    title: 'Devis et formules déco',
    quote: 'Combien pour l’arche et les centres de table ?',
    takeaway: 'Tes formules de décoration en devis, puis en factures, sans tout ressaisir.',
    image: '/landing/devis.jpg',
    alt: 'Un devis de décoration de mariage dans SilkyPlace',
  },
  {
    icon: Palette,
    title: 'Moodboard et ambiance',
    quote: 'On avait dit quelles couleurs, déjà ?',
    takeaway: 'Palette, matières et photos d’inspiration sur un moodboard libre, à envoyer aux mariés en PDF.',
    image: '/landing/moodboard.jpg',
    alt: 'Un moodboard de mariage dans SilkyPlace, avec photos d’inspiration, couleur et matière',
  },
  {
    icon: LayoutGrid,
    title: 'Plan de salle',
    quote: 'La piste tient à côté du bar ?',
    takeaway: 'Tu redessines la salle, même biscornue, et tu poses tables, piste et bar où tu veux.',
    image: '/landing/plan-salle.jpg',
    alt: 'Le plan de salle d’un mariage dans SilkyPlace, avec les murs, les tables et la piste de danse',
  },
  {
    icon: Armchair,
    title: 'Plan de table',
    quote: 'Mamie Jeanne, elle est à quelle table ?',
    takeaway: 'Chaque invité à sa place d’un glisser-déposer, et la liste par table prête à imprimer.',
    image: '/landing/plan-table.jpg',
    alt: 'Le placement des invités dans SilkyPlace, avec la liste des invités et les places autour des tables',
  },
  {
    icon: ClipboardCheck,
    title: 'Tâches de préparation',
    quote: 'Qu’est-ce que je dois faire aujourd’hui ?',
    takeaway: 'Chaque matin, tu sais ce qui mérite ton attention.',
    image: '/landing/tableau-de-bord.jpg',
    alt: 'Le tableau de bord du jour dans SilkyPlace, avec les tâches et les mariages à risque',
  },
  {
    icon: Wallet,
    title: 'Rentabilité',
    quote: 'Est-ce que je gagne vraiment de l’argent sur ce mariage ?',
    takeaway: 'Tu ne découvres pas ta marge à la fin du mariage.',
    image: '/landing/finances.jpg',
    alt: 'L’onglet Finances d’un mariage dans SilkyPlace, budget et rentabilité',
  },
  {
    icon: FileSpreadsheet,
    title: 'Import Excel',
    quote: 'Tout est déjà dans mon Excel ?',
    takeaway: 'Tu continues là où tu t’es arrêtée, sans tout ressaisir.',
    image: '/landing/import.jpg',
    alt: 'L’aperçu d’un import de mariage et de prestataire depuis un fichier Excel dans SilkyPlace',
  },
  {
    icon: Images,
    title: 'Bilan et portfolio',
    quote: 'Qu’est-ce que je retiens de ce mariage ?',
    takeaway: 'Bilan financier, retours client et ton portfolio avant / après.',
    image: '/landing/bilan.jpg',
    alt: 'Le bilan de clôture d’un mariage dans SilkyPlace',
  },
]

/** Teintes de marque en alternance pour les pastilles d'icône — bleu pâle, sauge, bordeaux très léger. */
const TILE_TONES = [
  'bg-[#DDE6EF] text-[#520C0C]',
  'bg-[#A9B08F]/25 text-[#5F6B4C]',
  'bg-[#520C0C]/[0.07] text-[#520C0C]',
]

export function FeatureCardsGrid() {
  const [open, setOpen] = useState<FeatureCard | null>(null)

  return (
    <div className="flex flex-col gap-5">
      <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((card, i) => {
          const Icon = card.icon
          return (
            <li key={card.title}>
              <button
                type="button"
                onClick={() => setOpen(card)}
                className="group flex h-full w-full flex-col gap-3 rounded-2xl border border-border bg-card p-7 text-left shadow-(--shadow-card) transition-all hover:-translate-y-0.5 hover:shadow-(--shadow-raised) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#520C0C]"
              >
                <span className={cn('flex size-11 items-center justify-center rounded-xl', TILE_TONES[i % TILE_TONES.length])}>
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span className="mt-1 font-heading text-lg font-semibold text-foreground">{card.title}</span>
                <span className="text-sm italic text-[#5F6B4C]">« {card.quote} »</span>
                <span className="text-sm leading-relaxed text-muted-foreground">{card.takeaway}</span>
                <span className="mt-auto inline-flex items-center gap-1.5 pt-2 text-sm font-medium text-[#520C0C] opacity-70 transition-opacity group-hover:opacity-100">
                  <Eye className="size-4" aria-hidden="true" />
                  Voir l’écran
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      <Dialog open={open !== null} onOpenChange={(isOpen) => !isOpen && setOpen(null)}>
        <DialogContent className="gap-5 p-5 sm:max-w-5xl sm:p-6">
          {open && (
            <>
              <div>
                <DialogTitle className="font-heading text-xl font-semibold text-foreground">{open.title}</DialogTitle>
                <DialogDescription className="mt-1 text-muted-foreground">{open.takeaway}</DialogDescription>
              </div>
              <img
                src={open.image}
                alt={open.alt}
                width={1200}
                height={800}
                className="h-auto w-full rounded-xl border border-border"
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
