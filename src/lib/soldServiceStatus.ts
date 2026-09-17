import type { SoldServiceStatus } from '@/types/entities'

export const SOLD_SERVICE_STATUS_LABELS: Record<SoldServiceStatus, string> = {
  incluse: 'Incluse',
  ajoutee_ulterieurement: 'Ajoutée ultérieurement',
  retiree: 'Retirée',
}

export const SOLD_SERVICE_STATUS_OPTIONS: SoldServiceStatus[] = ['incluse', 'ajoutee_ulterieurement', 'retiree']
