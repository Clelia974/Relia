import type { WeddingStatus } from '@/types/entities'

export const WEDDING_STATUS_LABELS: Record<WeddingStatus, string> = {
  prospect: 'Prospect',
  repondu: 'Répondu',
  en_attente_reponse: 'En attente de réponse',
  devis_envoye: 'Devis envoyé',
  signe: 'Signé',
  en_preparation: 'En préparation',
  semaine_j: 'Semaine J',
  termine: 'Terminé',
  annule: 'Annulé',
}

export const WEDDING_STATUS_OPTIONS: WeddingStatus[] = [
  'prospect',
  'repondu',
  'en_attente_reponse',
  'devis_envoye',
  'signe',
  'en_preparation',
  'semaine_j',
  'termine',
  'annule',
]

/** Statuts qui comptent dans la limite de 3 mariages de la version Gratuite — un simple prospect ou un devis en cours ne consomment pas la limite, seul un mariage réellement engagé (signé ou au-delà) compte. */
export const WEDDING_STATUSES_COUNTED_FOR_LIMIT = new Set<WeddingStatus>([
  'signe',
  'en_preparation',
  'semaine_j',
  'termine',
])
