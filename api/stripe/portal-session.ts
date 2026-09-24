import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { requireEnv } from '../_lib/requireEnv.js'

const stripe = new Stripe(requireEnv('STRIPE_SECRET_KEY'))

/**
 * Client admin (clé service_role) — même convention que webhook.ts :
 * contourne RLS, jamais utilisé ailleurs que côté serveur. Sert ici à
 * deux choses : vérifier le jeton d'accès envoyé par le client
 * (`auth.getUser`) et lire `stripe_customer_id` sur `public.users`.
 */
const supabaseAdmin = createClient(requireEnv('VITE_SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'))

/**
 * Retrouve l'utilisateur Supabase à partir du jeton d'accès envoyé par le
 * client (en-tête Authorization), jamais à partir d'un `userId` fourni
 * dans le corps de la requête : ce portail donne accès aux moyens de
 * paiement et à l'historique de facturation d'un compte précis — accepter
 * un `userId` du client permettrait à n'importe qui de demander le
 * portail de facturation de n'importe quelle autre utilisatrice en
 * changeant simplement cette valeur.
 */
async function getVerifiedUserId(req: VercelRequest): Promise<string | null> {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return null
  const token = header.slice('Bearer '.length)
  const { data, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !data.user) return null
  return data.user.id
}

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

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('users')
    .select('stripe_customer_id')
    .eq('id', userId)
    .maybeSingle()
  if (profileError) {
    console.error('Erreur lecture du profil Supabase :', profileError.message)
    res.status(500).json({ error: 'Erreur interne.' })
    return
  }
  if (!profile?.stripe_customer_id) {
    res.status(400).json({ error: 'Aucun abonnement Stripe associé à ce compte pour le moment.' })
    return
  }

  const siteUrl = process.env.VITE_SITE_URL ?? 'https://relia-app.vercel.app'

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${siteUrl}/paiement`,
    })
    res.status(200).json({ url: session.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur Stripe inconnue.'
    console.error('Erreur création session du portail Stripe :', message)
    res.status(500).json({ error: 'Erreur interne.' })
  }
}
