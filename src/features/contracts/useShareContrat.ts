import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface UseShareContratResult {
  shareContrat: (input: {
    storagePath: string
    fileName: string
    clientEmail?: string
    clientName: string
    companyName?: string
    replyToEmail?: string
    customMessage?: string
  }) => Promise<string | null>
  isLoading: boolean
  error: string | null
}

/**
 * Enregistre le partage d'un contrat déjà uploadé (cf. useUploadContract)
 * via api/contrats/share.ts et déclenche l'email à la cliente si une
 * adresse est renseignée — même principe que useShareDevis.ts.
 */
export function useShareContrat(): UseShareContratResult {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const shareContrat = async (input: {
    storagePath: string
    fileName: string
    clientEmail?: string
    clientName: string
    companyName?: string
    replyToEmail?: string
    customMessage?: string
  }): Promise<string | null> => {
    setIsLoading(true)
    setError(null)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        setError('Vous devez être connectée pour envoyer un contrat.')
        return null
      }
      const response = await fetch('/api/contrats/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify(input),
      })
      const data = (await response.json()) as { ok?: boolean; shareId?: string; error?: string }
      if (!response.ok || !data.ok || !data.shareId) throw new Error(data.error ?? "Impossible d'envoyer le contrat.")
      return data.shareId
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'envoi du contrat.")
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { shareContrat, isLoading, error }
}
