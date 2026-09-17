import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

/** Route catch-all (`*`) — toute URL non reconnue atterrit ici plutôt que sur un écran blanc. */
export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-border px-6 py-16 text-center">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground">404 — Page non trouvée.</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Cette page n'existe pas ou plus. Vérifiez l'adresse, ou revenez à l'accueil.
        </p>
      </div>
      <Button asChild>
        <Link to="/aujourdhui">Revenir à l'accueil</Link>
      </Button>
    </div>
  )
}
