import type { Task } from '@/types/entities'

const RELANCE_DEVIS_DAYS = 5

/**
 * La tâche de relance d'un devis — partagée entre "Demandes reçues" (raccourci
 * direct) et l'éditeur de devis lui-même (bouton "Marquer comme envoyé"),
 * jamais dupliquée : mêmes 5 jours, même titre.
 */
export function scheduleDevisRelance(
  addTask: (input: { title: string; dueDate?: string; source?: 'manual' | 'automatic'; leadId?: string }) => string,
  lead: { id: string; client_name: string },
): void {
  const dueDate = new Date(Date.now() + RELANCE_DEVIS_DAYS * 24 * 60 * 60 * 1000).toISOString()
  addTask({ title: `Relancer le devis — ${lead.client_name}`, dueDate, source: 'automatic', leadId: lead.id })
}

/** Retire la relance en cours pour une demande — plus utile une fois signée ou écartée. */
export function clearLeadRelance(tasks: Task[], deleteTask: (id: string) => void, leadId: string): void {
  for (const task of tasks) {
    if (task.leadId === leadId && task.status !== 'terminee') deleteTask(task.id)
  }
}
