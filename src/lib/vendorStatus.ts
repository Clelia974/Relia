import type { VendorStatus } from '@/types/entities'

export const VENDOR_STATUS_LABELS: Record<VendorStatus, string> = {
  a_contacter: 'À contacter',
  contacte: 'Contacté',
  devis_recu: 'Devis reçu',
  confirme: 'Confirmé',
  acompte_paye: 'Acompte payé',
  solde_a_payer: 'Solde à payer',
  termine: 'Terminé',
}

export const VENDOR_STATUS_OPTIONS: VendorStatus[] = [
  'a_contacter',
  'contacte',
  'devis_recu',
  'confirme',
  'acompte_paye',
  'solde_a_payer',
  'termine',
]

/** Un prestataire est "confirmé" à partir du moment où l'engagement est acquis — les étapes financières qui suivent restent confirmées. */
export function isVendorConfirmed(status: VendorStatus): boolean {
  return status !== 'a_contacter' && status !== 'contacte' && status !== 'devis_recu'
}
