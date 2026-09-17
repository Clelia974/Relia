import { z } from 'zod'
import { WeddingStatusSchema } from '@/schemas/workspace'
import { optionalPositiveAmount } from '@/lib/zodHelpers'

const optionalAmount = optionalPositiveAmount('Veuillez saisir un montant valide.')

/**
 * Schéma dédié au formulaire (les champs arrivent en string depuis les inputs HTML) —
 * distinct de WeddingSchema qui valide l'entité déjà persistée.
 */
export const WeddingFormSchema = z.object({
  coupleName: z.string().trim().min(1, 'Veuillez renseigner le nom du couple.'),
  date: z
    .string()
    .min(1, 'Veuillez sélectionner la date du mariage.')
    .refine((v) => !Number.isNaN(Date.parse(v)), { message: 'Veuillez sélectionner la date du mariage.' }),
  venue: z.string().trim(),
  soldAmount: optionalAmount,
  clientBudget: optionalAmount,
  status: WeddingStatusSchema,
})

export type WeddingFormValues = z.infer<typeof WeddingFormSchema>

export function emptyWeddingFormValues(): WeddingFormValues {
  return { coupleName: '', date: '', venue: '', soldAmount: '', clientBudget: '', status: 'signe' }
}
