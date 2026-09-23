import { CircleHelp, PackageX, Phone, StickyNote, TriangleAlert } from 'lucide-react'
import { PAIN_POINTS } from '@/features/landing/landingContent'

/** Même contenu que PAIN_POINTS (landingContent.ts), juste une icône par carte — rien d'inventé. */
const ICONS = [StickyNote, PackageX, CircleHelp, TriangleAlert, Phone]

export function PainPointCards() {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {PAIN_POINTS.map((point, i) => {
        const Icon = ICONS[i % ICONS.length]
        return (
          <li key={point.title} className="rounded-xl bg-primary p-6 text-primary-foreground">
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary-foreground/15">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <p className="mt-4 font-heading text-lg font-semibold">{point.title}</p>
            <p className="mt-2 text-sm leading-relaxed text-primary-foreground/80">{point.text}</p>
          </li>
        )
      })}
      {/* Chute — reprise telle quelle de LandingPage.tsx (même comportement de grille : elle comble la case
          restante plutôt que de s'étaler sur une ligne à part). */}
      <li className="flex items-center rounded-xl border-2 border-primary bg-card p-6 sm:col-span-2 lg:col-span-1">
        <p className="font-heading text-xl font-semibold leading-snug text-primary">
          Ce n’est pas toi. C’est l’outil qui manque.
        </p>
      </li>
    </ul>
  )
}
