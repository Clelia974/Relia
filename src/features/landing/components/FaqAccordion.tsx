import { ChevronDown } from 'lucide-react'
import { FAQ } from '@/features/landing/landingContent'

/** Même contenu et même pattern (details/summary natif) que la vraie landing — pas de duplication de copie. */
export function FaqAccordion() {
  return (
    <div className="divide-y divide-border border-y border-border">
      {FAQ.map((item) => (
        <details key={item.q} className="group py-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-md text-left font-heading text-lg font-semibold text-foreground outline-none marker:content-none focus-visible:ring-3 focus-visible:ring-ring/40">
            {item.q}
            <ChevronDown className="size-5 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" aria-hidden="true" />
          </summary>
          <p className="mt-3 leading-relaxed text-muted-foreground">{item.a}</p>
        </details>
      ))}
    </div>
  )
}
