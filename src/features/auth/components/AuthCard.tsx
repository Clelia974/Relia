import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SilkyPlaceWordmark } from '@/components/brand/SilkyPlaceWordmark'

/** Chrome partagé des pages d'authentification (connexion/inscription/mot de passe) — même en-tête que LegalLayout, carte centrée pour le formulaire. */
export function AuthCard({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <div className="landing-airy relative isolate flex min-h-dvh flex-col overflow-hidden bg-background text-foreground">
      {/* Même famille de couleurs que la landing : beige d'un côté, bleu pâle de l'autre, fondu par le crème. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          // Beige d'un côté, bleu très pâle de l'autre, fondu continu par le crème au milieu.
          backgroundImage:
            'linear-gradient(105deg, rgb(246 222 202) 0%, rgb(249 234 220) 22%, rgb(251 247 241) 50%, rgb(240 244 249) 78%, rgb(228 236 245) 100%)',
        }}
      />
      <header className="border-b border-border/60 bg-card/60 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-3xl items-center px-5 sm:px-8">
          <Link to="/" aria-label="SilkyPlace — retour à l'accueil">
            <SilkyPlaceWordmark className="font-heading text-2xl font-semibold tracking-tight" />
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
