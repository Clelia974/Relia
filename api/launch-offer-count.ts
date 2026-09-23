import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL ?? '', process.env.SUPABASE_SERVICE_ROLE_KEY ?? '')

const LAUNCH_OFFER_LIMIT = 100

/**
 * Point d'accès public (pas d'authentification requise — appelé depuis la
 * landing, visitée par des personnes non connectées) qui renvoie
 * uniquement un compte, jamais de ligne individuelle : rien de personnel
 * n'est exposé. C'est la seule source du nombre affiché sur la landing —
 * jamais un chiffre codé en dur côté front, pour ne jamais afficher une
 * fausse urgence.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Méthode non autorisée.' })
    return
  }

  const { count, error } = await supabaseAdmin
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('is_launch_offer', true)

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  const redeemed = count ?? 0
  const remaining = Math.max(0, LAUNCH_OFFER_LIMIT - redeemed)

  // Mise en cache courte côté CDN Vercel : ce nombre change rarement à la minute près, inutile de retaper Supabase à chaque chargement de la landing.
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=30')
  res.status(200).json({ limit: LAUNCH_OFFER_LIMIT, redeemed, remaining, available: remaining > 0 })
}
