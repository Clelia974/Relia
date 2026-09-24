import { Check } from 'lucide-react'
import { SOLUTION_POINTS } from '@/features/landing/landingContent'

/**
 * Porté depuis LandingPage.tsx ("Découvre Relia") — même contenu et même
 * structure que la vraie landing, c'est le pont narratif entre le problème
 * et "Comment ça marche" qui manquait dans la version test.
 */
export function SolutionSection() {
  return (
    <div className="flex flex-col gap-10">
      <ul className="grid gap-x-10 gap-y-8 md:grid-cols-2">
        {SOLUTION_POINTS.map((point) => (
          <li key={point.title} className="flex gap-4">
            <span className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-sage/30 text-success">
              <Check className="size-4" aria-hidden="true" />
            </span>
            <div>
              <p className="font-heading text-xl font-semibold text-foreground">{point.title}</p>
              <p className="mt-1.5 leading-relaxed text-muted-foreground">{point.text}</p>
            </div>
          </li>
        ))}
      </ul>
      <p className="font-heading text-2xl font-semibold text-primary">Le résultat ? Tu respires. Tu crées. Tu réussis.</p>
    </div>
  )
}
