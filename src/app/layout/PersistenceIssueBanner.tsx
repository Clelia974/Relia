import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { exportWorkspaceToFile } from '@/lib/workspace/importExport'
import { usePersistenceStatus } from '@/store/persistenceStatus'
import { useWorkspaceStore } from '@/store/workspaceStore'

/**
 * Bandeau persistant (pas un toast) affiché tant qu'une écriture vers
 * localStorage échoue — quota dépassé, stockage bloqué, etc. Contrairement à
 * HydrationNotice (un incident ponctuel au chargement), ce cas reste actif
 * tant que le problème n'est pas résolu : un toast qui disparaît seul
 * masquerait un risque de perte de données toujours en cours.
 */
export function PersistenceIssueBanner() {
  const persistenceIssue = usePersistenceStatus((s) => s.persistenceIssue)
  const clearPersistenceIssue = usePersistenceStatus((s) => s.clearPersistenceIssue)
  const retryPersist = useWorkspaceStore((s) => s.retryPersist)
  const workspace = useWorkspaceStore((s) => s.workspace)

  if (!persistenceIssue) return null

  return (
    <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6">
      <Alert variant="destructive">
        <AlertTitle>{persistenceIssue}</AlertTitle>
        <AlertDescription className="flex flex-col gap-2">
          <span>Exportez une sauvegarde de vos données avant de continuer.</span>
          <span className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={retryPersist}>
              Réessayer
            </Button>
            <Button size="sm" onClick={() => exportWorkspaceToFile(workspace)}>
              Exporter une sauvegarde
            </Button>
            <Button size="sm" variant="ghost" onClick={clearPersistenceIssue}>
              Ignorer
            </Button>
          </span>
        </AlertDescription>
      </Alert>
    </div>
  )
}
