import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { requireEnv } from '../_lib/requireEnv.js'
import { checkRateLimit, getClientIp } from '../_lib/rateLimit.js'
import { sendFactureEmail } from '../_lib/sendFactureEmail.js'

const supabaseAdmin = createClient(requireEnv('VITE_SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'))

/**
 * Retrouve la décoratrice à partir du jeton d'accès envoyé par le client
 * (en-tête Authorization) — une facture n'existe que pour un mariage déjà
 * signé, donc toujours une décoratrice connectée. Même garde-fou que
 * api/devis/share.ts.
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
 * client (InvoicePreviewPage), pas une saisie publique arbitraire — on
 * vérifie juste la forme minimale, jamais chaque champ imbriqué.
 */
const ShareFactureSchema = z.object({
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

  const allowed = await checkRateLimit(supabaseAdmin, `facture-share:${getClientIp(req)}`, {
    maxRequests: 10,
    windowSeconds: 60,
  })
  if (!allowed) {
    res.status(429).json({ error: 'Trop de tentatives — réessaie dans une minute.' })
    return
  }

  const parsed = ShareFactureSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Facture invalide — vérifie les champs et réessaie.' })
    return
  }
  const input = parsed.data

  const { data, error: insertError } = await supabaseAdmin
    .from('factures_partages')
    .insert({ user_id: userId, client_email: input.clientEmail || null, snapshot: input.snapshot })
    .select('id')
    .single()
  if (insertError || !data) {
    console.error('Erreur création de la facture partagée :', insertError?.message)
    res.status(500).json({ error: 'Erreur interne.' })
    return
  }

  // Best-effort : la facture est déjà enregistrée et consultable via son lien à ce stade, un échec d'envoi ne doit jamais faire échouer la requête.
  if (input.clientEmail) {
    const businessConfig = input.snapshot.businessConfig as { companyName?: unknown; email?: unknown } | undefined
    const companyName = typeof businessConfig?.companyName === 'string' ? businessConfig.companyName : undefined
    const replyToEmail = typeof businessConfig?.email === 'string' ? businessConfig.email : undefined
    await sendFactureEmail({ clientEmail: input.clientEmail, clientName: input.clientName, shareId: data.id, companyName, replyToEmail })
  }

  res.status(200).json({ ok: true, shareId: data.id })
}
