import { z } from 'zod'
import { BusinessConfigSchema, ProposalLineItemSchema, VatStatusSchema } from '@/schemas/workspace'

/**
 * Instantané figé d'une facture au moment de son envoi — tout ce qu'il
 * faut pour la réafficher via InvoiceDocumentPreview, sans jamais relire
 * les données de la décoratrice (mariages/factures restent locaux à son
 * navigateur). Stocké tel quel dans `factures_partages.snapshot` (jsonb).
 * Même principe que DevisSnapshot (cf. devisSnapshot.ts).
 */
export const FactureSnapshotSchema = z.object({
  businessConfig: BusinessConfigSchema,
  wedding: z.object({ coupleName: z.string(), date: z.string() }),
  invoiceNumber: z.string(),
  date: z.string(),
  clientName: z.string(),
  clientAddress: z.string().optional(),
  clientPhone: z.string().optional(),
  lineItems: z.array(ProposalLineItemSchema),
  subtotal: z.number(),
  taxAmount: z.number(),
  total: z.number(),
  vatMode: VatStatusSchema,
  vatRate: z.number().optional(),
  depositAmount: z.number().optional(),
  balanceAmount: z.number().optional(),
  legalMentions: z.string().optional(),
})

export type FactureSnapshot = z.infer<typeof FactureSnapshotSchema>
