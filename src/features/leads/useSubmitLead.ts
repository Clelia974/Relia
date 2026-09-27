import { useState } from 'react'
import type { LeadFormValues } from '@/features/leads/leadForm.schema'

interface UseSubmitLeadResult {
  submitLead: (userId: string, values: LeadFormValues) => Promise<boolean>
  isLoading: boolean
  error: string | null
}

/**
 * Envoie une demande depuis le formulaire public (jamais authentifié —
 * une prospect n'a pas de compte) vers api/leads.ts, seule porte
 * d'écriture sur la table `leads` (clé service_role, rate limitée).
 */
export function useSubmitLead(): UseSubmitLeadResult {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submitLead = async (userId: string, values: LeadFormValues): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          clientName: values.clientName,
          clientPhone: values.clientPhone || undefined,
          clientEmail: values.clientEmail || undefined,
          eventType: values.eventType,
          eventDate: new Date(values.eventDate).toISOString(),
          venue: values.venue || undefined,
          guestCount: values.guestCount === '' ? undefined : Number(values.guestCount),
          budgetEstimate: values.budgetEstimate === '' ? undefined : Number(values.budgetEstimate),
          message: values.message || undefined,
          source: values.source,
        }),
      })
      const data = (await response.json()) as { ok?: boolean; error?: string }
      if (!response.ok || !data.ok) throw new Error(data.error ?? 'Impossible d’envoyer la demande.')
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l’envoi de la demande.')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return { submitLead, isLoading, error }
}
