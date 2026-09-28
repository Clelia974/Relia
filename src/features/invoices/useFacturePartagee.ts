import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { FactureSnapshotSchema, type FactureSnapshot } from '@/features/invoices/factureSnapshot'

interface UseFacturePartageeResult {
  snapshot: FactureSnapshot | null
  isLoading: boolean
  error: string | null
}

/**
 * Lecture publique (jamais authentifiée) d'une facture partagée via
 * factures_partages — même principe que useDevisPartage.ts.
 */
export function useFacturePartagee(shareId: string | undefined): UseFacturePartageeResult {
  const [snapshot, setSnapshot] = useState<FactureSnapshot | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!shareId) {
      setIsLoading(false)
      setError('Lien invalide.')
      return
    }
    let cancelled = false
    setIsLoading(true)
    setError(null)

    async function load() {
      const { data, error: fetchError } = await supabase.from('factures_partages').select('snapshot').eq('id', shareId!).maybeSingle()
      if (cancelled) return
      if (fetchError) {
        setError('Erreur lors du chargement de la facture.')
      } else if (!data) {
        setError('Cette facture est introuvable — le lien est peut-être incorrect.')
      } else {
        const parsed = FactureSnapshotSchema.safeParse(data.snapshot)
        if (!parsed.success) setError('Erreur lors du chargement de la facture.')
        else setSnapshot(parsed.data)
      }
      if (!cancelled) setIsLoading(false)
    }
    load()

    return () => {
      cancelled = true
    }
  }, [shareId])

  return { snapshot, isLoading, error }
}
