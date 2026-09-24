import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '')

/**
 * Client admin (clé service_role) — contourne RLS, jamais utilisé
 * ailleurs que dans ce webhook server-side. Ne JAMAIS préfixer
 * SUPABASE_SERVICE_ROLE_KEY par VITE_ : ça la ferait embarquer dans le
 * bundle client.
 */
const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL ?? '', process.env.SUPABASE_SERVICE_ROLE_KEY ?? '')

// Désactive le parsing JSON par défaut : constructEvent exige le corps brut, non ré-encodé, pour vérifier la signature.
export const config = { api: { bodyParser: false } }

async function readRawBody(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : (chunk as Buffer))
  return Buffer.concat(chunks)
}

/**
 * Retrouve l'utilisateur Supabase à partir d'un id client Stripe —
 * nécessaire pour customer.subscription.deleted, qui ne porte PAS de
 * client_reference_id (ce champ n'existe que sur checkout.session.*).
 * stripe_customer_id est renseigné au premier checkout réussi (cf.
 * supabase/sql/003_add_stripe_customer_id.sql).
 */
async function findUserIdByStripeCustomerId(customerId: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin.from('users').select('id').eq('stripe_customer_id', customerId).maybeSingle()
  if (error) throw error
  return data?.id ?? null
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Méthode non autorisée.' })
    return
  }

  const signature = req.headers['stripe-signature']
  const secret = process.env.STRIPE_WEBHOOK_SECRET ?? ''
  if (!signature || typeof signature !== 'string') {
    res.status(400).json({ error: 'Signature Stripe manquante.' })
    return
  }

  let event: Stripe.Event
  try {
    const rawBody = await readRawBody(req)
    event = stripe.webhooks.constructEvent(rawBody, signature, secret)
  } catch (err) {
    console.error('Signature webhook Stripe invalide :', err)
    res.status(400).json({ error: 'Signature invalide.' })
    return
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.client_reference_id
        const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id
        // Posé par checkout-session.ts uniquement pour les prices de l'offre de lancement.
        const isLaunchOfferSession = session.metadata?.offer === 'launch_100'

        // Moment où une place est réellement consommée (pas à la création de la session — un abandon de
        // paiement ne doit jamais compter). claim_launch_offer_slot() est une seule instruction SQL atomique
        // (UPDATE ... WHERE redeemed_count < 100 RETURNING), donc jamais plus de 100 appels ne peuvent réussir
        // même si Stripe livre plusieurs webhooks de cette offre au même instant — contrairement à un simple
        // "compter puis écrire", qui laisserait une fenêtre de course entre deux webhooks traités en parallèle.
        let isLaunchOffer = false
        if (isLaunchOfferSession) {
          const { data: claimedCount, error: claimError } = await supabaseAdmin.rpc('claim_launch_offer_slot')
          if (claimError) throw claimError
          isLaunchOffer = claimedCount !== null
          if (!isLaunchOffer) {
            // Cas limite extrêmement rare : la vérification faite avant la création de la session Checkout
            // (api/stripe/checkout-session.ts) a laissé passer une 101e cliente parce que d'autres souscriptions
            // se sont confirmées entre-temps. Son abonnement Stripe reste actif au tarif verrouillé — on ne
            // annule jamais un paiement déjà accepté — mais elle n'est pas comptée dans les 100 : à traiter
            // manuellement si ça arrive un jour (support), pas une érreur applicative.
            console.warn(`Offre de lancement déjà à 100 places — abonnement de ${userId} activé mais non compté.`)
          }
        }

        if (userId) {
          const { error } = await supabaseAdmin
            .from('users')
            .update({ subscription_status: 'active', stripe_customer_id: customerId ?? null, is_launch_offer: isLaunchOffer })
            .eq('id', userId)
          if (error) throw error
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id
        const userId = await findUserIdByStripeCustomerId(customerId)
        if (userId) {
          const { error } = await supabaseAdmin.from('users').update({ subscription_status: 'cancelled' }).eq('id', userId)
          if (error) throw error
        }
        break
      }

      case 'invoice.payment_failed': {
        // Signalé, jamais bloquant côté schéma actuel (pas de statut 'payment_failed') — cf. src/features/payment/README.md.
        const invoice = event.data.object as Stripe.Invoice
        console.warn('Échec de paiement Stripe pour le client :', invoice.customer)
        break
      }

      default:
        break
    }
    res.status(200).json({ received: true })
  } catch (err) {
    console.error('Erreur traitement webhook Stripe :', err)
    res.status(500).json({ error: 'Erreur interne.' })
  }
}
