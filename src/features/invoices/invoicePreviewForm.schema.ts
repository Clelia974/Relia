import { z } from 'zod'

/** Schéma de formulaire pour les champs propres à la facture indicative — les lignes réutilisent ProposalLineItemFormSchema. */
export const InvoicePreviewFormSchema = z.object({
  date: z
    .string()
    .min(1, 'Veuillez sélectionner une date.')
    .refine((v) => !Number.isNaN(Date.parse(v)), { message: 'Veuillez sélectionner une date.' }),
  clientName: z.string().trim(),
  legalMentions: z.string().trim(),
})

export type InvoicePreviewFormValues = z.infer<typeof InvoicePreviewFormSchema>
