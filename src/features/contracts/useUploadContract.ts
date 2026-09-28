import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface UseUploadContractResult {
  uploadContract: (userId: string, file: File) => Promise<{ storagePath: string; fileName: string } | null>
  isLoading: boolean
  error: string | null
}

/**
 * Upload direct vers le bucket Supabase Storage "contrats" — jamais via
 * une fonction serverless (un contrat en PDF peut dépasser la limite de
 * taille d'un corps de requête Vercel) : le client authentifié uploade
 * lui-même, la policy RLS storage restreint l'écriture à son propre
 * dossier (préfixe = son user id). api/contrats/share.ts ne fait
 * qu'enregistrer le partage une fois le fichier déjà en place.
 */
export function useUploadContract(): UseUploadContractResult {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadContract = async (userId: string, file: File): Promise<{ storagePath: string; fileName: string } | null> => {
    setIsLoading(true)
    setError(null)
    try {
      const safeName = file.name.replace(/[^A-Za-z0-9._-]/g, '_')
      const storagePath = `${userId}/${crypto.randomUUID()}-${safeName}`
      const { error: uploadError } = await supabase.storage.from('contrats').upload(storagePath, file, { contentType: file.type })
      if (uploadError) throw uploadError
      return { storagePath, fileName: file.name }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'envoi du fichier.")
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { uploadContract, isLoading, error }
}
