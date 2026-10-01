import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { requireEnv } from './_lib/requireEnv.js'
import { checkRateLimit, getClientIp } from './_lib/rateLimit.js'

const supabaseAdmin = createClient(requireEnv('VITE_SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'))

const WaitlistSchema = z.object({
  email: z.string().email(),
  source: z.string().max(50).optional(),
})

/**
 * Point d'accès public (landing /liste-attente, jamais authentifiée) : seule porte
 * d'écriture sur `zordi_waitlist`, même logique que api/leads.ts — rate
 * limiting + validation avant insertion avec la clé service_role.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Méthode non autorisée.' })
    return
  }

  const allowed = await checkRateLimit(supabaseAdmin, `waitlist:${getClientIp(req)}`, {
    maxRequests: 5,
    windowSeconds: 60,
  })
  if (!allowed) {
    res.status(429).json({ error: 'Trop de tentatives — réessaie dans une minute.' })
    return
  }

  const parsed = WaitlistSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Adresse email invalide.' })
    return
  }

  // ignoreDuplicates : une même personne peut cliquer plusieurs fois sans erreur ni doublon —
  // on ne révèle jamais si l'adresse était déjà inscrite.
  const { error } = await supabaseAdmin
    .from('zordi_waitlist')
    .upsert(
      { email: parsed.data.email.trim().toLowerCase(), source: parsed.data.source || 'zordi_landing' },
      { onConflict: 'email', ignoreDuplicates: true },
    )
  if (error) {
    console.error('Erreur inscription liste d’attente SilkyPlace :', error.message)
    res.status(500).json({ error: 'Erreur interne.' })
    return
  }

  res.status(200).json({ ok: true })
}
