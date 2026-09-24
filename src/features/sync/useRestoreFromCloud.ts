import { useState } from 'react'
import { fetchWorkspaceBackup } from '@/features/sync/workspaceBackup'
import { useAuth } from '@/hooks/useAuth'
import type { Workspace } from '@/types/entities'

interface UseRestoreFromCloudResult {
  /** Retourne l'espace trouvé (jamais appliqué ici) — au composant appelant de faire confirmer l'écrasement avant `replaceWorkspace`, même garde-fou que l'import de fichier JSON. */
  restoreNow: () => Promise<Workspace | null>
  isRestoring: boolean
  error: string | null
}

/**
 * Restauration manuelle, opt-in (bouton "Restaurer depuis le cloud" dans
 * /parametres) — complète useAutoRestoreOnLogin, qui ne se déclenche que sur
 * un espace jamais onboardé (premier login sur un appareil neuf). Ici,
 * l'utilisatrice peut re-tirer sa dernière sauvegarde à tout moment, même
 * si son espace local contient déjà quelque chose.
 */
export function useRestoreFromCloud(): UseRestoreFromCloudResult {
  const { user, isAuthenticated } = useAuth()
  const [isRestoring, setIsRestoring] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const restoreNow = async (): Promise<Workspace | null> => {
    if (!isAuthenticated || !user) {
      setError('Vous devez être connecté·e pour restaurer une sauvegarde en ligne.')
      return null
    }
    setIsRestoring(true)
    setError(null)
    try {
      const result = await fetchWorkspaceBackup(user.id)
      if (!result.found || !result.workspace) {
        setError('Aucune sauvegarde en ligne trouvée pour ce compte.')
        return null
      }
      return result.workspace
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la restauration.')
      return null
    } finally {
      setIsRestoring(false)
    }
  }

  return { restoreNow, isRestoring, error }
}
