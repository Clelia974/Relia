import type { Contract, ContractStatus } from '@/types/entities'

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  a_rediger: 'À rédiger',
  envoye: 'Envoyé au client',
  signe: 'Signé',
}

export const CONTRACT_STATUS_OPTIONS: ContractStatus[] = ['a_rediger', 'envoye', 'signe']

/**
 * Passe le contrat à un nouveau statut en gardant des dates cohérentes : la date d'envoi et la date de
 * signature sont proposées (aujourd'hui) si elles manquent, et une date de signature ne survit jamais à
 * un retour en arrière.
 */
export function applyContractStatus(previous: Contract | undefined, status: ContractStatus, todayIso: string): Contract {
  const notes = previous?.notes
  if (status === 'a_rediger') return { status, notes }
  const sentAt = previous?.sentAt ?? todayIso
  if (status === 'envoye') return { status, sentAt, notes }
  return { status, sentAt, signedAt: previous?.signedAt ?? todayIso, notes }
}
