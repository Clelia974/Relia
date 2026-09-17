import { differenceInCalendarDays } from 'date-fns'
import { isOverdue } from '@/features/tasks/summary'
import { DEFAULT_MIN_BUFFER_MINUTES, detectTimelineConflicts } from '@/features/timeline/conflicts'
import { isVendorConfirmed } from '@/lib/vendorStatus'
import type { Wedding, Workspace } from '@/types/entities'

export type WeddingRiskLevel = 'faible' | 'a_surveiller' | 'eleve' | 'critique'

export const WEDDING_RISK_LEVEL_LABELS: Record<WeddingRiskLevel, string> = {
  faible: 'Risque faible',
  a_surveiller: 'À surveiller',
  eleve: 'Risque élevé',
  critique: 'Risque critique',
}

export interface WeddingRiskAssessment {
  level: WeddingRiskLevel
  daysUntil: number
  vendorsConfirmed: number
  vendorsTotal: number
  urgentTaskCount: number
  overdueTaskCount: number
  conflictCount: number
  pendingDecisionCount: number
}

/**
 * Heuristique de risque (Phase 7) combinant la proximité du mariage, les
 * prestataires non confirmés, les tâches urgentes ou en retard, les conflits
 * de planning actifs (non ignorés) et les décisions client en attente. Les
 * seuils de proximité amplifient l'impact d'un prestataire non confirmé à
 * mesure que le jour J approche : un prestataire non confirmé à J-90 n'est
 * pas encore un problème, à J-3 il l'est. Retourne null pour un mariage déjà
 * passé — rien à surveiller.
 */
export function getWeddingRiskLevel(wedding: Wedding, workspace: Workspace, today: Date = new Date()): WeddingRiskAssessment | null {
  const daysUntil = differenceInCalendarDays(new Date(wedding.date), today)
  if (daysUntil < 0) return null

  const vendors = workspace.vendors.filter((v) => v.weddingIds.includes(wedding.id))
  const vendorsTotal = vendors.length
  const vendorsConfirmed = vendors.filter((v) => isVendorConfirmed(v.status)).length
  const vendorsUnconfirmed = vendorsTotal - vendorsConfirmed

  const tasks = workspace.tasks.filter((t) => t.weddingId === wedding.id)
  const urgentTaskCount = tasks.filter((t) => t.priority === 'urgente' && t.status !== 'terminee' && t.status !== 'en_attente').length
  const overdueTaskCount = tasks.filter((t) => isOverdue(t, today)).length

  const pendingDecisionCount = workspace.clientDecisions.filter((d) => d.weddingId === wedding.id && d.pending).length

  const events = workspace.timelineEvents.filter((e) => e.weddingId === wedding.id)
  const minBuffer = wedding.minBufferMinutes ?? DEFAULT_MIN_BUFFER_MINUTES
  const conflicts = detectTimelineConflicts(events, {
    minBufferMinutes: minBuffer,
    ignoredConflictIds: workspace.ignoredConflictIds,
  }).filter((c) => !c.ignored)
  const criticalConflictCount = conflicts.filter((c) => c.severity === 'critical').length
  const conflictCount = conflicts.length

  let level: WeddingRiskLevel
  if ((daysUntil <= 3 && (criticalConflictCount > 0 || overdueTaskCount > 0)) || (daysUntil <= 1 && vendorsUnconfirmed > 0)) {
    level = 'critique'
  } else if (criticalConflictCount > 0 || (daysUntil <= 7 && vendorsUnconfirmed > 0) || overdueTaskCount > 0 || urgentTaskCount >= 2) {
    level = 'eleve'
  } else if (conflictCount > 0 || pendingDecisionCount > 0 || urgentTaskCount >= 1 || (daysUntil <= 45 && vendorsUnconfirmed > 0)) {
    level = 'a_surveiller'
  } else {
    level = 'faible'
  }

  return { level, daysUntil, vendorsConfirmed, vendorsTotal, urgentTaskCount, overdueTaskCount, conflictCount, pendingDecisionCount }
}
