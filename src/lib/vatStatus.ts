import type { VatStatus } from '@/types/entities'

export const VAT_STATUS_LABELS: Record<VatStatus, string> = {
  franchise_en_base: 'Franchise en base de TVA',
  assujettie: 'Assujettie à la TVA',
  option_volontaire: 'Option volontaire pour la TVA',
  ne_sait_pas_encore: 'TVA non configurée',
}

export const VAT_STATUS_OPTIONS: VatStatus[] = ['franchise_en_base', 'assujettie', 'option_volontaire', 'ne_sait_pas_encore']

/** Seuls ces statuts appliquent réellement un taux — jamais déduit d'une forme juridique. */
export function vatApplies(status: VatStatus): boolean {
  return status === 'assujettie' || status === 'option_volontaire'
}
