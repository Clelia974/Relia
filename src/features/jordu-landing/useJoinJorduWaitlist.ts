import { useState } from 'react'

interface UseJoinJorduWaitlistResult {
  join: (email: string) => Promise<boolean>
  isLoading: boolean
  error: string | null
}

/**
 * Envoie une adresse email depuis la landing /jordu vers api/waitlist.ts,
 * seule porte d'écriture sur `jordu_waitlist` (clé service_role, rate limitée).
 */
export function useJoinJorduWaitlist(): UseJoinJorduWaitlistResult {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const join = async (email: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'jordu_landing' }),
      })
      const data = (await response.json()) as { ok?: boolean; error?: string }
      if (!response.ok || !data.ok) throw new Error(data.error ?? 'Impossible d’enregistrer ton adresse.')
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l’inscription.')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return { join, isLoading, error }
}
