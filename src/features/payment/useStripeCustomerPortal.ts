import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface UseStripeCustomerPortalResult {
  openCustomerPortal: () => Promise<void>
  isLoading: boolean
  error: string | null
}

/**
 * Ouvre le portail de facturation Stripe (moyen de paiement, factures,
 * annulation) via la fonction serveur (api/stripe/portal-session.ts) —
 * même principe que useStripeCheckout : pas de formulaire embarqué, une
 * redirection vers une page hébergée par Stripe. Envoie le jeton d'accès
 * Supabase courant (pas juste un `userId`) : c'est le serveur qui vérifie
 * qui appelle, jamais le client qui l'affirme.
 */
export function useStripeCustomerPortal(): UseStripeCustomerPortalResult {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const openCustomerPortal = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        setError('Vous devez être connectée pour gérer votre abonnement.')
        setIsLoading(false)
        return
      }
      const response = await fetch('/api/stripe/portal-session', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const data = (await response.json()) as { url?: string; error?: string }
      if (!response.ok || !data.url) throw new Error(data.error ?? 'Impossible d’ouvrir le portail de facturation.')
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l’ouverture du portail de facturation.')
      setIsLoading(false)
    }
    // Pas de setIsLoading(false) sur le chemin de succès : la page quitte immédiatement (redirection Stripe).
  }

  return { openCustomerPortal, isLoading, error }
}
