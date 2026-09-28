import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { DevisSnapshot } from '@/features/proposals/devisSnapshot'

interface UseShareDevisResult {
  shareDevis: (input: { snapshot: DevisSnapshot; clientEmail?: string; clientName: string; customMessage?: string }) => Promise<string | null>
  isLoading: boolean
  error: string | null
}

/**
 * Enregistre un instantané du devis via api/devis/share.ts (seule porte
 * d'écriture sur devis_partages) et déclenche l'email à la cliente si une
 * adresse est renseignée — même principe d'envoi du jeton d'accès Supabase
 * que useStripeCheckout.ts, jamais un userId affirmé côté client.
 */
export function useShareDevis(): UseShareDevisResult {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const shareDevis = async (input: {
    snapshot: DevisSnapshot
    clientEmail?: string
    clientName: string
    customMessage?: string
  }): Promise<string | null> => {
    setIsLoading(true)
    setError(null)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        setError('Vous devez être connectée pour envoyer un devis.')
        return null
      }
      const response = await fetch('/api/devis/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify(input),
      })
      const data = (await response.json()) as { ok?: boolean; shareId?: string; error?: string }
      if (!response.ok || !data.ok || !data.shareId) throw new Error(data.error ?? "Impossible d'envoyer le devis.")
      return data.shareId
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'envoi du devis.")
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { shareDevis, isLoading, error }
}
