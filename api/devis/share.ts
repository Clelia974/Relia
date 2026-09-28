import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { requireEnv } from '../_lib/requireEnv.js'
import { checkRateLimit, getClientIp } from '../_lib/rateLimit.js'
import { sendDevisEmail } from '../_lib/sendDevisEmail.js'

const supabaseAdmin = createClient(requireEnv('VITE_SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'))

/**
 * Retrouve la décoratrice à partir du jeton d'accès envoyé par le client
 * (en-tête Authorization) — jamais d'un userId fourni dans le corps :
 * même garde-fou que checkout-session.ts/portal-session.ts. Contrairement
 * à api/leads.ts (public, une prospect n'a pas de compte), l'envoi d'un
 * devis part toujours d'une décoratrice connectée.
 */
async function getVerifiedUserId(req: VercelRequest): Promise<string | null> {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return null
  const token = header.slice('Bearer '.length)
  const { data, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !data.user) return null
  return data.user.id
}

/**
 * Validation volontairement légère : ce corps est produit par notre propre
 * client (ProposalBuilderPage), pas une saisie publique arbitraire comme
 * api/leads.ts — on vérifie juste la forme minimale, jamais chaque champ
 * imbriqué du devis.
 */
const ShareDevisSchema = z.object({
  snapshot: z.record(z.string(), z.unknown()),
  clientEmail: z.string().email().optional().or(z.literal('')),
  clientName: z.string().min(1),
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Méthode non autorisée.' })
    return
  }

  const userId = await getVerifiedUserId(req)
  if (!userId) {
    res.status(401).json({ error: 'Session invalide ou expirée — reconnectez-vous.' })
    return
  }

  const allowed = await checkRateLimit(supabaseAdmin, `devis-share:${getClientIp(req)}`, {
    maxRequests: 10,
    windowSeconds: 60,
  })
  if (!allowed) {
    res.status(429).json({ error: 'Trop de tentatives — réessaie dans une minute.' })
    return
  }

  const parsed = ShareDevisSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Devis invalide — vérifie les champs et réessaie.' })
    return
  }
  const input = parsed.data

  const { data, error: insertError } = await supabaseAdmin
    .from('devis_partages')
    .insert({ user_id: userId, client_email: input.clientEmail || null, snapshot: input.snapshot })
    .select('id')
    .single()
  if (insertError || !data) {
    console.error('Erreur création du devis partagé :', insertError?.message)
    res.status(500).json({ error: 'Erreur interne.' })
    return
  }

  // Best-effort : le devis est déjà enregistré et consultable via son lien à ce stade, un échec d'envoi ne doit jamais faire échouer la requête.
  if (input.clientEmail) {
    await sendDevisEmail({ clientEmail: input.clientEmail, clientName: input.clientName, shareId: data.id })
  }

  res.status(200).json({ ok: true, shareId: data.id })
}
