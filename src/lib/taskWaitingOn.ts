import type { TaskWaitingOn } from '@/types/entities'

export const TASK_WAITING_ON_LABELS: Record<TaskWaitingOn, string> = {
  client: 'Client',
  prestataire: 'Prestataire',
  paiement: 'Paiement',
  document: 'Document',
  autre: 'Autre',
}

export const TASK_WAITING_ON_OPTIONS: TaskWaitingOn[] = ['client', 'prestataire', 'paiement', 'document', 'autre']
