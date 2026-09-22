import { useState } from 'react'
import { pushWorkspaceBackup } from '@/features/sync/workspaceBackup'
import { useAuth } from '@/hooks/useAuth'
import { useWorkspaceStore } from '@/store/workspaceStore'

interface UseSyncToCloudResult {
  syncNow: () => Promise<void>
  isSyncing: boolean
  error: string | null
  /** ISO — dernière sauvegarde réussie *dans cette session* ; ne reflète pas un `synced_at` déjà en base avant l'arrivée sur la page. */
  lastSyncedAt: string | null
}

/**
 * Poussée manuelle, opt-in (bouton "Sauvegarder" dans /parametres) —
 * jamais automatique en continu. localStorage reste la source de vérité :
 * ceci écrase la sauvegarde cloud avec l'état local actuel, jamais
 * l'inverse (cf. useAutoRestoreOnLogin pour le sens contraire, qui ne
 * s'exécute lui-même que si l'espace local est encore vide).
 */
export function useSyncToCloud(): UseSyncToCloudResult {
  const { user, isAuthenticated } = useAuth()
  const workspace = useWorkspaceStore((s) => s.workspace)
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null)

  const syncNow = async () => {
    if (!isAuthenticated || !user) {
      setError('Vous devez être connecté·e pour sauvegarder en ligne.')
      return
    }
    setIsSyncing(true)
    setError(null)
    try {
      await pushWorkspaceBackup(user.id, workspace)
      setLastSyncedAt(new Date().toISOString())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde en ligne.')
    } finally {
      setIsSyncing(false)
    }
  }

  return { syncNow, isSyncing, error, lastSyncedAt }
}
