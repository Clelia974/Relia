import { z } from 'zod'
import { generateId } from '@/lib/id'
import { optionalPositiveAmount, requiredPositiveAmount } from '@/lib/zodHelpers'
import type { ProposalTemplateLine } from '@/types/entities'

/**
 * Schémas de formulaire — distincts de ProposalSchema qui valide l'entité
 * persistée. Les lignes sont validées une à une (erreurs par ligne) plutôt
 * que comme un tableau imbriqué, pour rester cohérent avec le reste de
 * l'application (TaskForm, VendorForm, ExpenseForm…).
 */

export const ProposalLineItemFormSchema = z.object({
  id: z.string().min(1),
  description: z.string().trim().min(1, 'Veuillez renseigner la description.'),
  category: z.string().trim().min(1, 'Veuillez sélectionner une catégorie.'),
  quantity: requiredPositiveAmount('Veuillez saisir une quantité valide.'),
  unitPrice: z
    .string()
    .trim()
    .refine((v) => v !== '' && !Number.isNaN(Number(v)) && Number(v) >= 0, { message: 'Veuillez saisir un prix valide.' }),
  included: z.boolean(),
  optional: z.boolean(),
  notes: z.string().trim(),
})

export type ProposalLineItemFormValues = z.infer<typeof ProposalLineItemFormSchema>

export function emptyLineItemFormValues(overrides?: Partial<ProposalLineItemFormValues>): ProposalLineItemFormValues {
  return {
    id: generateId(),
    description: '',
    category: '',
    quantity: '1',
    unitPrice: '',
    included: true,
    optional: false,
    notes: '',
    ...overrides,
  }
}

export function lineItemFromTemplate(line: ProposalTemplateLine): ProposalLineItemFormValues {
  return emptyLineItemFormValues({
    description: line.description,
    category: line.category,
    quantity: String(line.quantity),
    unitPrice: String(line.unitPrice),
    included: line.included,
    optional: line.optional,
  })
}

export const ProposalFormSchema = z.object({
  title: z.string().trim().min(1, 'Veuillez renseigner le titre.'),
  template: z.string().min(1, 'Veuillez sélectionner une formule.'),
  clientName: z.string().trim(),
  validUntil: z.string().trim(),
  status: z.string().min(1, 'Veuillez sélectionner un statut.'),
  depositPercentage: optionalPositiveAmount('Veuillez saisir un pourcentage valide.'),
  notes: z.string().trim(),
})

export type ProposalFormValues = z.infer<typeof ProposalFormSchema>
