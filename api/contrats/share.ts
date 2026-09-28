import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { requireEnv } from '../_lib/requireEnv.js'
import { checkRateLimit, getClientIp } from '../_lib/rateLimit.js'
import { sendContratEmail } from '../_lib/sendContratEmail.js'

const supabaseAdmin = createClient(requireEnv('VITE_SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'))

/**
 * Retrouve la décoratrice à partir du jeton d'accès envoyé par le client
 * (en-tête Authorization) — même garde-fou que api/devis/share.ts.
 */
async function getVerifiedUserId(req: VercelRequest): Promise<string | null> {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return null
  const token = header.slice('Bearer '.length)
  const { data, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !data.user) return null
  return data.user.id
}

const ShareContratSchema = z.object({
  storagePath: z.string().min(1),
  fileName: z.string().min(1),
  clientEmail: z.string().email().optional().or(z.literal('')),
  clientName: z.string().min(1),
  companyName: z.string().optional(),
  replyToEmail: z.string().email().optional().or(z.literal('')),
  customMessage: z.string().max(2000).optional(),
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

  const allowed = await checkRateLimit(supabaseAdmin, `contrat-share:${getClientIp(req)}`, {
    maxRequests: 10,
    windowSeconds: 60,
  })
  if (!allowed) {
    res.status(429).json({ error: 'Trop de tentatives — réessaie dans une minute.' })
    return
  }

  const parsed = ShareContratSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Contrat invalide — vérifie les champs et réessaie.' })
    return
  }
  const input = parsed.data

  // Le chemin doit être dans le dossier de la décoratrice authentifiée — jamais celui d'une autre (cf. policy storage RLS "own folder").
  if (!input.storagePath.startsWith(`${userId}/`)) {
    res.status(403).json({ error: 'Ce fichier ne vous appartient pas.' })
    return
  }

  const { data, error: insertError } = await supabaseAdmin
    .from('contrats_partages')
    .insert({ user_id: userId, client_email: input.clientEmail || null, storage_path: input.storagePath, file_name: input.fileName })
    .select('id')
    .single()
  if (insertError || !data) {
    console.error('Erreur création du contrat partagé :', insertError?.message)
    res.status(500).json({ error: 'Erreur interne.' })
    return
  }

  // Best-effort : le contrat est déjà enregistré et consultable via son lien à ce stade, un échec d'envoi ne doit jamais faire échouer la requête.
  if (input.clientEmail) {
    await sendContratEmail({
      clientEmail: input.clientEmail,
      clientName: input.clientName,
      shareId: data.id,
      companyName: input.companyName,
      replyToEmail: input.replyToEmail || undefined,
      customMessage: input.customMessage,
    })
  }

  res.status(200).json({ ok: true, shareId: data.id })
}
