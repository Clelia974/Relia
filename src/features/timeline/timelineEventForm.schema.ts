import { z } from 'zod'
import { optionalPositiveAmount } from '@/lib/zodHelpers'

const optionalMinutes = optionalPositiveAmount('Veuillez saisir une marge positive.')

/**
 * Schéma dédié au formulaire — distinct de TimelineEventSchema qui valide
 * l'entité persistée. weddingId n'est pas un champ du formulaire : ce
 * composant n'est ouvert que depuis l'onglet Planning d'un mariage déjà
 * connu, passé en prop au composant plutôt que sélectionné ici.
 */
export const TimelineEventFormSchema = z
  .object({
    title: z.string().trim().min(1, 'Veuillez renseigner le nom du moment.'),
    description: z.string().trim(),
    date: z
      .string()
      .min(1, 'Veuillez sélectionner une date.')
      .refine((v) => !Number.isNaN(Date.parse(v)), { message: 'Veuillez sélectionner une date.' }),
    startTime: z.string().min(1, 'Veuillez renseigner une heure de début.'),
    endTime: z.string().min(1, 'Veuillez renseigner une heure de fin.'),
    location: z.string().trim(),
    vendorId: z.string(),
    responsiblePerson: z.string().trim(),
    isPhotoMoment: z.boolean(),
    bufferBeforeMinutes: optionalMinutes,
    bufferAfterMinutes: optionalMinutes,
    type: z.enum(['jalon', 'jour_j', 'livraison_prestataire']),
    status: z.string().min(1),
    notes: z.string().trim(),
  })
  .refine((values) => values.startTime === '' || values.endTime === '' || values.endTime > values.startTime, {
    message: "L'heure de fin doit être postérieure à l'heure de début.",
    path: ['endTime'],
  })

export type TimelineEventFormValues = z.infer<typeof TimelineEventFormSchema>

export function emptyTimelineEventFormValues(defaultDate?: string): TimelineEventFormValues {
  return {
    title: '',
    description: '',
    date: defaultDate ?? '',
    startTime: '',
    endTime: '',
    location: '',
    vendorId: '',
    responsiblePerson: '',
    isPhotoMoment: false,
    bufferBeforeMinutes: '',
    bufferAfterMinutes: '',
    type: 'jalon',
    status: 'prevu',
    notes: '',
  }
}
