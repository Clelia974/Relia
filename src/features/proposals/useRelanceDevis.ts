import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface UseRelanceDevisResult {
  relanceDevis: (input: {
    shareId: string
    clientEmail: string
    clientName: string
    companyName?: string
    replyToEmail?: string
    customMessage?: string
  }) => Promise<boolean>
  isLoading: boolean
}

/**
 * Envoie un email de rappel pour un devis déjà partagé (cf. api/devis/relance.ts)
 * — ne recrée jamais le partage, réutilise le lien existant. Best-effort :
 * la tâche de relance interne est reprogrammée quoi qu'il arrive (cf.
 * LeadsInboxPage.handleRelance), l'email est un bonus.
 */
export function useRelanceDevis(): UseRelanceDevisResult {
  const [isLoading, setIsLoading] = useState(false)

  const relanceDevis = async (input: {
    shareId: string
    clientEmail: string
    clientName: string
    companyName?: string
    replyToEmail?: string
    customMessage?: string
  }): Promise<boolean> => {
    setIsLoading(true)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) return false
      const response = await fetch('/api/devis/relance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify(input),
      })
      const data = (await response.json()) as { ok?: boolean }
      return response.ok && Boolean(data.ok)
    } catch {
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return { relanceDevis, isLoading }
}
