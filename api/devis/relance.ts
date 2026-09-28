import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { requireEnv } from '../_lib/requireEnv.js'
import { checkRateLimit, getClientIp } from '../_lib/rateLimit.js'
import { sendDevisRelanceEmail } from '../_lib/sendDevisRelanceEmail.js'

const supabaseAdmin = createClient(requireEnv('VITE_SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'))

/** Même garde-fou que api/devis/share.ts. */
async function getVerifiedUserId(req: VercelRequest): Promise<string | null> {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return null
  const token = header.slice('Bearer '.length)
  const { data, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !data.user) return null
  return data.user.id
}

const RelanceDevisSchema = z.object({
  shareId: z.string().min(1),
  clientEmail: z.string().email(),
  clientName: z.string().min(1),
  companyName: z.string().optional(),
  replyToEmail: z.string().email().optional().or(z.literal('')),
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

  const allowed = await checkRateLimit(supabaseAdmin, `devis-relance:${getClientIp(req)}`, {
    maxRequests: 10,
    windowSeconds: 60,
  })
  if (!allowed) {
    res.status(429).json({ error: 'Trop de tentatives — réessaie dans une minute.' })
    return
  }

  const parsed = RelanceDevisSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Requête invalide.' })
    return
  }
  const input = parsed.data

  // Le devis partagé doit exister et appartenir à l'utilisatrice authentifiée — jamais relancer le devis d'une autre.
  const { data: share, error: fetchError } = await supabaseAdmin
    .from('devis_partages')
    .select('user_id')
    .eq('id', input.shareId)
    .maybeSingle()
  if (fetchError || !share) {
    res.status(404).json({ error: 'Devis introuvable.' })
    return
  }
  if (share.user_id !== userId) {
    res.status(403).json({ error: 'Ce devis ne vous appartient pas.' })
    return
  }

  const ok = await sendDevisRelanceEmail({
    clientEmail: input.clientEmail,
    clientName: input.clientName,
    shareId: input.shareId,
    companyName: input.companyName,
    replyToEmail: input.replyToEmail || undefined,
  })

  res.status(200).json({ ok })
}
