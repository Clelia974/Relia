import type { Expense, ExpenseCategory, Vendor, VendorWeddingLink, Wedding } from '@/types/entities'

/**
 * Calculs du "Budget du mariage" (perspective du couple : combien du budget
 * client est consommé) — volontairement séparés de calculations.ts
 * (perspective de l'organisatrice : rentabilité/marge). Les deux ne doivent
 * jamais être mélangés ni renommés l'un en l'autre.
 *
 * Le statut et l'horaire d'arrivée des prestataires restent hors périmètre
 * ici : seuls les montants (estimé/réel) sont utilisés.
 */

export interface ExpenseCategoryAmount {
  category: ExpenseCategory
  amount: number
}

export interface WeddingBudgetOverview {
  hasClientBudget: boolean
  clientBudget: number

  /** Somme des coûts prestataires ESTIMÉS renseignés (jamais confondue avec le réel). */
  vendorEstimatedTotal: number
  /** Somme des coûts prestataires RÉELS renseignés uniquement — jamais complétée par une estimation. */
  vendorActualTotal: number
  /** Prestataires liés à ce mariage sans aucun coût (ni estimé, ni réel) renseigné. */
  vendorsMissingCostCount: number
  hasAnyVendor: boolean

  expensesPlannedTotal: number
  expensesCommittedTotal: number
  expensesPaidTotal: number
  /** Somme des trois statuts, quel que soit le statut — sert de dénominateur aux barres de catégorie. */
  expensesTotal: number
  /** Triée du montant le plus élevé au plus faible. */
  expensesByCategory: ExpenseCategoryAmount[]
  hasAnyExpense: boolean

  /**
   * Coût prestataire "le plus fiable connu" par prestataire (réel si connu,
   * sinon estimé, sinon 0) — même repli que calculateVendorCosts
   * (calculations.ts), jamais présenté comme "réel" ni "payé" : uniquement
   * comme une estimation, toujours à côté des totaux estimé/réel stricts
   * ci-dessus pour rester transparent sur ce qu'il mélange.
   */
  vendorBestKnownTotal: number
  /** vendorBestKnownTotal + expensesTotal — la seule estimation combinée exposée, toujours étiquetée comme telle. */
  estimatedTotalSpend: number
  /** null tant que le budget client n'est pas renseigné — jamais calculé sur une base de 0. */
  remainingEstimate: number | null
  /** null tant que le budget client n'est pas renseigné ou est nul. */
  budgetUsagePct: number | null
  isOverBudget: boolean
}

/**
 * `vendors` et `vendorLinks` doivent déjà être filtrés sur CE mariage (même
 * convention que getWeddingFinancials). `expenses` de même.
 */
export function getWeddingBudgetOverview(
  wedding: Wedding,
  vendors: Vendor[],
  vendorLinks: VendorWeddingLink[],
  expenses: Expense[],
): WeddingBudgetOverview {
  const hasClientBudget = wedding.clientBudget > 0
  const clientBudget = wedding.clientBudget

  const vendorEstimatedTotal = vendorLinks.reduce((sum, l) => sum + (l.estimatedCost ?? 0), 0)
  const vendorActualTotal = vendorLinks.reduce((sum, l) => sum + (l.actualCost ?? 0), 0)
  const vendorBestKnownTotal = vendorLinks.reduce((sum, l) => sum + (l.actualCost ?? l.estimatedCost ?? 0), 0)

  const linkByVendorId = new Map(vendorLinks.map((l) => [l.vendorId, l]))
  const vendorsMissingCostCount = vendors.filter((v) => {
    const link = linkByVendorId.get(v.id)
    return link === undefined || (link.estimatedCost === undefined && link.actualCost === undefined)
  }).length

  const expensesPlannedTotal = expenses.filter((e) => e.status === 'prevue').reduce((s, e) => s + e.amount, 0)
  const expensesCommittedTotal = expenses.filter((e) => e.status === 'engagee').reduce((s, e) => s + e.amount, 0)
  const expensesPaidTotal = expenses.filter((e) => e.status === 'payee').reduce((s, e) => s + e.amount, 0)
  const expensesTotal = expensesPlannedTotal + expensesCommittedTotal + expensesPaidTotal

  const byCategory = new Map<ExpenseCategory, number>()
  for (const e of expenses) byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + e.amount)
  const expensesByCategory = [...byCategory.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)

  const estimatedTotalSpend = vendorBestKnownTotal + expensesTotal
  const remainingEstimate = hasClientBudget ? clientBudget - estimatedTotalSpend : null
  const budgetUsagePct = hasClientBudget && clientBudget > 0 ? (estimatedTotalSpend / clientBudget) * 100 : null
  const isOverBudget = hasClientBudget && estimatedTotalSpend > clientBudget

  return {
    hasClientBudget,
    clientBudget,
    vendorEstimatedTotal,
    vendorActualTotal,
    vendorsMissingCostCount,
    hasAnyVendor: vendors.length > 0,
    expensesPlannedTotal,
    expensesCommittedTotal,
    expensesPaidTotal,
    expensesTotal,
    expensesByCategory,
    hasAnyExpense: expenses.length > 0,
    vendorBestKnownTotal,
    estimatedTotalSpend,
    remainingEstimate,
    budgetUsagePct,
    isOverBudget,
  }
}

export type BudgetStatus = 'non_configure' | 'ok' | 'attention' | 'depasse'

export const BUDGET_STATUS_LABELS: Record<BudgetStatus, string> = {
  non_configure: 'Budget non renseigné',
  ok: 'Dans le budget',
  attention: 'Budget presque atteint',
  depasse: 'Budget dépassé',
}

/** Seuil "presque atteint" : 85 % du budget estimé consommé — cohérent avec l'esprit des seuils de marge (calculations.ts), sans prétendre à une précision que les données n'ont pas. */
const ATTENTION_THRESHOLD_PCT = 85

export function getBudgetStatus(overview: WeddingBudgetOverview): BudgetStatus {
  if (!overview.hasClientBudget) return 'non_configure'
  if (overview.isOverBudget) return 'depasse'
  if ((overview.budgetUsagePct ?? 0) >= ATTENTION_THRESHOLD_PCT) return 'attention'
  return 'ok'
}
