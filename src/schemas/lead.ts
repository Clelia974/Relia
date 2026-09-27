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

/**
 * Une demande reste "leads" pendant toute la négociation (nouveau →
 * devis_envoye) — jamais transformée en mariage avant la signature.
 * 'importe' : devis signé, mariage créé (nom conservé pour ne pas casser
 * les demandes déjà marquées ainsi avant ce changement). 'ignore' :
 * écartée, à tout stade.
 */
export const LeadStatusSchema = z.enum(['nouveau', 'repondu', 'en_attente_reponse', 'devis_envoye', 'importe', 'ignore'])

export const LEAD_STATUS_LABELS: Record<z.infer<typeof LeadStatusSchema>, string> = {
  nouveau: 'Nouveau',
  repondu: 'Répondu',
  en_attente_reponse: 'En attente de réponse',
  devis_envoye: 'Devis envoyé',
  importe: 'Signé',
  ignore: 'Écartée',
}

/** Toujours visibles dans la boîte de demandes — une fois signée ou écartée, une demande en sort. */
export const ACTIVE_LEAD_STATUSES = ['nouveau', 'repondu', 'en_attente_reponse', 'devis_envoye'] as const

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
