import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'

interface UseStripeCheckoutResult {
  createCheckoutSession: (priceId: string) => Promise<void>
  isLoading: boolean
  error: string | null
}

/**
 * Crée une session Stripe Checkout via la fonction serveur
 * (api/stripe/checkout-session.ts, seule à connaître STRIPE_SECRET_KEY)
 * puis redirige vers la page hébergée par Stripe — pas de formulaire
 * embarqué, pas de `@stripe/stripe-js` côté client.
 */
export function useStripeCheckout(): UseStripeCheckoutResult {
  const { user, isAuthenticated } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createCheckoutSession = async (priceId: string) => {
    if (!isAuthenticated || !user) {
      setError('Vous devez être connecté·e pour vous abonner.')
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/stripe/checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, userId: user.id, userEmail: user.email }),
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
