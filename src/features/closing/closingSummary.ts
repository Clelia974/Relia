import { getWeddingFinancials } from '@/features/finances/calculations'
import type {
  ClosingSession,
  ClosingSessionSummary,
  EquipmentItem,
  Expense,
  ScopeChange,
  Task,
  Vendor,
  VendorWeddingLink,
  Wedding,
} from '@/types/entities'

/**
 * Bilan de clôture pour UN mariage — figé au moment de l'appel, jamais
 * recalculé après coup (cf. ClosingSessionSummarySchema). Réutilise
 * getWeddingFinancials (Phase 8) plutôt que d'inventer un second modèle
 * budget/réel : les mêmes chiffres qu'affiche l'onglet Finances.
 * `tasks`/`items`/`vendors`/`vendorLinks`/`expenses`/`scopeChanges` doivent
 * déjà être filtrés par l'appelant sur CE mariage.
 */
export function computeClosingSummary(
  wedding: Wedding,
  tasks: Task[],
  items: EquipmentItem[],
  vendors: Vendor[],
  vendorLinks: VendorWeddingLink[],
  expenses: Expense[],
  scopeChanges: ScopeChange[],
): ClosingSessionSummary {
  const financials = getWeddingFinancials(wedding, vendors, vendorLinks, expenses, scopeChanges)

  return {
    completedTasks: tasks.filter((t) => t.status === 'terminee').length,
    totalTasks: tasks.length,
    recoveredEquipment: items.filter((e) => e.status === 'recupere').length,
    totalEquipment: items.length,
    damagedEquipment: items.filter((e) => e.isDamaged).length,
    pendingEquipment: items.filter((e) => e.status !== 'recupere').length,
    approvedRevenue: financials.approvedRevenue,
    totalCosts: financials.totalCosts,
    profit: financials.profit,
    marginPct: financials.marginPct,
  }
}

export interface ClosingReport {
  wedding: {
    coupleName: string
    date: string
    venue: string
    status: Wedding['status']
  }
  closing: {
    closingDate: string
    clientFeedback?: string
    clientRating?: number
    portfolioImageCount: number
    summary: ClosingSessionSummary
  }
  tasks: {
    total: number
    completed: number
    pending: { title: string; dueDate?: string; vendorName?: string }[]
  }
  equipment: {
    total: number
    recovered: number
    damaged: number
    pending: number
    byZone: Record<
      string,
      { name: string; quantity: number; status: EquipmentItem['status']; damaged: boolean; destination?: EquipmentItem['destination'] }[]
    >
  }
  financials: {
    approvedRevenue: number
    totalCosts: number
    profit: number
    marginPct: number
  }
  exportedAt: string
}

/**
 * Rapport archivable complet (export JSON, cf. ClosingActions) — pur et
 * testable indépendamment du store. `tasks`/`items` doivent déjà être
 * filtrés sur CE mariage ; `vendorById` sert uniquement à afficher un nom
 * lisible sur les tâches en attente.
 */
export function buildClosingReport(
  wedding: Wedding,
  closing: ClosingSession,
  tasks: Task[],
  items: EquipmentItem[],
  vendorById: Map<string, Vendor>,
): ClosingReport {
  const byZone: ClosingReport['equipment']['byZone'] = {}
  for (const item of items) {
    const zone = item.category ?? 'Non classé'
    if (!byZone[zone]) byZone[zone] = []
    byZone[zone].push({
      name: item.name,
      quantity: item.quantity,
      status: item.status,
      damaged: item.isDamaged ?? false,
      destination: item.destination,
    })
  }

  return {
    wedding: {
      coupleName: wedding.coupleName,
      date: wedding.date,
      venue: wedding.venue,
      status: wedding.status,
    },
    closing: {
      closingDate: closing.closingDate,
      clientFeedback: closing.clientFeedback,
      clientRating: closing.clientRating,
      portfolioImageCount: closing.portfolioImages.length,
      summary: closing.summary,
    },
    tasks: {
      total: tasks.length,
      completed: tasks.filter((t) => t.status === 'terminee').length,
      pending: tasks
        .filter((t) => t.status !== 'terminee')
        .map((t) => ({ title: t.title, dueDate: t.dueDate, vendorName: t.vendorId ? vendorById.get(t.vendorId)?.name : undefined })),
    },
    equipment: {
      total: items.length,
      recovered: items.filter((e) => e.status === 'recupere').length,
      damaged: items.filter((e) => e.isDamaged).length,
      pending: items.filter((e) => e.status !== 'recupere').length,
      byZone,
    },
    financials: {
      approvedRevenue: closing.summary.approvedRevenue,
      totalCosts: closing.summary.totalCosts,
      profit: closing.summary.profit,
      marginPct: closing.summary.marginPct,
    },
    exportedAt: new Date().toISOString(),
  }
}
