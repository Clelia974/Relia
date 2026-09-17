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
