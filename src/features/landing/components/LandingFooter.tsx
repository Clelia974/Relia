import { CONTACT_EMAIL } from '@/features/landing/landingContent'
import { LegalLinks } from '@/features/legal/LegalLinks'
import { cn } from '@/lib/utils'

const CONTAINER = 'mx-auto w-full max-w-5xl px-5 sm:px-8'

/** Pied de page commun à la landing et à la page produit. */
export function LandingFooter() {
  return (
    <footer className="border-t border-border py-12">
      <div className={cn(CONTAINER, 'flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between')}>
        <p>
          Une question ? Écris à{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-foreground underline underline-offset-4">
            {CONTACT_EMAIL}
          </a>
        </p>
        <p>© {new Date().getFullYear()} SilkyPlace · Événements Clés</p>
      </div>
      <div className={cn(CONTAINER, 'mt-2 text-sm text-muted-foreground')}>
        <p>SilkyPlace — L’organisation pensée pour les décoratrices et décorateurs de mariage indépendants.</p>
        <p className="mt-1">Les devis et factures générés sont indicatifs : vérifie tes obligations légales avant émission.</p>
      </div>
      <div className={cn(CONTAINER, 'mt-4')}>
        <LegalLinks />
      </div>
    </footer>
  )
}
