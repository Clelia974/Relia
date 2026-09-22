import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '')

/**
 * Liste blanche des prix acceptés — ne jamais faire confiance à un
 * `priceId` envoyé par le client sans le vérifier contre nos propres
 * prix Stripe, sans quoi n'importe qui pourrait demander une session de
 * paiement pour un prix arbitraire.
 */
const ALLOWED_PRICE_IDS = new Set(
  [process.env.VITE_STRIPE_PRICE_SOLO_MONTHLY, process.env.VITE_STRIPE_PRICE_SOLO_YEARLY].filter(
    (id): id is string => Boolean(id),
  ),
)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Méthode non autorisée.' })
    return
  }

  const { priceId, userId, userEmail } = (req.body ?? {}) as { priceId?: string; userId?: string; userEmail?: string }
  if (!priceId || !userId || !userEmail) {
    res.status(400).json({ error: 'Champs requis manquants (priceId, userId, userEmail).' })
    return
  }
  if (!ALLOWED_PRICE_IDS.has(priceId)) {
    res.status(400).json({ error: 'Offre inconnue.' })
    return
  }

  const siteUrl = process.env.VITE_SITE_URL ?? 'https://relia-app.vercel.app'

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: userEmail,
      // Seul champ qui relie la session à notre utilisateur Supabase — lu dans le webhook checkout.session.completed.
      client_reference_id: userId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/paiement?paiement=succes`,
      cancel_url: `${siteUrl}/paiement?paiement=annule`,
    })
    res.status(200).json({ url: session.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur Stripe inconnue.'
    console.error('Erreur création session de paiement Stripe :', message)
    res.status(500).json({ error: message })
  }
}
