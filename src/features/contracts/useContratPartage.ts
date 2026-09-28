import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface UseContratPartageResult {
  fileUrl: string | null
  fileName: string | null
  isLoading: boolean
  error: string | null
}

/**
 * Lecture publique (jamais authentifiée) d'un contrat partagé — récupère
 * les métadonnées (contrats_partages, lecture publique par id exact) puis
 * construit l'URL publique du fichier dans le bucket "contrats". Même
 * principe que useDevisPartage.ts.
 */
export function useContratPartage(shareId: string | undefined): UseContratPartageResult {
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
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
      const { data, error: fetchError } = await supabase
        .from('contrats_partages')
        .select('storage_path, file_name')
        .eq('id', shareId!)
        .maybeSingle()
      if (cancelled) return
      if (fetchError) {
        setError('Erreur lors du chargement du contrat.')
      } else if (!data) {
        setError('Ce contrat est introuvable — le lien est peut-être incorrect.')
      } else {
        const { data: urlData } = supabase.storage.from('contrats').getPublicUrl(data.storage_path)
        setFileUrl(urlData.publicUrl)
        setFileName(data.file_name)
      }
      if (!cancelled) setIsLoading(false)
    }
    load()

    return () => {
      cancelled = true
    }
  }, [shareId])

  return { fileUrl, fileName, isLoading, error }
}
