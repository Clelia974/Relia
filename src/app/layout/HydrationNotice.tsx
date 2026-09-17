import { useEffect } from 'react'
import { toast } from 'sonner'
import { exportRawBackupToFile } from '@/lib/workspace/importExport'
import { useWorkspaceStore } from '@/store/workspaceStore'

/** Notification discrète si les données LocalStorage étaient invalides au chargement. */
export function HydrationNotice() {
  const hydrationIssue = useWorkspaceStore((s) => s.hydrationIssue)
  const clearHydrationIssue = useWorkspaceStore((s) => s.clearHydrationIssue)
  const corruptedBackupRaw = useWorkspaceStore((s) => s.corruptedBackupRaw)

  useEffect(() => {
    if (!hydrationIssue) return

    const raw = corruptedBackupRaw
    toast.warning(hydrationIssue, {
      duration: Infinity,
      closeButton: true,
      action: raw
        ? {
            label: 'Exporter la sauvegarde',
            onClick: () => exportRawBackupToFile(raw),
          }
        : undefined,
    })
    clearHydrationIssue()
    // corruptedBackupRaw reste disponible (déjà capturé ci-dessus dans `raw`
    // pour le bouton d'export) : on ne l'efface pas ici pour ne pas priver
    // l'utilisatrice de la sauvegarde si elle rouvre ce composant plus tard.
  }, [hydrationIssue, clearHydrationIssue, corruptedBackupRaw])

  return null
}
