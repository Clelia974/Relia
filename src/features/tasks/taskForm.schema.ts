import { z } from 'zod'

const optionalDate = z
  .string()
  .trim()
  .refine((v) => v === '' || !Number.isNaN(Date.parse(v)), { message: 'Date invalide.' })

/**
 * Schéma dédié au formulaire — distinct de TaskSchema qui valide l'entité persistée.
 * weddingId et priority/statut restent des chaînes non vides : le Select ne
 * propose que des valeurs valides, donc l'appartenance à l'enum n'a pas besoin
 * d'être revalidée ici. Le prestataire proposé dans le formulaire est déjà
 * filtré à ceux du mariage sélectionné, ce qui garantit l'appartenance sans
 * revalidation croisée ici.
 */
export const TaskFormSchema = z.object({
  title: z.string().trim().min(1, 'Veuillez renseigner le titre de la tâche.'),
  description: z.string().trim(),
  weddingId: z.string().min(1, 'Veuillez sélectionner un mariage.'),
  vendorId: z.string(),
  dueDate: z
    .string()
    .min(1, "Veuillez sélectionner une date d'échéance.")
    .refine((v) => !Number.isNaN(Date.parse(v)), { message: "Veuillez sélectionner une date d'échéance." }),
  startDate: optionalDate,
  endDate: optionalDate,
  priority: z.string().min(1, 'Veuillez sélectionner une priorité.'),
  status: z.string().min(1, 'Veuillez sélectionner un statut.'),
  waitingOn: z.string(),
  waitingReason: z.string().trim(),
  notes: z.string().trim(),
  /** Phase du jour J (Vue Jour J, Phase 3) — chaîne vide = non classée, jamais obligatoire. */
  phase: z.string(),
})

export type TaskFormValues = z.infer<typeof TaskFormSchema>

export function emptyTaskFormValues(defaultWeddingId?: string): TaskFormValues {
  return {
    title: '',
    description: '',
    weddingId: defaultWeddingId ?? '',
    vendorId: '',
    dueDate: '',
    startDate: '',
    endDate: '',
    priority: 'normale',
    status: 'a_preparer',
    waitingOn: '',
    waitingReason: '',
    notes: '',
    phase: '',
  }
}
