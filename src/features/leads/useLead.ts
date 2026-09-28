import { useEffect, useState } from 'react'
import { fetchLead } from '@/features/leads/leadsApi'
import type { Lead } from '@/schemas/lead'

interface UseLeadResult {
  lead: Lead | null
  isLoading: boolean
  error: string | null
}

/** Charge une demande précise (fiche client pour le devis) — RLS restreint déjà à la décoratrice propriétaire. */
export function useLead(leadId: string | undefined): UseLeadResult {
  const [lead, setLead] = useState<Lead | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!leadId) return
    let cancelled = false
    setIsLoading(true)
    setError(null)
    fetchLead(leadId)
      .then((result) => {
        if (!cancelled) setLead(result)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Erreur de chargement de la demande.')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [leadId])

  return { lead, isLoading, error }
}
