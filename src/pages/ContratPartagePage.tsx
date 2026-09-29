import { useParams } from 'react-router-dom'
import { useContratPartage } from '@/features/contracts/useContratPartage'

/**
 * Page publique (jamais authentifiée) affichant un contrat partagé par
 * une décoratrice — /contrat/:shareId. Le fichier est un PDF uploadé par
 * elle-même (jamais généré par Zordi) ; aucun en-tête Zordi.
 */
export function ContratPartagePage() {
  const { shareId } = useParams<{ shareId: string }>()
  const { fileUrl, fileName, isLoading, error } = useContratPartage(shareId)

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <main className="flex flex-1 flex-col items-center gap-4 px-4 py-10 sm:px-6">
        {isLoading && <p className="text-sm text-muted-foreground">Chargement du contrat…</p>}
        {!isLoading && error && <p className="text-sm text-risk">{error}</p>}
        {!isLoading && fileUrl && (
          <div className="flex w-full max-w-3xl flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <p className="truncate text-sm font-medium text-foreground">{fileName}</p>
              <a
                href={fileUrl}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                Télécharger
              </a>
            </div>
            <iframe title={fileName ?? 'Contrat'} src={fileUrl} className="h-[80vh] w-full rounded-lg border border-border" />
          </div>
        )}
      </main>
    </div>
  )
}
