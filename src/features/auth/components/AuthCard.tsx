import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

/** Chrome partagé des pages d'authentification (connexion/inscription/mot de passe) — même en-tête que LegalLayout, carte centrée pour le formulaire. */
export function AuthCard({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="border-b border-border/60">
        <div className="mx-auto flex h-16 w-full max-w-3xl items-center px-5 sm:px-8">
          <Link to="/" className="flex items-center gap-2" aria-label="Jordu — retour à l'accueil">
            <img src="/brand/jordu-wordmark.svg" alt="Jordu — retour à l'accueil" width={86} height={36} className="h-9 w-auto dark:hidden" />
            <img
              src="/brand/jordu-wordmark-reversed.svg"
              alt="Jordu — retour à l'accueil"
              width={86}
              height={36}
              className="hidden h-9 w-auto dark:block"
            />
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="font-heading text-xl">{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      </main>
    </div>
  )
}
