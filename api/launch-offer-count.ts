import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { requireEnv } from './_lib/requireEnv.js'

const supabaseAdmin = createClient(requireEnv('VITE_SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'))

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

  // Lu depuis le même compteur atomique que le webhook incrémente (launch_offer_counter, cf.
  // 005_launch_offer_counter.sql) — jamais un `count(*)` séparé sur `users`, qui pourrait diverger
  // de ce qui a réellement été accordé sous concurrence.
  const { data, error } = await supabaseAdmin.from('launch_offer_counter').select('redeemed_count').eq('id', 1).maybeSingle()

  if (error) {
    console.error('Erreur lecture du compteur offre de lancement :', error.message)
    res.status(500).json({ error: 'Erreur interne.' })
    return
  }

  const redeemed = data?.redeemed_count ?? 0
  const remaining = Math.max(0, LAUNCH_OFFER_LIMIT - redeemed)

  // Mise en cache courte côté CDN Vercel : ce nombre change rarement à la minute près, inutile de retaper Supabase à chaque chargement de la landing.
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=30')
  res.status(200).json({ limit: LAUNCH_OFFER_LIMIT, redeemed, remaining, available: remaining > 0 })
}
