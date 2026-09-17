import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

interface ErrorFallbackProps {
  errorId: string
  onRetry: () => void
}

/**
 * Écran de secours affiché par ErrorBoundary. Composant fonctionnel séparé
 * (plutôt qu'inlined dans la classe) pour pouvoir utiliser useNavigate — la
 * navigation existante de l'application, jamais un window.location.href brut.
 */
export function ErrorFallback({ errorId, onRetry }: ErrorFallbackProps) {
  const navigate = useNavigate()

  const handleGoHome = () => {
    onRetry()
    navigate('/aujourdhui')
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <div className="flex max-w-md flex-col gap-2">
        <h1 className="font-heading text-xl font-semibold text-foreground">Une erreur inattendue s'est produite.</h1>
        <p className="text-sm text-muted-foreground">Vos dernières données sauvegardées ne sont pas supprimées.</p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button onClick={onRetry}>Réessayer</Button>
        <Button variant="outline" onClick={handleGoHome}>
          Revenir à l'accueil
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Identifiant d'erreur : {errorId}</p>
    </div>
  )
}
