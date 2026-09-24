import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { requireEnv } from '../_lib/requireEnv.js'

const stripe = new Stripe(requireEnv('STRIPE_SECRET_KEY'))
const supabaseAdmin = createClient(requireEnv('VITE_SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'))

/**
 * Retrouve l'utilisatrice à partir du jeton d'accès envoyé par le client
 * (en-tête Authorization), jamais d'un userId/userEmail fourni dans le
 * corps de la requête : la session Stripe créée ici détermine QUEL compte
 * Supabase sera marqué "actif" par le webhook (client_reference_id) —
 * accepter ces champs tels quels permettrait à n'importe qui d'activer
 * l'abonnement d'un tiers en payant avec sa propre carte. Même garde-fou
 * que api/stripe/portal-session.ts.
 */
async function getVerifiedUser(req: VercelRequest): Promise<{ id: string; email: string } | null> {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return null
  const token = header.slice('Bearer '.length)
  const { data, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !data.user?.email) return null
  return { id: data.user.id, email: data.user.email }
}

/** Deux prices dédiés (mensuel + annuel) — même prix Stripe verrouillé quelle que soit la périodicité choisie par la cliente. */
const LAUNCH_OFFER_PRICE_IDS = new Set(
  [process.env.VITE_STRIPE_PRICE_LAUNCH_OFFER, process.env.VITE_STRIPE_PRICE_LAUNCH_OFFER_ANNUAL].filter(
    (id): id is string => Boolean(id),
  ),
)
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
  [process.env.VITE_STRIPE_PRICE_SOLO_MONTHLY, process.env.VITE_STRIPE_PRICE_SOLO_YEARLY, ...LAUNCH_OFFER_PRICE_IDS].filter(
    (id): id is string => Boolean(id),
  ),
)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Méthode non autorisée.' })
    return
  }

  const user = await getVerifiedUser(req)
  if (!user) {
    res.status(401).json({ error: 'Session invalide ou expirée — reconnectez-vous.' })
    return
  }

  const { priceId } = (req.body ?? {}) as { priceId?: string }
  if (!priceId) {
    res.status(400).json({ error: 'Champ requis manquant (priceId).' })
    return
  }
  if (!ALLOWED_PRICE_IDS.has(priceId)) {
    res.status(400).json({ error: 'Offre inconnue.' })
    return
  }

  const isLaunchOffer = LAUNCH_OFFER_PRICE_IDS.has(priceId)
  if (isLaunchOffer) {
    // Pré-vérification rapide, pour ne pas envoyer une cliente sur Stripe Checkout si l'offre est déjà
    // visiblement terminée. Ce n'est PAS le blocage définitif : un abandon de paiement ne doit jamais
    // consommer de place, donc la place n'est réellement accordée qu'à la confirmation (webhook,
    // claim_launch_offer_slot — incrémentation atomique, jamais plus de 100 réussites même sous
    // concurrence). Lire le même compteur ici évite juste une redirection inutile vers Stripe.
    const { data: counter, error: counterError } = await supabaseAdmin
      .from('launch_offer_counter')
      .select('redeemed_count')
      .eq('id', 1)
      .maybeSingle()
    if (counterError) {
      console.error('Erreur lecture du compteur offre de lancement :', counterError.message)
      res.status(500).json({ error: 'Erreur interne.' })
      return
    }
    if ((counter?.redeemed_count ?? 0) >= LAUNCH_OFFER_LIMIT) {
      res.status(400).json({ error: "L'offre de lancement est terminée — les 100 places ont déjà été prises." })
      return
    }
  }

  const siteUrl = process.env.VITE_SITE_URL ?? 'https://relia-app.vercel.app'

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: user.email,
      // Seul champ qui relie la session à notre utilisateur Supabase — lu dans le webhook checkout.session.completed.
      client_reference_id: user.id,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/paiement?paiement=succes`,
      cancel_url: `${siteUrl}/paiement?paiement=annule`,
      // Explicite plutôt que de compter sur le défaut Stripe : la carte est toujours collectée pendant le
      // Checkout, y compris avec un essai (trial_period_days) — jamais un "essai" qui ne débiterait personne
      // ensuite faute de moyen de paiement enregistré.
      payment_method_collection: 'always',
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
    res.status(500).json({ error: 'Erreur interne.' })
  }
}
