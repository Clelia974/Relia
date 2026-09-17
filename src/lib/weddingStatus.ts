import type { WeddingStatus } from '@/types/entities'

export const WEDDING_STATUS_LABELS: Record<WeddingStatus, string> = {
  prospect: 'Prospect',
  devis_envoye: 'Devis envoyé',
  signe: 'Signé',
  en_preparation: 'En préparation',
  semaine_j: 'Semaine J',
  termine: 'Terminé',
  annule: 'Annulé',
}

export const WEDDING_STATUS_OPTIONS: WeddingStatus[] = [
  'prospect',
  'devis_envoye',
  'signe',
  'en_preparation',
  'semaine_j',
  'termine',
  'annule',
]
