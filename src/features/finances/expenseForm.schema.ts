import { z } from 'zod'
import { requiredPositiveAmount } from '@/lib/zodHelpers'

export const ExpenseFormSchema = z.object({
  description: z.string().trim().min(1, 'Veuillez renseigner la description.'),
  category: z.string().min(1, 'Veuillez sélectionner une catégorie.'),
  amount: requiredPositiveAmount('Veuillez saisir un montant valide.'),
  date: z
    .string()
    .min(1, 'Veuillez sélectionner une date.')
    .refine((v) => !Number.isNaN(Date.parse(v)), { message: 'Veuillez sélectionner une date.' }),
  status: z.string().min(1, 'Veuillez sélectionner un statut.'),
  notes: z.string().trim(),
})

export type ExpenseFormValues = z.infer<typeof ExpenseFormSchema>

export function emptyExpenseFormValues(defaultDate?: string): ExpenseFormValues {
  return {
    description: '',
    category: 'autre',
    amount: '',
    date: defaultDate ?? new Date().toISOString().slice(0, 10),
    status: 'engagee',
    notes: '',
  }
}
