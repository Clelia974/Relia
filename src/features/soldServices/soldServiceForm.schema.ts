import { z } from 'zod'
import { optionalPositiveAmount } from '@/lib/zodHelpers'

/**
 * Schéma dédié à l'ajout manuel d'une prestation vendue "ajoutée
 * ultérieurement" — distinct de SoldServiceSchema qui valide l'entité
 * persistée. weddingId/proposalId ne sont pas des champs du formulaire : ils
 * sont fixés par le contexte (l'onglet du mariage courant, la proposition déjà
 * générée), pas saisis par l'utilisatrice.
 */
export const SoldServiceFormSchema = z.object({
  title: z.string().trim().min(1, 'Veuillez renseigner un titre.'),
  description: z.string().trim(),
  quantity: optionalPositiveAmount('Veuillez saisir une quantité valide.'),
  // Requis mais peut être 0 (prestation offerte) — jamais négatif, jamais vide.
  soldPrice: z
    .string()
    .trim()
    .refine((v) => v !== '' && !Number.isNaN(Number(v)) && Number(v) >= 0, { message: 'Veuillez saisir un prix valide.' }),
  notes: z.string().trim(),
})

export type SoldServiceFormValues = z.infer<typeof SoldServiceFormSchema>

export function emptySoldServiceFormValues(): SoldServiceFormValues {
  return { title: '', description: '', quantity: '', soldPrice: '', notes: '' }
}
