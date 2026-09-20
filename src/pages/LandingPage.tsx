import { ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="px-4 py-6 sm:px-6">
        <span className="font-heading text-lg font-semibold">Relia</span>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
        <div className="flex max-w-xl flex-col items-center gap-6 text-center">
          <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-thread-text">
            <span className="h-1.5 w-1.5 rounded-full bg-thread" aria-hidden="true" />
            Le fil conducteur de vos mariages.
          </span>

          <h1 className="text-balance font-heading text-3xl font-semibold sm:text-4xl">
            Vos mariages. Votre planning. Votre rentabilité.
          </h1>

          <p className="text-balance text-base text-muted-foreground sm:text-lg">
            Prestataires, planning, tâches, propositions et rentabilité : tout est enfin relié.
          </p>

          <Button size="lg" onClick={() => navigate('/onboarding')} className="mt-2">
            Commencer
          </Button>

          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            Aucune inscription · Vos données restent dans votre navigateur
          </p>
        </div>
      </main>
    </div>
  )
}
