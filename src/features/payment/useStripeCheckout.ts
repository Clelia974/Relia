import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface UseStripeCheckoutResult {
  createCheckoutSession: (priceId: string) => Promise<void>
  isLoading: boolean
  error: string | null
}

/**
 * Crée une session Stripe Checkout via la fonction serveur
 * (api/stripe/checkout-session.ts, seule à connaître STRIPE_SECRET_KEY)
 * puis redirige vers la page hébergée par Stripe — pas de formulaire
 * embarqué, pas de `@stripe/stripe-js` côté client. Envoie le jeton
 * d'accès Supabase courant (pas un userId/userEmail) : c'est le serveur
 * qui vérifie qui appelle, jamais le client qui l'affirme — même
 * principe que useStripeCustomerPortal.
 */
export function useStripeCheckout(): UseStripeCheckoutResult {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createCheckoutSession = async (priceId: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        setError('Vous devez être connecté·e pour vous abonner.')
        setIsLoading(false)
        return
      }
      const response = await fetch('/api/stripe/checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ priceId }),
      })
      const data = (await response.json()) as { url?: string; error?: string }
      if (!response.ok || !data.url) throw new Error(data.error ?? 'Impossible de créer la session de paiement.')
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la préparation du paiement.')
      setIsLoading(false)
    }
    // Pas de setIsLoading(false) sur le chemin de succès : la page quitte immédiatement (redirection Stripe).
  }

  return { createCheckoutSession, isLoading, error }
}
