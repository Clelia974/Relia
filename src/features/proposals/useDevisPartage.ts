import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { DevisSnapshotSchema, type DevisSnapshot } from '@/features/proposals/devisSnapshot'

interface UseDevisPartageResult {
  snapshot: DevisSnapshot | null
  isLoading: boolean
  error: string | null
}

/**
 * Lecture publique (jamais authentifiée) d'un devis partagé via
 * devis_partages — policy RLS "select" ouverte à tous, mais uniquement
 * par id exact (pas de liste) : le lien lui-même fait office de clé.
 */
export function useDevisPartage(shareId: string | undefined): UseDevisPartageResult {
  const [snapshot, setSnapshot] = useState<DevisSnapshot | null>(null)
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
      const { data, error: fetchError } = await supabase.from('devis_partages').select('snapshot').eq('id', shareId!).maybeSingle()
      if (cancelled) return
      if (fetchError) {
        setError('Erreur lors du chargement du devis.')
      } else if (!data) {
        setError('Ce devis est introuvable — le lien est peut-être incorrect.')
      } else {
        const parsed = DevisSnapshotSchema.safeParse(data.snapshot)
        if (!parsed.success) setError('Erreur lors du chargement du devis.')
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
