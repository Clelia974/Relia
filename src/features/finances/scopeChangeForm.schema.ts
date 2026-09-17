import { z } from 'zod'
import { optionalPositiveAmount } from '@/lib/zodHelpers'

export const ScopeChangeFormSchema = z.object({
  description: z.string().trim().min(1, 'Veuillez renseigner la description.'),
  date: z
    .string()
    .min(1, 'Veuillez sélectionner une date.')
    .refine((v) => !Number.isNaN(Date.parse(v)), { message: 'Veuillez sélectionner une date.' }),
  vendorCost: optionalPositiveAmount('Veuillez saisir un montant valide.'),
  clientPrice: optionalPositiveAmount('Veuillez saisir un montant valide.'),
  status: z.string().min(1, 'Veuillez sélectionner un statut.'),
  notes: z.string().trim(),
})

export type ScopeChangeFormValues = z.infer<typeof ScopeChangeFormSchema>

export function emptyScopeChangeFormValues(defaultDate?: string): ScopeChangeFormValues {
  return {
    description: '',
    date: defaultDate ?? new Date().toISOString().slice(0, 10),
    vendorCost: '0',
    clientPrice: '0',
    status: 'proposee',
    notes: '',
  }
}
