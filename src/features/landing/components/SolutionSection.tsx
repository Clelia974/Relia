import { ZORDI_FEATURE_LIST, ZORDI_NOT_LIST } from '@/features/landing/landingContent'

export function SolutionSection() {
  return (
    <div className="flex flex-col gap-8">
      <ul className="flex flex-wrap gap-2.5">
        {ZORDI_FEATURE_LIST.map((item) => (
          <li key={item} className="rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-foreground shadow-(--shadow-card)">
            {item}
          </li>
        ))}
      </ul>
      <ul className="flex flex-col gap-2 text-muted-foreground">
        {ZORDI_NOT_LIST.map((item) => (
          <li key={item} className="flex items-start gap-2.5">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-muted-foreground" aria-hidden="true" />
            {item}
          </li>
        ))}
      </ul>
      <p className="font-heading text-xl font-semibold text-[#680808]">Pour que ton organisation ne repose plus uniquement sur ta mémoire.</p>
    </div>
  )
}
