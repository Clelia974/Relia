import { generateId } from '@/lib/id'
import { computeProposalTotals } from '@/features/proposals/calculations'
import type { BusinessConfig, ProposalTemplate } from '@/types/entities'

/**
 * Construit les champs communs d'un nouveau devis à partir d'une formule —
 * partagé entre la création depuis un mariage (WeddingDocumentsTab) et
 * depuis une demande pas encore signée (LeadsInboxPage) : même calcul, même
 * lignes, seul l'appelant précise ensuite weddingId ou leadId.
 */
export function buildProposalInputFromTemplate(
  template: ProposalTemplate,
  clientName: string,
  contact: { clientAddress?: string; clientPhone?: string },
  businessConfig: BusinessConfig,
) {
  const lineItems = template.lines.map((line) => ({
    id: generateId(),
    description: line.description,
    category: line.category,
    quantity: line.quantity,
    unitPrice: line.unitPrice,
    total: line.quantity * line.unitPrice,
    included: line.included,
    optional: line.optional,
  }))
  const totals = computeProposalTotals(lineItems, businessConfig.vatStatus, businessConfig.vatRate, undefined)

  return {
    template: template.tier,
    title: template.showOnDocuments === false ? `Proposition — ${clientName}` : `Proposition ${template.label} — ${clientName}`,
    clientName,
    clientAddress: contact.clientAddress,
    clientPhone: contact.clientPhone,
    lineItems,
    subtotal: totals.subtotal,
    vatMode: businessConfig.vatStatus,
    vatRate: businessConfig.vatRate,
    taxAmount: totals.taxAmount,
    total: totals.total,
    depositAmount: totals.depositAmount,
    balanceAmount: totals.balanceAmount,
  }
}
