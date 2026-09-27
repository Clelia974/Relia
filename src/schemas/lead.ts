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

export const LeadStatusSchema = z.enum(['nouveau', 'importe', 'ignore'])

export const LeadSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  client_name: z.string(),
  client_phone: z.string().nullable(),
  client_email: z.string().nullable(),
  event_type: LeadEventTypeSchema,
  event_date: z.string().nullable(),
  venue: z.string().nullable(),
  guest_count: z.number().nullable(),
  budget_estimate: z.number().nullable(),
  message: z.string().nullable(),
  source: LeadSourceSchema,
  status: LeadStatusSchema,
  created_at: z.string(),
})

export type Lead = z.infer<typeof LeadSchema>
