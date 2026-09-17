import { vatApplies } from '@/lib/vatStatus'
import type { ProposalLineItem, VatStatus } from '@/types/entities'

/**
 * Calculs de proposition/facture indicative (Phase 9) — séparés des calculs
 * financiers officiels (src/features/finances/calculations.ts). Une
 * proposition non approuvée ne modifie jamais le chiffre d'affaires, le
 * profit ou la marge officiels : ces fonctions ne lisent et n'écrivent que
 * dans le document lui-même.
 *
 * Le total de chaque ligne (quantity × unitPrice) est toujours recalculé ici
 * plutôt que lu depuis line.total, qui peut être une valeur ancienne stockée.
 */

export function calculateLineItemTotal(line: Pick<ProposalLineItem, 'quantity' | 'unitPrice'>): number {
  return line.quantity * line.unitPrice
}

/** Ne compte que les lignes incluses et non optionnelles — une option ne rejoint le sous-total que si elle est intégrée à la formule. */
export function calculateProposalSubtotal(lineItems: ProposalLineItem[]): number {
  return lineItems.filter((line) => line.included && !line.optional).reduce((sum, line) => sum + calculateLineItemTotal(line), 0)
}

/** Total des lignes optionnelles, à titre indicatif — jamais inclus dans le sous-total ou le total officiels du document. */
export function calculateProposalOptionsTotal(lineItems: ProposalLineItem[]): number {
  return lineItems.filter((line) => line.optional).reduce((sum, line) => sum + calculateLineItemTotal(line), 0)
}

/** Indicatif uniquement : 0 si le statut de TVA ne s'applique pas ou si aucun taux n'est configuré. Ne renvoie jamais NaN. */
export function calculateProposalTax(subtotal: number, vatMode: VatStatus, vatRate?: number): number {
  if (!vatApplies(vatMode) || vatRate === undefined || !Number.isFinite(vatRate)) return 0
  return subtotal * (vatRate / 100)
}

export function calculateProposalTotal(subtotal: number, taxAmount: number): number {
  return subtotal + taxAmount
}

export function calculateProposalDeposit(total: number, depositPercentage?: number): number {
  if (depositPercentage === undefined || !Number.isFinite(depositPercentage)) return 0
  return total * (depositPercentage / 100)
}

export function calculateProposalBalance(total: number, depositAmount: number): number {
  return total - depositAmount
}

export interface ProposalTotals {
  subtotal: number
  optionsTotal: number
  taxAmount: number
  total: number
  depositAmount: number
  balanceAmount: number
}

/** Recalcule tout à partir des lignes et des paramètres actuels — jamais à partir de valeurs stockées. */
export function computeProposalTotals(
  lineItems: ProposalLineItem[],
  vatMode: VatStatus,
  vatRate: number | undefined,
  depositPercentage: number | undefined,
): ProposalTotals {
  const subtotal = calculateProposalSubtotal(lineItems)
  const optionsTotal = calculateProposalOptionsTotal(lineItems)
  const taxAmount = calculateProposalTax(subtotal, vatMode, vatRate)
  const total = calculateProposalTotal(subtotal, taxAmount)
  const depositAmount = calculateProposalDeposit(total, depositPercentage)
  const balanceAmount = calculateProposalBalance(total, depositAmount)
  return { subtotal, optionsTotal, taxAmount, total, depositAmount, balanceAmount }
}
