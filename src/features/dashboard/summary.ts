import { addDays, differenceInCalendarDays, startOfDay } from 'date-fns'
import { isDueToday, isOverdue } from '@/features/tasks/summary'
import { getWeddingFinancials } from '@/features/finances/calculations'
import { DEFAULT_MIN_BUFFER_MINUTES, detectTimelineConflicts } from '@/features/timeline/conflicts'
import { selectActiveWeddingIds, selectActiveWeddings } from '@/features/weddings/activeWeddings'
import { getWeddingRiskLevel, type WeddingRiskAssessment } from '@/features/weddings/risk'
import { isVendorConfirmed } from '@/lib/vendorStatus'
import type { ClientDecision, Task, Wedding, Workspace } from '@/types/entities'

/**
 * Fonctions pures de calcul du dashboard "Aujourd'hui" (Phase 7). Toute la
 * logique de résumé vit ici, testable indépendamment des composants React
 * qui ne font que l'afficher.
 */

// ---------- Actions du jour ----------

export interface TodayActions {
  /** Tâches à traiter, déjà triées par priorité d'affichage du dashboard. */
  items: Task[]
  /** Tâches "en attente" — jamais mélangées aux actions à exécuter. */
  waiting: Task[]
}

/**
 * Ordre du dashboard : 1. urgentes en retard, 2. autres tâches en retard
 * (non listées explicitement par le cahier des charges, mais une tâche en
 * retard ne peut pas être passée sous silence sur "que dois-je faire
 * aujourd'hui ?"), 3. urgentes du jour, 4. hautes du jour, 5. normales du
 * jour, 6. urgentes à échéance très proche (J+1 à J+3, pour anticiper).
 * Renvoie null pour une tâche qui ne relève pas des actions du jour.
 */
function actionTier(task: Task, today: Date, soonLimit: Date): number | null {
  if (task.status === 'terminee' || task.status === 'en_attente') return null

  const overdue = isOverdue(task, today)
  const dueToday = isDueToday(task, today)

  if (overdue && task.priority === 'urgente') return 1
  if (overdue) return 2
  if (dueToday && task.priority === 'urgente') return 3
  if (dueToday && task.priority === 'haute') return 4
  if (dueToday) return 5
  if (task.priority === 'urgente' && task.dueDate) {
    const due = new Date(task.dueDate)
    if (due > today && due <= soonLimit) return 6
  }
  return null
}

export function getTodayActions(workspace: Pick<Workspace, 'weddings' | 'tasks'>, today: Date = new Date()): TodayActions {
  const soonLimit = addDays(startOfDay(today), 3)
  const activeWeddingIds = selectActiveWeddingIds(workspace.weddings)
  // Une tâche sans weddingId est une tâche générique, jamais concernée par
  // l'archivage d'un mariage — elle reste toujours conservée.
  const tasks = workspace.tasks.filter((t) => !t.weddingId || activeWeddingIds.has(t.weddingId))

  const items = tasks
    .map((task) => ({ task, tier: actionTier(task, today, soonLimit) }))
    .filter((x): x is { task: Task; tier: number } => x.tier !== null)
    .sort((a, b) => {
      if (a.tier !== b.tier) return a.tier - b.tier
      return (a.task.dueDate ?? '').localeCompare(b.task.dueDate ?? '')
    })
    .map((x) => x.task)

  const waiting = tasks.filter((t) => t.status === 'en_attente')

  return { items, waiting }
}

// ---------- Réponses en attente ----------

export interface PendingResponses {
  tasks: Task[]
  decisions: ClientDecision[]
  total: number
}

export function getPendingResponses(workspace: Pick<Workspace, 'weddings' | 'tasks' | 'clientDecisions'>): PendingResponses {
  const activeWeddingIds = selectActiveWeddingIds(workspace.weddings)
  const tasks = workspace.tasks.filter((t) => t.status === 'en_attente' && (!t.weddingId || activeWeddingIds.has(t.weddingId)))
  // ClientDecision.weddingId est obligatoire dans le schéma : pas de cas générique à préserver ici.
  const decisions = workspace.clientDecisions.filter((d) => d.pending && activeWeddingIds.has(d.weddingId))
  return { tasks, decisions, total: tasks.length + decisions.length }
}

// ---------- Prochains événements ----------

export type UpcomingEntryKind = 'tache' | 'evenement' | 'jour_j'

export interface UpcomingEntry {
  id: string
  /** Date ISO (jour). */
  date: string
  /** Heure HH:MM si connue (moments de planning uniquement). */
  time?: string
  title: string
  weddingId: string
  weddingName: string
  kind: UpcomingEntryKind
}

const DEFAULT_UPCOMING_LIMIT = 6

/** Combine moments de planning, échéances de tâches et jours de mariage à venir, triés par date puis heure. */
export function getUpcomingEvents(
  workspace: Pick<Workspace, 'weddings' | 'timelineEvents' | 'tasks'>,
  today: Date = new Date(),
  limit = DEFAULT_UPCOMING_LIMIT,
): UpcomingEntry[] {
  const start = startOfDay(today)
  const weddingNameById = new Map(selectActiveWeddings(workspace.weddings).map((w) => [w.id, w.coupleName]))
  const entries: UpcomingEntry[] = []

  for (const event of workspace.timelineEvents) {
    if (new Date(event.date) < start) continue
    const weddingName = weddingNameById.get(event.weddingId)
    if (!weddingName) continue
    entries.push({
      id: `evenement:${event.id}`,
      date: event.date,
      time: event.startTime,
      title: event.title,
      weddingId: event.weddingId,
      weddingName,
      kind: 'evenement',
    })
  }

  for (const task of workspace.tasks) {
    if (task.status === 'terminee' || !task.dueDate || !task.weddingId) continue
    if (new Date(task.dueDate) < start) continue
    const weddingName = weddingNameById.get(task.weddingId)
    if (!weddingName) continue
    entries.push({
      id: `tache:${task.id}`,
      date: task.dueDate,
      title: task.title,
      weddingId: task.weddingId,
      weddingName,
      kind: 'tache',
    })
  }

  for (const wedding of workspace.weddings) {
    if (wedding.archived || new Date(wedding.date) < start) continue
    entries.push({
      id: `jourj:${wedding.id}`,
      date: wedding.date,
      title: 'Jour du mariage',
      weddingId: wedding.id,
      weddingName: wedding.coupleName,
      kind: 'jour_j',
    })
  }

  return entries
    .sort((a, b) => {
      const dateKeyA = a.date.slice(0, 10)
      const dateKeyB = b.date.slice(0, 10)
      if (dateKeyA !== dateKeyB) return dateKeyA.localeCompare(dateKeyB)
      // Dans une même journée : le jour J en tête, puis les moments avec heure dans l'ordre, puis les tâches (sans heure) en dernier.
      const timeKeyA = a.time ?? (a.kind === 'jour_j' ? '00:00' : '24:00')
      const timeKeyB = b.time ?? (b.kind === 'jour_j' ? '00:00' : '24:00')
      return timeKeyA.localeCompare(timeKeyB)
    })
    .slice(0, limit)
}

// ---------- Mariages à surveiller ----------

export interface WeddingRiskEntry extends WeddingRiskAssessment {
  wedding: Wedding
}

const RISK_LEVEL_RANK: Record<WeddingRiskAssessment['level'], number> = {
  critique: 0,
  eleve: 1,
  a_surveiller: 2,
  faible: 3,
}

/** Risque de tous les mariages actifs, triés du plus critique au plus calme. */
export function getWeddingRisks(
  workspace: Pick<Workspace, 'weddings' | 'vendors' | 'tasks' | 'clientDecisions' | 'timelineEvents' | 'ignoredConflictIds'>,
  today: Date = new Date(),
): WeddingRiskEntry[] {
  return workspace.weddings
    .filter((w) => !w.archived)
    .map((wedding) => {
      const assessment = getWeddingRiskLevel(wedding, workspace, today)
      return assessment ? { wedding, ...assessment } : null
    })
    .filter((entry): entry is WeddingRiskEntry => entry !== null)
    .sort((a, b) => RISK_LEVEL_RANK[a.level] - RISK_LEVEL_RANK[b.level] || a.daysUntil - b.daysUntil)
}

// ---------- Alertes et blocages ----------

export type DashboardAlertKind =
  | 'conflit_critique'
  | 'buffer_insuffisant'
  | 'prestataire_non_confirme'
  | 'tache_en_retard'
  | 'decision_en_attente'
  | 'horaire_manquant'
  | 'cout_manquant'

export interface DashboardAlert {
  id: string
  kind: DashboardAlertKind
  weddingId: string
  weddingName: string
  title: string
  detail?: string
  actionLabel: 'Ouvrir' | 'Relancer' | 'Modifier'
  href: string
  /** Présent uniquement pour les alertes de conflit — permet le bouton "Ignorer". */
  conflictId?: string
}

const ALERT_KIND_RANK: Record<DashboardAlertKind, number> = {
  conflit_critique: 0,
  tache_en_retard: 1,
  prestataire_non_confirme: 2,
  buffer_insuffisant: 3,
  decision_en_attente: 4,
  horaire_manquant: 5,
  cout_manquant: 6,
}

const VENDOR_PROXIMITY_LIMIT_DAYS = 14
const COST_PROXIMITY_LIMIT_DAYS = 45

/**
 * Éléments qui nécessitent une action, tous mariages actifs confondus. Ne
 * remonte jamais un conflit ignoré (cf. workspace.ignoredConflictIds).
 */
export function getDashboardAlerts(
  workspace: Pick<Workspace, 'weddings' | 'vendors' | 'tasks' | 'timelineEvents' | 'ignoredConflictIds' | 'clientDecisions' | 'vendorWeddingLinks'>,
  today: Date = new Date(),
): DashboardAlert[] {
  const alerts: DashboardAlert[] = []

  for (const wedding of workspace.weddings.filter((w) => !w.archived)) {
    const daysUntil = differenceInCalendarDays(new Date(wedding.date), today)
    if (daysUntil < 0) continue

    const vendors = workspace.vendors.filter((v) => v.weddingIds.includes(wedding.id))
    const tasks = workspace.tasks.filter((t) => t.weddingId === wedding.id)
    const events = workspace.timelineEvents.filter((e) => e.weddingId === wedding.id)
    const minBuffer = wedding.minBufferMinutes ?? DEFAULT_MIN_BUFFER_MINUTES
    const conflicts = detectTimelineConflicts(events, {
      minBufferMinutes: minBuffer,
      ignoredConflictIds: workspace.ignoredConflictIds,
    }).filter((c) => !c.ignored)

    for (const conflict of conflicts) {
      if (conflict.severity !== 'critical' && conflict.type !== 'buffer_insuffisant') continue
      alerts.push({
        id: `conflit:${conflict.id}`,
        kind: conflict.severity === 'critical' ? 'conflit_critique' : 'buffer_insuffisant',
        weddingId: wedding.id,
        weddingName: wedding.coupleName,
        title: conflict.message,
        actionLabel: 'Ouvrir',
        href: `/mariages/${wedding.id}/planning`,
        conflictId: conflict.id,
      })
    }

    if (daysUntil <= VENDOR_PROXIMITY_LIMIT_DAYS) {
      for (const vendor of vendors.filter((v) => !isVendorConfirmed(v.status))) {
        alerts.push({
          id: `prestataire:${vendor.id}`,
          kind: 'prestataire_non_confirme',
          weddingId: wedding.id,
          weddingName: wedding.coupleName,
          title: `${vendor.name} n'est pas encore confirmé.`,
          detail: `${wedding.coupleName} · dans ${daysUntil} j`,
          actionLabel: 'Relancer',
          href: `/mariages/${wedding.id}/prestataires`,
        })
      }

      for (const vendor of vendors.filter((v) => isVendorConfirmed(v.status) && !v.arrivalTime)) {
        alerts.push({
          id: `horaire:${vendor.id}`,
          kind: 'horaire_manquant',
          weddingId: wedding.id,
          weddingName: wedding.coupleName,
          title: `Heure d'arrivée manquante pour ${vendor.name}.`,
          detail: `${wedding.coupleName} · dans ${daysUntil} j`,
          actionLabel: 'Modifier',
          href: `/mariages/${wedding.id}/prestataires`,
        })
      }
    }

    for (const task of tasks.filter((t) => isOverdue(t, today))) {
      alerts.push({
        id: `tache:${task.id}`,
        kind: 'tache_en_retard',
        weddingId: wedding.id,
        weddingName: wedding.coupleName,
        title: task.title,
        detail: `${wedding.coupleName} · en retard`,
        actionLabel: 'Ouvrir',
        href: `/mariages/${wedding.id}/taches`,
      })
    }

    for (const decision of workspace.clientDecisions.filter((d) => d.weddingId === wedding.id && d.pending)) {
      alerts.push({
        id: `decision:${decision.id}`,
        kind: 'decision_en_attente',
        weddingId: wedding.id,
        weddingName: wedding.coupleName,
        title: decision.subject,
        detail: `${wedding.coupleName} · réponse client en attente`,
        actionLabel: 'Relancer',
        href: `/mariages/${wedding.id}`,
      })
    }

    if (wedding.soldAmount > 0 && daysUntil <= COST_PROXIMITY_LIMIT_DAYS) {
      const weddingLinks = workspace.vendorWeddingLinks.filter((l) => l.weddingId === wedding.id)
      const linkedVendorIds = new Set(
        weddingLinks.filter((l) => l.estimatedCost !== undefined || l.actualCost !== undefined).map((l) => l.vendorId),
      )
      const missingCost = vendors.filter((v) => !linkedVendorIds.has(v.id))
      if (missingCost.length > 0) {
        alerts.push({
          id: `cout:${wedding.id}`,
          kind: 'cout_manquant',
          weddingId: wedding.id,
          weddingName: wedding.coupleName,
          title: `${missingCost.length} prestataire${missingCost.length > 1 ? 's' : ''} sans coût renseigné.`,
          detail: wedding.coupleName,
          actionLabel: 'Modifier',
          href: `/mariages/${wedding.id}/prestataires`,
        })
      }
    }
  }

  return alerts.sort((a, b) => ALERT_KIND_RANK[a.kind] - ALERT_KIND_RANK[b.kind])
}

// ---------- Rentabilité ----------

export interface ProfitOverviewData {
  hasData: boolean
  weddingCount: number
  lowMarginWeddingCount: number
  averageMarginPct: number
  approvedRevenue: number
  unbilledScopeCreep: number
  missingVendorCostCount: number
}

/**
 * Résumé de rentabilité, tous mariages actifs confondus. Ne calcule une
 * marge moyenne que sur les mariages "calculables" (montant vendu ET au
 * moins un coût renseignés) — jamais un chiffre inventé pour un mariage sans
 * données. Cf. src/features/finances/calculations.ts pour le détail par mariage.
 */
export function getProfitOverview(
  workspace: Pick<Workspace, 'weddings' | 'vendors' | 'vendorWeddingLinks' | 'expenses' | 'scopeChanges'>,
): ProfitOverviewData {
  const weddings = workspace.weddings.filter((w) => !w.archived)
  const financials = weddings.map((wedding) => {
    const vendors = workspace.vendors.filter((v) => v.weddingIds.includes(wedding.id))
    const vendorLinks = workspace.vendorWeddingLinks.filter((l) => l.weddingId === wedding.id)
    const expenses = workspace.expenses.filter((e) => e.weddingId === wedding.id)
    const scopeChanges = workspace.scopeChanges.filter((sc) => sc.weddingId === wedding.id)
    return getWeddingFinancials(wedding, vendors, vendorLinks, expenses, scopeChanges)
  })

  const calculable = financials.filter((f) => f.marginStatus !== null)
  const averageMarginPct = calculable.length > 0 ? calculable.reduce((sum, f) => sum + f.marginPct, 0) / calculable.length : 0

  return {
    hasData: calculable.length > 0,
    weddingCount: weddings.length,
    lowMarginWeddingCount: calculable.filter((f) => f.marginStatus === 'faible' || f.marginStatus === 'critique').length,
    averageMarginPct,
    approvedRevenue: financials.reduce((sum, f) => sum + f.approvedRevenue, 0),
    unbilledScopeCreep: financials.reduce((sum, f) => sum + f.scopeChangeUnbilledTotal, 0),
    missingVendorCostCount: financials.reduce((sum, f) => sum + f.missingVendorCostCount, 0),
  }
}

// ---------- Résumé global (indicateurs du dashboard) ----------

export interface DashboardSummary {
  hasAnyWedding: boolean
  todayActionsCount: number
  pendingResponsesCount: number
  planningAlertsCount: number
  watchedWeddingsCount: number
}

export function getDashboardSummary(
  workspace: Pick<
    Workspace,
    'weddings' | 'tasks' | 'clientDecisions' | 'vendors' | 'timelineEvents' | 'ignoredConflictIds' | 'vendorWeddingLinks'
  >,
  today: Date = new Date(),
): DashboardSummary {
  const activeWeddings = workspace.weddings.filter((w) => !w.archived)
  const { items } = getTodayActions(workspace, today)
  const pending = getPendingResponses(workspace)
  const alerts = getDashboardAlerts(workspace, today)
  const risks = getWeddingRisks(workspace, today)

  return {
    hasAnyWedding: activeWeddings.length > 0,
    todayActionsCount: items.length,
    pendingResponsesCount: pending.total,
    planningAlertsCount: alerts.filter((a) => a.kind === 'conflit_critique' || a.kind === 'buffer_insuffisant').length,
    watchedWeddingsCount: risks.filter((r) => r.level !== 'faible').length,
  }
}
