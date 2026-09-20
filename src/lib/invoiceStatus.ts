import type { InvoiceStatus } from '@/types/entities'

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  brouillon: 'Brouillon',
  finalisee: 'Finalisée',
}

export const INVOICE_STATUS_OPTIONS: InvoiceStatus[] = ['brouillon', 'finalisee']

/** Modifiable uniquement au statut brouillon — finalisee est verrouillée pour toujours (cf. Phase 2b). */
export function isInvoiceEditable(status: InvoiceStatus): boolean {
  return status === 'brouillon'
}

/** Une fois finalisee, plus aucun changement de statut n'est permis — seule une nouvelle version (dupliquer) peut corriger la facture. */
export function isInvoiceStatusLocked(status: InvoiceStatus): boolean {
  return status === 'finalisee'
}
