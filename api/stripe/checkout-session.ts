import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '')
const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL ?? '', process.env.SUPABASE_SERVICE_ROLE_KEY ?? '')

const LAUNCH_OFFER_PRICE_ID = process.env.VITE_STRIPE_PRICE_LAUNCH_OFFER
const LAUNCH_OFFER_LIMIT = 100
/** Identifie une session créée pour l'offre de lancement — lu par le webhook pour ne compter que ces abonnements-là dans is_launch_offer. */
const LAUNCH_OFFER_METADATA = { offer: 'launch_100' }

/**
 * Liste blanche des prix acceptés — ne jamais faire confiance à un
 * `priceId` envoyé par le client sans le vérifier contre nos propres
 * prix Stripe, sans quoi n'importe qui pourrait demander une session de
 * paiement pour un prix arbitraire.
 */
const ALLOWED_PRICE_IDS = new Set(
  [process.env.VITE_STRIPE_PRICE_SOLO_MONTHLY, process.env.VITE_STRIPE_PRICE_SOLO_YEARLY, LAUNCH_OFFER_PRICE_ID].filter(
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

  const isLaunchOffer = Boolean(LAUNCH_OFFER_PRICE_ID) && priceId === LAUNCH_OFFER_PRICE_ID
  if (isLaunchOffer) {
    // Re-vérifié ici, jamais laissé à la seule discrétion de l'affichage front : la landing peut afficher un
    // nombre de places vieux de quelques secondes (cache CDN), donc le blocage réel doit être posé au moment
    // de la création de la session, pas seulement au chargement de la page.
    const { count, error: countError } = await supabaseAdmin
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('is_launch_offer', true)
    if (countError) {
      res.status(500).json({ error: countError.message })
      return
    }
    if ((count ?? 0) >= LAUNCH_OFFER_LIMIT) {
      res.status(400).json({ error: "L'offre de lancement est terminée — les 100 places ont déjà été prises." })
      return
    }
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
      ...(isLaunchOffer
        ? {
            // Premier prélèvement repoussé de 30 jours — le vrai mois offert, pas juste une mention marketing.
            subscription_data: { trial_period_days: 30 },
            metadata: LAUNCH_OFFER_METADATA,
          }
        : {}),
    })
    res.status(200).json({ url: session.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur Stripe inconnue.'
    console.error('Erreur création session de paiement Stripe :', message)
    res.status(500).json({ error: message })
  }
}
