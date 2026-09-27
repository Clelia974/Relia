import { useCallback, useEffect, useState } from 'react'
import { fetchNewLeads } from '@/features/leads/leadsApi'
import { useAuth } from '@/hooks/useAuth'
import type { Lead } from '@/schemas/lead'

interface UseLeadsInboxResult {
  leads: Lead[]
  isLoading: boolean
  error: string | null
  refresh: () => void
}

/** Charge les nouvelles demandes de l'utilisatrice connectée — RLS restreint déjà aux siennes. */
export function useLeadsInbox(): UseLeadsInboxResult {
  const { isAuthenticated } = useAuth()
  const [leads, setLeads] = useState<Lead[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState(0)

  const refresh = useCallback(() => setRefreshToken((t) => t + 1), [])

  useEffect(() => {
    if (!isAuthenticated) return
    let cancelled = false
    setIsLoading(true)
    setError(null)
    fetchNewLeads()
      .then((result) => {
        if (!cancelled) setLeads(result)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Erreur de chargement des demandes.')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [isAuthenticated, refreshToken])

  return { leads, isLoading, error, refresh }
}
