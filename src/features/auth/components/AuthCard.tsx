import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SilkyPlaceWordmark } from '@/components/brand/SilkyPlaceWordmark'

/** Chrome partagé des pages d'authentification (connexion/inscription/mot de passe) — même en-tête que LegalLayout, carte centrée pour le formulaire. */
export function AuthCard({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <div className="landing-airy relative isolate flex min-h-dvh flex-col overflow-hidden bg-background text-foreground">
      {/* Même dégradé que la landing, beige et bleu pâle : le passage landing → inscription reste doux. */}
      <div aria-hidden="true" className="pointer-events-none absolute -left-40 -top-40 -z-10 size-[44rem] rounded-full bg-[#F6D9C4] opacity-70 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-40 top-10 -z-10 size-[40rem] rounded-full bg-[#DDE6EF] opacity-90 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 left-1/4 -z-10 size-[36rem] rounded-full bg-[#DDE6EF] opacity-70 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -left-24 -z-10 size-[28rem] rounded-full bg-[#E9E4CF] opacity-70 blur-3xl" />
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
