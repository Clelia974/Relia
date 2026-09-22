import { Spinner } from '@/components/ui/spinner'

/** Même motif que le fallback Suspense d'AppLayout (Spinner + "Chargement…"), en plein écran pour les gardes de routing (auth/espace) qui rendent avant que la mise en page de l'app ne soit montée. */
export function LoadingScreen() {
  return (
    <div className="flex min-h-dvh items-center justify-center gap-2 bg-background text-sm text-muted-foreground">
      <Spinner />
      Chargement…
    </div>
  )
}
