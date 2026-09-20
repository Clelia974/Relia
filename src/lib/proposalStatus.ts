import type { ProposalStatus } from '@/types/entities'

export const PROPOSAL_STATUS_LABELS: Record<ProposalStatus, string> = {
  brouillon: 'Brouillon',
  a_envoyer: 'À envoyer',
  envoyee: 'Envoyée',
  en_attente_approbation: "En attente d'approbation",
  approuvee: 'Approuvée',
  rejetee: 'Rejetée',
  expiree: 'Expirée',
}

export const PROPOSAL_STATUS_OPTIONS: ProposalStatus[] = [
  'brouillon',
  'a_envoyer',
  'envoyee',
  'en_attente_approbation',
  'approuvee',
  'rejetee',
  'expiree',
]

/**
 * Statuts encore modifiables directement — une fois envoyée ou tranchée
 * (envoyée/en attente/approuvée/rejetée/expirée), la proposition s'ouvre en
 * lecture seule (cf. ProposalBuilderPage) : la corriger passe par "Dupliquer"
 * (nouvelle version en brouillon), jamais une édition de contenu en place.
 */
export const EDITABLE_PROPOSAL_STATUSES: ProposalStatus[] = ['brouillon', 'a_envoyer']

export function isProposalEditable(status: ProposalStatus): boolean {
  return EDITABLE_PROPOSAL_STATUSES.includes(status)
}

/**
 * Statuts finaux — plus aucun changement de statut n'est permis une fois
 * atteints (Phase 2b) : approuvée, rejetée et expirée sont des issues
 * définitives. envoyée / en_attente_approbation restent non éditables
 * (cf. isProposalEditable) mais peuvent encore changer de statut librement
 * (ex. envoyee → approuvee), exactement comme avant cette phase. Seule une
 * nouvelle version (dupliquer) peut corriger une proposition à statut final.
 */
export const FINAL_PROPOSAL_STATUSES: ProposalStatus[] = ['approuvee', 'rejetee', 'expiree']

export function isProposalStatusLocked(status: ProposalStatus): boolean {
  return FINAL_PROPOSAL_STATUSES.includes(status)
}
