import { generateId } from '@/lib/id'
import type { ProposalTemplate, ProposalTier } from '@/types/entities'

/**
 * Valeurs de départ des 3 formules de devis — copiées dans le workspace à la
 * création (cf. createDefaultProposalTemplates) puis entièrement
 * personnalisables par l'utilisatrice depuis Paramètres. Ce fichier ne décrit
 * plus que les valeurs par défaut : la source de vérité vivante est
 * workspace.proposalTemplates (cf. src/schemas/workspace.ts).
 */
export const PROPOSAL_TIER_ORDER: ProposalTier[] = ['silver', 'gold', 'platinum']

const DEFAULT_TEMPLATE_DATA: Record<ProposalTier, Omit<ProposalTemplate, 'tier' | 'lines' | 'showOnDocuments'> & { lines: Omit<ProposalTemplate['lines'][number], 'id'>[] }> = {
  silver: {
    label: 'Silver',
    tagline: 'Une formule essentielle pour un mariage élégant et maîtrisé.',
    lines: [
      { description: 'Décoration de la cérémonie', category: 'Décoration', quantity: 1, unitPrice: 450, included: true, optional: false },
      { description: 'Centres de table', category: 'Décoration', quantity: 12, unitPrice: 35, included: true, optional: false },
      { description: 'Arche florale', category: 'Fleurs', quantity: 1, unitPrice: 280, included: true, optional: false },
      { description: 'Mise en place et démontage', category: 'Prestation', quantity: 1, unitPrice: 250, included: true, optional: false },
    ],
  },
  gold: {
    label: 'Gold',
    tagline: 'La formule équilibrée pour une décoration complète et harmonieuse.',
    lines: [
      { description: 'Décoration de la cérémonie et du cocktail', category: 'Décoration', quantity: 1, unitPrice: 650, included: true, optional: false },
      { description: 'Centres de table premium', category: 'Décoration', quantity: 12, unitPrice: 55, included: true, optional: false },
      { description: 'Arche florale et suspensions', category: 'Fleurs', quantity: 1, unitPrice: 480, included: true, optional: false },
      { description: 'Signalétique personnalisée', category: 'Papeterie', quantity: 1, unitPrice: 180, included: true, optional: false },
      { description: 'Coordination le jour J', category: 'Prestation', quantity: 1, unitPrice: 350, included: true, optional: false },
      { description: 'Mise en place et démontage', category: 'Prestation', quantity: 1, unitPrice: 300, included: true, optional: false },
    ],
  },
  platinum: {
    label: 'Platinum',
    tagline: 'Une expérience complète pour une décoration sur mesure.',
    lines: [
      { description: 'Décoration cérémonie, cocktail et dîner', category: 'Décoration', quantity: 1, unitPrice: 1200, included: true, optional: false },
      { description: 'Centres de table haut de gamme', category: 'Décoration', quantity: 14, unitPrice: 75, included: true, optional: false },
      { description: 'Mur de fleurs', category: 'Fleurs', quantity: 1, unitPrice: 650, included: true, optional: false },
      { description: 'Mobilier lounge', category: 'Mobilier', quantity: 1, unitPrice: 800, included: true, optional: false },
      { description: "Éclairage d'ambiance", category: 'Éclairage', quantity: 1, unitPrice: 400, included: true, optional: false },
      { description: 'Coordination complète le jour J', category: 'Prestation', quantity: 1, unitPrice: 600, included: true, optional: false },
      { description: "Feu d'artifice", category: 'Animation', quantity: 1, unitPrice: 500, included: false, optional: true },
    ],
  },
}

/** Copie fraîche des 3 formules par défaut, avec des identifiants de ligne nouvellement générés. */
export function createDefaultProposalTemplates(): ProposalTemplate[] {
  return PROPOSAL_TIER_ORDER.map((tier) => {
    const template = DEFAULT_TEMPLATE_DATA[tier]
    return {
      tier,
      label: template.label,
      tagline: template.tagline,
      showOnDocuments: true,
      lines: template.lines.map((line) => ({ ...line, id: generateId() })),
    }
  })
}

export const PROPOSAL_CATEGORY_SUGGESTIONS = [
  'Décoration',
  'Fleurs',
  'Mobilier',
  'Éclairage',
  'Papeterie',
  'Animation',
  'Prestation',
  'Autre',
]
