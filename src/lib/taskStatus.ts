import type { TaskStatus } from '@/types/entities'

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  a_preparer: 'À préparer',
  a_faire: 'À faire',
  en_cours: 'En cours',
  en_attente: 'En attente',
  terminee: 'Terminée',
}

export const TASK_STATUS_OPTIONS: TaskStatus[] = ['a_preparer', 'a_faire', 'en_cours', 'en_attente', 'terminee']

export const KANBAN_COLUMNS: TaskStatus[] = ['a_preparer', 'a_faire', 'en_cours', 'en_attente', 'terminee']
