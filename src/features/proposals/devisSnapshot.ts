import { z } from 'zod'
import { BusinessConfigSchema, ProposalLineItemSchema, VatStatusSchema } from '@/schemas/workspace'

/**
 * Instantané figé d'un devis au moment de son envoi — tout ce qu'il faut
 * pour le réafficher via ProposalDocumentPreview, sans jamais relire les
 * données de la décoratrice (mariages/devis restent locaux à son
 * navigateur). Stocké tel quel dans `devis_partages.snapshot` (jsonb).
 */
export const DevisSnapshotSchema = z.object({
  businessConfig: BusinessConfigSchema,
  wedding: z.object({ coupleName: z.string(), date: z.string(), venue: z.string() }),
  title: z.string(),
  proposalNumber: z.string(),
  templateLabel: z.string().optional(),
  clientName: z.string(),
  clientAddress: z.string().optional(),
  clientPhone: z.string().optional(),
  validUntil: z.string().optional(),
  lineItems: z.array(ProposalLineItemSchema),
  totals: z.object({
    subtotal: z.number(),
    optionsTotal: z.number(),
    taxAmount: z.number(),
    total: z.number(),
    depositAmount: z.number(),
    balanceAmount: z.number(),
  }),
  vatMode: VatStatusSchema,
  vatRate: z.number().optional(),
  depositPercentage: z.number().optional(),
  notes: z.string().optional(),
})

export type DevisSnapshot = z.infer<typeof DevisSnapshotSchema>
