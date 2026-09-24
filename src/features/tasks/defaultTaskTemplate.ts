import { addDays } from 'date-fns'
import { generateId } from '@/lib/id'
import type { TaskTemplateItem } from '@/types/entities'

/**
 * Checklist de départ, générée à la création d'un mariage à partir de sa
 * date — un point de repère pour démarrer, pas un plan figé : chaque tâche
 * reste modifiable ou supprimable comme n'importe quelle autre (cf. badge
 * "Automatique" sur TaskCard, même mécanisme que les tâches de confirmation
 * prestataire de WeddingVendorsTab). Paramétrable depuis Paramètres
 * (workspace.taskTemplate) — ces valeurs ne sont que le point de départ,
 * copié à la création du workspace (cf. createDefaultProposalTemplates,
 * même principe).
 */
const DEFAULT_TASK_TEMPLATE_DATA: Omit<TaskTemplateItem, 'id'>[] = [
  { title: 'Confirmer tous les prestataires', dayOffset: -90 },
  { title: 'Finaliser le devis et le budget', dayOffset: -60 },
  { title: 'Envoyer le plan de table et les dernières informations aux prestataires', dayOffset: -30 },
  { title: 'Préparer la checklist matériel', dayOffset: -14 },
  { title: 'Vérifier les derniers ajustements du planning du Jour J', dayOffset: -7 },
  { title: 'Imprimer ou exporter le déroulé du Jour J', dayOffset: -1 },
  { title: 'Faire le bilan de clôture du mariage', dayOffset: 7 },
]

/** Copie fraîche du modèle par défaut, avec des identifiants nouvellement générés. */
export function createDefaultTaskTemplate(): TaskTemplateItem[] {
  return DEFAULT_TASK_TEMPLATE_DATA.map((item) => ({ ...item, id: generateId() }))
}

/** `weddingDate` au format ISO (cf. Wedding.date) — les échéances en résultent, jamais recalculées après coup si la date du mariage change. */
export function buildDefaultTasksForWedding(weddingId: string, weddingDate: string, template: TaskTemplateItem[]) {
  const base = new Date(weddingDate)
  return template.map((item) => ({
    title: item.title,
    weddingId,
    dueDate: addDays(base, item.dayOffset).toISOString(),
    source: 'automatic' as const,
  }))
}
