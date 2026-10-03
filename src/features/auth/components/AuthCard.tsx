import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SilkyPlaceWordmark } from '@/components/brand/SilkyPlaceWordmark'

/** Chrome partagé des pages d'authentification (connexion/inscription/mot de passe) — même en-tête que LegalLayout, carte centrée pour le formulaire. */
export function AuthCard({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <div className="landing-airy relative isolate flex min-h-dvh flex-col overflow-hidden bg-background text-foreground">
      {/* Même famille de couleurs que la landing : beige pêche qui s'adoucit en crème, avec une trace de bleu pâle seulement dans un coin. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage: [
            'radial-gradient(90rem 70rem at 0% 0%, rgb(246 217 196 / 0.75) 0%, rgb(246 224 207 / 0.45) 35%, rgb(250 240 230 / 0.15) 60%, transparent 80%)',
            'radial-gradient(80rem 60rem at 100% 100%, rgb(233 228 207 / 0.60) 0%, rgb(240 236 220 / 0.30) 40%, transparent 75%)',
            'radial-gradient(80rem 60rem at 100% 0%, rgb(221 230 239 / 0.80) 0%, rgb(226 234 242 / 0.50) 35%, rgb(235 241 247 / 0.20) 60%, transparent 80%)',
            'radial-gradient(70rem 50rem at 0% 100%, rgb(221 230 239 / 0.40) 0%, rgb(232 238 244 / 0.15) 45%, transparent 75%)',
          ].join(','),
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
