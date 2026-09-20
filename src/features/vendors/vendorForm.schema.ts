import { z } from 'zod'
import { optionalPositiveAmount } from '@/lib/zodHelpers'

const optionalAmount = optionalPositiveAmount('Veuillez saisir un montant positif.')

const optionalEmail = z
  .string()
  .trim()
  .refine((v) => v === '' || z.string().email().safeParse(v).success, {
    message: 'Veuillez saisir une adresse email valide.',
  })

const optionalArrivalTime = z
  .string()
  .trim()
  .refine((v) => v === '' || /^([01]\d|2[0-3]):[0-5]\d$/.test(v), {
    message: 'Veuillez saisir une heure valide.',
  })

/**
 * Schémas dédiés aux formulaires (les champs arrivent en string depuis les inputs HTML) —
 * distincts de VendorSchema/VendorWeddingLinkSchema qui valident les entités persistées.
 * La catégorie et le statut restent des chaînes ici : le Select ne propose que des valeurs
 * valides, donc l'appartenance à l'enum n'a pas besoin d'être revalidée ici.
 *
 * Deux schémas car deux périmètres : la fiche catalogue (globale) et l'affectation à UN
 * mariage. VendorFormSchema (les deux réunis) ne sert qu'à créer un prestataire depuis un mariage.
 */
export const VendorGlobalFormSchema = z.object({
  name: z.string().trim().min(1, 'Veuillez renseigner le nom du prestataire.'),
  company: z.string().trim(),
  category: z.string().min(1, 'Veuillez sélectionner une catégorie.'),
  phone: z.string().trim(),
  email: optionalEmail,
  notes: z.string().trim(),
})

export const VendorAssignmentFormSchema = z.object({
  estimatedCost: optionalAmount,
  actualCost: optionalAmount,
  arrivalTime: optionalArrivalTime,
  status: z.string().min(1, 'Veuillez sélectionner un statut.'),
  assignmentNotes: z.string().trim(),
})

export const VendorFormSchema = VendorGlobalFormSchema.extend(VendorAssignmentFormSchema.shape)

export type VendorGlobalFormValues = z.infer<typeof VendorGlobalFormSchema>
export type VendorAssignmentFormValues = z.infer<typeof VendorAssignmentFormSchema>
export type VendorFormValues = z.infer<typeof VendorFormSchema>

export function emptyVendorFormValues(): VendorFormValues {
  return {
    name: '',
    company: '',
    category: '',
    phone: '',
    email: '',
    notes: '',
    estimatedCost: '',
    actualCost: '',
    arrivalTime: '',
    status: '',
    assignmentNotes: '',
  }
}
