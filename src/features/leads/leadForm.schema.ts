import { z } from 'zod'
import { LeadEventTypeSchema, LeadSourceSchema } from '@/schemas/lead'
import { optionalPositiveAmount } from '@/lib/zodHelpers'

/**
 * Schéma dédié au formulaire public (champs en string depuis les inputs
 * HTML) — la fonction serverless api/leads.ts revalide indépendamment
 * avant écriture, jamais de confiance dans ce qui arrive du client.
 */
export const LeadFormSchema = z.object({
  clientName: z.string().trim().min(1, 'Veuillez indiquer votre nom.'),
  clientPhone: z.string().trim(),
  clientEmail: z.string().trim().refine((v) => v === '' || z.string().email().safeParse(v).success, {
    message: 'Adresse email invalide.',
  }),
  eventType: LeadEventTypeSchema,
  eventDate: z
    .string()
    .min(1, 'Veuillez indiquer la date de l’événement.')
    .refine((v) => !Number.isNaN(Date.parse(v)), { message: 'Date invalide.' }),
  venue: z.string().trim(),
  guestCount: optionalPositiveAmount('Nombre d’invités invalide.'),
  budgetEstimate: optionalPositiveAmount('Veuillez saisir un montant valide.'),
  message: z.string().trim(),
  source: LeadSourceSchema,
})

export type LeadFormValues = z.infer<typeof LeadFormSchema>

export function emptyLeadFormValues(): LeadFormValues {
  return {
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    eventType: 'mariage',
    eventDate: '',
    venue: '',
    guestCount: '',
    budgetEstimate: '',
    message: '',
    source: 'instagram',
  }
}
