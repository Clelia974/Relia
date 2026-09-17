import { z } from 'zod'
import { requiredPositiveAmount } from '@/lib/zodHelpers'

/**
 * Schéma dédié au formulaire — distinct de EquipmentItemSchema qui valide
 * l'entité persistée. weddingId n'est pas un champ du formulaire : fixé par
 * le contexte (onglet du mariage courant), jamais saisi par l'utilisatrice.
 */
export const EquipmentItemFormSchema = z.object({
  name: z.string().trim().min(1, 'Veuillez renseigner un nom.'),
  quantity: requiredPositiveAmount('Veuillez saisir une quantité valide.'),
  category: z.string().trim(),
  acquisitionMode: z.string().min(1, "Veuillez sélectionner un mode d'obtention."),
  status: z.string().min(1, 'Veuillez sélectionner un statut.'),
  notes: z.string().trim(),
})

export type EquipmentItemFormValues = z.infer<typeof EquipmentItemFormSchema>

export function emptyEquipmentItemFormValues(): EquipmentItemFormValues {
  return { name: '', quantity: '1', category: '', acquisitionMode: '', status: 'a_prevoir', notes: '' }
}
