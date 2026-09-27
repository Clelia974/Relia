import { z } from 'zod'

/**
 * Schéma d'une demande entrante (formulaire public /lead/new/:userId).
 * Partagé entre le formulaire (validation avant envoi) et la fonction
 * serverless api/leads.ts (validation avant écriture) — jamais dupliqué.
 */

export const LeadEventTypeSchema = z.enum([
  'mariage',
  'bapteme',
  'communion',
  'confirmation',
  'anniversaire',
  'entreprise',
  'autre',
])

export const LeadSourceSchema = z.enum(['instagram', 'facebook', 'recommandation', 'google', 'autre'])

export const LEAD_EVENT_TYPE_LABELS: Record<z.infer<typeof LeadEventTypeSchema>, string> = {
  mariage: 'Mariage',
  bapteme: 'Baptême',
  communion: 'Communion',
  confirmation: 'Confirmation',
  anniversaire: 'Anniversaire',
  entreprise: 'Événement d’entreprise',
  autre: 'Autre',
}

export const LEAD_SOURCE_LABELS: Record<z.infer<typeof LeadSourceSchema>, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  recommandation: 'Recommandation',
  google: 'Google',
  autre: 'Autre',
}

export const LeadSubmissionSchema = z.object({
  userId: z.string().min(1, 'Lien invalide.'),
  clientName: z.string().min(1, 'Le nom est obligatoire.').max(200),
  clientPhone: z.string().max(30).optional(),
  clientEmail: z.string().email('Adresse email invalide.').optional().or(z.literal('')),
  eventType: LeadEventTypeSchema,
  eventDate: z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)), { message: 'Date invalide.' }),
  budgetEstimate: z.number().nonnegative().optional(),
  message: z.string().max(2000).optional(),
  source: LeadSourceSchema,
})

export type LeadSubmission = z.infer<typeof LeadSubmissionSchema>

export const LeadStatusSchema = z.enum(['nouveau', 'importe', 'ignore'])

export const LeadSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  client_name: z.string(),
  client_phone: z.string().nullable(),
  client_email: z.string().nullable(),
  event_type: LeadEventTypeSchema,
  event_date: z.string().nullable(),
  budget_estimate: z.number().nullable(),
  message: z.string().nullable(),
  source: LeadSourceSchema,
  status: LeadStatusSchema,
  created_at: z.string(),
})

export type Lead = z.infer<typeof LeadSchema>
