import type { ScopeChangeStatus } from '@/types/entities'

export const SCOPE_CHANGE_STATUS_LABELS: Record<ScopeChangeStatus, string> = {
  proposee: 'Proposée',
  a_envoyer: 'À envoyer',
  en_attente_approbation: "En attente d'approbation",
  approuvee: 'Approuvée',
  rejetee: 'Rejetée',
  realisee: 'Réalisée',
}

export const SCOPE_CHANGE_STATUS_OPTIONS: ScopeChangeStatus[] = [
  'proposee',
  'a_envoyer',
  'en_attente_approbation',
  'approuvee',
  'rejetee',
  'realisee',
]

/** Statuts qui comptent dans les chiffres officiels — cf. src/features/finances/calculations.ts. */
export function isScopeChangeBillable(status: ScopeChangeStatus): boolean {
  return status === 'approuvee' || status === 'realisee'
}
