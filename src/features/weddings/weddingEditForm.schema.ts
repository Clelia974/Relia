import { z } from 'zod'
import { WeddingFormSchema } from '@/features/weddings/weddingForm.schema'
import type { Wedding } from '@/types/entities'

/**
 * Étend le schéma de création avec les champs propres à l'édition d'un
 * mariage existant — `archived` reste un booléen indépendant du statut
 * (cf. WeddingSchema), jamais une valeur de `status`.
 */
export const WeddingEditFormSchema = WeddingFormSchema.extend({
  archived: z.boolean(),
  clientAddress: z.string().trim(),
  clientPhone: z.string().trim(),
})

export type WeddingEditFormValues = z.infer<typeof WeddingEditFormSchema>

export function weddingToEditFormValues(wedding: Wedding): WeddingEditFormValues {
  return {
    coupleName: wedding.coupleName,
    date: wedding.date.slice(0, 10),
    venue: wedding.venue,
    clientAddress: wedding.clientAddress ?? '',
    clientPhone: wedding.clientPhone ?? '',
    soldAmount: String(wedding.soldAmount),
    clientBudget: String(wedding.clientBudget),
    status: wedding.status,
    notes: wedding.notes ?? '',
    archived: wedding.archived,
  }
}
