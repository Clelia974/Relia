import { isScopeChangeBillable } from '@/lib/scopeChangeStatus'
import type { Expense, ScopeChange, Vendor, VendorWeddingLink, Wedding } from '@/types/entities'

/**
 * Calculs financiers purs (Phase 8). Un changement de périmètre "Approuvé"
 * ou "Réalisé" (qui suppose une approbation préalable) est le seul à compter
 * dans les chiffres officiels — "Proposé", "À envoyer" et "En attente
 * d'approbation" restent de simples projections tant qu'ils ne sont pas
 * tranchés. Le coût fournisseur d'un changement approuvé est un coût réel
 * même s'il n'est pas facturé au client (geste commercial) ; il est donc
 * toujours ajouté aux coûts fournisseurs, indépendamment du prix facturé.
 */

const PENDING_SCOPE_STATUSES: ScopeChange['status'][] = ['proposee', 'a_envoyer', 'en_attente_approbation']

export function calculateApprovedScopeChanges(scopeChanges: ScopeChange[]): number {
  return scopeChanges.filter((sc) => isScopeChangeBillable(sc.status)).reduce((sum, sc) => sum + sc.clientPrice, 0)
}

export function calculateProposedScopeChanges(scopeChanges: ScopeChange[]): number {
  return scopeChanges.filter((sc) => PENDING_SCOPE_STATUSES.includes(sc.status)).reduce((sum, sc) => sum + sc.clientPrice, 0)
}

/** Coût déjà engagé sur un changement approuvé mais jamais facturé (geste commercial, prix client à 0). */
export function calculateUnbilledScopeCreep(scopeChanges: ScopeChange[]): number {
  return scopeChanges
    .filter((sc) => isScopeChangeBillable(sc.status) && sc.clientPrice === 0)
    .reduce((sum, sc) => sum + sc.vendorCost, 0)
}

export function calculateApprovedRevenue(wedding: Wedding, scopeChanges: ScopeChange[]): number {
  return wedding.soldAmount + calculateApprovedScopeChanges(scopeChanges)
}

/** Coût fournisseur des changements de périmètre approuvés — fait partie des "coûts fournisseurs", jamais un troisième poste séparé. */
export function calculateApprovedScopeChangeCosts(scopeChanges: ScopeChange[]): number {
  return scopeChanges.filter((sc) => isScopeChangeBillable(sc.status)).reduce((sum, sc) => sum + sc.vendorCost, 0)
}

/**
 * Somme des coûts prestataires (coût réel si connu, sinon estimé) plus le
 * coût des changements de périmètre approuvés. `vendorLinks` doit déjà être
 * filtré sur LE mariage concerné (une ligne = un coût pour un prestataire
 * précis sur ce mariage précis, cf. VendorWeddingLinkSchema) — un coût
 * marqué `needsCostReview` reste inclus ici : on n'occulte jamais une
 * donnée, on se contente de la signaler ailleurs (WeddingFinancials.hasCostNeedingReview).
 */
export function calculateVendorCosts(vendorLinks: VendorWeddingLink[], scopeChanges: ScopeChange[]): number {
  const vendorTotal = vendorLinks.reduce((sum, link) => sum + (link.actualCost ?? link.estimatedCost ?? 0), 0)
  return vendorTotal + calculateApprovedScopeChangeCosts(scopeChanges)
}

export function calculateOtherExpenses(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => sum + e.amount, 0)
}

export function calculateTotalCosts(vendorCosts: number, otherExpenses: number): number {
  return vendorCosts + otherExpenses
}

export function calculateProfit(revenue: number, totalCosts: number): number {
  return revenue - totalCosts
}

/** Ne renvoie jamais NaN ni Infinity : 0 tant que le chiffre d'affaires est nul ou négatif. */
export function calculateMargin(profit: number, revenue: number): number {
  if (!Number.isFinite(revenue) || revenue <= 0) return 0
  const pct = (profit / revenue) * 100
  return Number.isFinite(pct) ? pct : 0
}

export type MarginStatus = 'saine' | 'a_surveiller' | 'faible' | 'critique'

export const MARGIN_STATUS_LABELS: Record<MarginStatus, string> = {
  saine: 'Marge saine',
  a_surveiller: 'Marge à surveiller',
  faible: 'Marge faible',
  critique: 'Marge critique',
}

/** Seuils : vert > 35 %, jaune 25–35 %, rouge < 25 %, critique < 15 % (sous-ensemble du rouge). */
export function getMarginStatus(marginPct: number): MarginStatus {
  if (marginPct < 15) return 'critique'
  if (marginPct < 25) return 'faible'
  if (marginPct <= 35) return 'a_surveiller'
  return 'saine'
}

export interface WeddingFinancials {
  hasSoldAmount: boolean
  /** Au moins un coût (fournisseur ou autre) a été renseigné pour ce mariage. */
  hasCostData: boolean
  approvedRevenue: number
  vendorCosts: number
  otherExpenses: number
  totalCosts: number
  profit: number
  marginPct: number
  /** null tant qu'il manque le montant vendu ou tout coût — jamais une marge inventée. */
  marginStatus: MarginStatus | null
  scopeChangeProposedTotal: number
  scopeChangeApprovedTotal: number
  /** Portion de `vendorCosts` issue des changements de périmètre approuvés (déjà incluse dedans, jamais à additionner séparément). */
  scopeChangeApprovedCost: number
  scopeChangeUnbilledTotal: number
  missingVendorCostCount: number
  /** true si au moins un coût inclus dans vendorCosts vient d'un lien needsCostReview (migration ambiguë, jamais confirmé depuis). */
  hasCostNeedingReview: boolean
}

/**
 * `vendors` et `vendorLinks` doivent être pré-filtrés par l'appelant sur CE
 * mariage (même convention que `expenses`/`scopeChanges`) — `vendors` sert à
 * savoir QUELS prestataires sont liés à ce mariage, `vendorLinks` porte leur
 * coût PROPRE à ce mariage (cf. VendorWeddingLinkSchema).
 */
export function getWeddingFinancials(
  wedding: Wedding,
  vendors: Vendor[],
  vendorLinks: VendorWeddingLink[],
  expenses: Expense[],
  scopeChanges: ScopeChange[],
): WeddingFinancials {
  const hasSoldAmount = wedding.soldAmount > 0
  const vendorCosts = calculateVendorCosts(vendorLinks, scopeChanges)
  const otherExpenses = calculateOtherExpenses(expenses)
  const hasCostData = vendorCosts > 0 || otherExpenses > 0
  const approvedRevenue = calculateApprovedRevenue(wedding, scopeChanges)
  const totalCosts = calculateTotalCosts(vendorCosts, otherExpenses)
  const profit = calculateProfit(approvedRevenue, totalCosts)
  const marginPct = hasSoldAmount ? calculateMargin(profit, approvedRevenue) : 0

  const linkByVendorId = new Map(vendorLinks.map((link) => [link.vendorId, link]))
  const missingVendorCostCount = vendors.filter((v) => {
    const link = linkByVendorId.get(v.id)
    return link === undefined || (link.estimatedCost === undefined && link.actualCost === undefined)
  }).length

  return {
    hasSoldAmount,
    hasCostData,
    approvedRevenue,
    vendorCosts,
    otherExpenses,
    totalCosts,
    profit,
    marginPct,
    marginStatus: hasSoldAmount && hasCostData ? getMarginStatus(marginPct) : null,
    scopeChangeProposedTotal: calculateProposedScopeChanges(scopeChanges),
    scopeChangeApprovedTotal: calculateApprovedScopeChanges(scopeChanges),
    scopeChangeApprovedCost: calculateApprovedScopeChangeCosts(scopeChanges),
    scopeChangeUnbilledTotal: calculateUnbilledScopeCreep(scopeChanges),
    missingVendorCostCount,
    hasCostNeedingReview: vendorLinks.some((link) => link.needsCostReview === true),
  }
}

/**
 * Simule l'approbation d'un changement de périmètre encore en attente pour
 * afficher son impact potentiel sans jamais le traiter comme une valeur
 * officielle (cf. Phase 8, section 8).
 */
export function simulateScopeChangeApproval(
  wedding: Wedding,
  vendors: Vendor[],
  vendorLinks: VendorWeddingLink[],
  expenses: Expense[],
  scopeChanges: ScopeChange[],
  scopeChangeId: string,
): { marginBefore: number; marginAfter: number } {
  const before = getWeddingFinancials(wedding, vendors, vendorLinks, expenses, scopeChanges)
  const simulated = scopeChanges.map((sc) => (sc.id === scopeChangeId ? { ...sc, status: 'approuvee' as const } : sc))
  const after = getWeddingFinancials(wedding, vendors, vendorLinks, expenses, simulated)
  return { marginBefore: before.marginPct, marginAfter: after.marginPct }
}
