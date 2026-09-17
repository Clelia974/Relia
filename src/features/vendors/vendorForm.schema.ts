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
 * Schéma dédié au formulaire (les champs arrivent en string depuis les inputs HTML) —
 * distinct de VendorSchema qui valide l'entité déjà persistée. La catégorie et le
 * statut restent des chaînes ici : le Select du formulaire ne propose que des valeurs
 * valides, donc l'appartenance à l'enum n'a pas besoin d'être revalidée ici.
 */
export const VendorFormSchema = z.object({
  name: z.string().trim().min(1, 'Veuillez renseigner le nom du prestataire.'),
  company: z.string().trim(),
  category: z.string().min(1, 'Veuillez sélectionner une catégorie.'),
  phone: z.string().trim(),
  email: optionalEmail,
  estimatedCost: optionalAmount,
  actualCost: optionalAmount,
  arrivalTime: optionalArrivalTime,
  status: z.string().min(1, 'Veuillez sélectionner un statut.'),
  notes: z.string().trim(),
})

export type VendorFormValues = z.infer<typeof VendorFormSchema>

export function emptyVendorFormValues(): VendorFormValues {
  return {
    name: '',
    company: '',
    category: '',
    phone: '',
    email: '',
    estimatedCost: '',
    actualCost: '',
    arrivalTime: '',
    status: '',
    notes: '',
  }
}
