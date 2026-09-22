import type { ReactNode } from 'react'
import { Check } from 'lucide-react'

/** Puce à coche verte — utilisée par les listes de fonctionnalités de la landing (Tarifs) et de la page Abonnement (/paiement), même source (`GRATUIT_FEATURES`/`PRO_FEATURES` dans landingContent.ts). */
export function PlanFeature({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-sage/30 text-success">
        <Check className="size-3.5" aria-hidden="true" />
      </span>
      <span>{children}</span>
    </li>
  )
}
