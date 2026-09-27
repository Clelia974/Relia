import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { requireEnv } from './_lib/requireEnv.js'
import { checkRateLimit, getClientIp } from './_lib/rateLimit.js'
import { sendAutoReply } from './_lib/sendAutoReply.js'

const EVENT_TYPE_LABELS: Record<string, string> = {
  mariage: 'Mariage',
  bapteme: 'Baptême',
  communion: 'Communion',
  confirmation: 'Confirmation',
  anniversaire: 'Anniversaire',
  entreprise: 'Événement d’entreprise',
  autre: 'Événement',
}

const supabaseAdmin = createClient(requireEnv('VITE_SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'))

/**
 * Validation propre à ce endpoint, indépendante de src/schemas/lead.ts
 * (utilisé côté formulaire) : api/ et src/ sont deux projets TypeScript
 * séparés (tsconfig.api.json n'inclut que api/), on évite volontairement
 * de faire dépendre l'un de l'autre à la compilation.
 */
const LeadSubmissionSchema = z.object({
  userId: z.string().min(1),
  clientName: z.string().min(1).max(200),
  clientPhone: z.string().max(30).optional(),
  clientEmail: z.string().email().optional().or(z.literal('')),
  eventType: z.enum(['mariage', 'bapteme', 'communion', 'confirmation', 'anniversaire', 'entreprise', 'autre']),
  eventDate: z.string().refine((value) => !Number.isNaN(Date.parse(value))),
  budgetEstimate: z.number().nonnegative().optional(),
  message: z.string().max(2000).optional(),
  source: z.enum(['instagram', 'facebook', 'recommandation', 'google', 'autre']),
})

/**
 * Point d'accès public (formulaire /lead/new/:userId, jamais authentifié
 * — une prospect n'a pas de compte) : jamais de policy INSERT directe sur
 * `leads`, tout passe par ici avec la clé service_role, pour garder le
 * rate limiting et la validation Zod comme unique porte d'entrée.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Méthode non autorisée.' })
    return
  }

  const allowed = await checkRateLimit(supabaseAdmin, `leads:${getClientIp(req)}`, {
    maxRequests: 10,
    windowSeconds: 60,
  })
  if (!allowed) {
    res.status(429).json({ error: 'Trop de demandes envoyées — réessaie dans une minute.' })
    return
  }

  const parsed = LeadSubmissionSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Formulaire invalide — vérifie les champs et réessaie.' })
    return
  }
  const input = parsed.data

  // Confirme que le lien pointe vers une décoratrice réelle plutôt que d'accepter n'importe quel userId
  // (lien copié-collé sans faute, mauvais partage) — évite des demandes orphelines que personne ne verra jamais.
  const { data: recipient, error: recipientError } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('id', input.userId)
    .maybeSingle()
  if (recipientError) {
    console.error('Erreur vérification destinataire de la demande :', recipientError.message)
    res.status(500).json({ error: 'Erreur interne.' })
    return
  }
  if (!recipient) {
    res.status(404).json({ error: 'Ce lien de contact n’est plus valide.' })
    return
  }

  const { error: insertError } = await supabaseAdmin.from('leads').insert({
    user_id: input.userId,
    client_name: input.clientName,
    client_phone: input.clientPhone || null,
    client_email: input.clientEmail || null,
    event_type: input.eventType,
    event_date: input.eventDate,
    budget_estimate: input.budgetEstimate ?? null,
    message: input.message || null,
    source: input.source,
  })
  if (insertError) {
    console.error('Erreur création de la demande :', insertError.message)
    res.status(500).json({ error: 'Erreur interne.' })
    return
  }

  // Best-effort : la demande est déjà enregistrée à ce stade, un échec d'envoi ne doit jamais faire échouer la requête.
  if (input.clientEmail) {
    await sendAutoReply({
      clientEmail: input.clientEmail,
      clientName: input.clientName,
      eventTypeLabel: EVENT_TYPE_LABELS[input.eventType] ?? 'Événement',
      eventDate: input.eventDate,
    })
  }

  res.status(200).json({ ok: true })
}
