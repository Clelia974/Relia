import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { FactureSnapshot } from '@/features/invoices/factureSnapshot'

interface UseShareFactureResult {
  shareFacture: (input: { snapshot: FactureSnapshot; clientEmail?: string; clientName: string }) => Promise<string | null>
  isLoading: boolean
  error: string | null
}

/**
 * Enregistre un instantané de la facture via api/factures/share.ts (seule
 * porte d'écriture sur factures_partages) et déclenche l'email à la
 * cliente si une adresse est renseignée — même principe que useShareDevis.ts.
 */
export function useShareFacture(): UseShareFactureResult {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const shareFacture = async (input: { snapshot: FactureSnapshot; clientEmail?: string; clientName: string }): Promise<string | null> => {
    setIsLoading(true)
    setError(null)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        setError('Vous devez être connectée pour envoyer une facture.')
        return null
      }
      const response = await fetch('/api/factures/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify(input),
      })
      const data = (await response.json()) as { ok?: boolean; shareId?: string; error?: string }
      if (!response.ok || !data.ok || !data.shareId) throw new Error(data.error ?? "Impossible d'envoyer la facture.")
      return data.shareId
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'envoi de la facture.")
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { shareFacture, isLoading, error }
}
