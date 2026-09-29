import { PAIN_CLOSING, PAIN_MOMENTS } from '@/features/landing/landingContent'

/** 4 moments reconnaissables (PAIN_MOMENTS) + la chute « Et parfois… » (PAIN_CLOSING) — texte de Clélia, repris tel quel. */
export function PainPointCards() {
  return (
    <div className="flex flex-col gap-6">
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {PAIN_MOMENTS.map((moment) => (
          <li key={moment.quote} className="rounded-xl bg-primary p-6 text-primary-foreground">
            <p className="font-heading text-lg font-semibold">{moment.quote}</p>
            <ul className="mt-3 flex flex-col gap-1 text-sm text-primary-foreground/80">
              {moment.lines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      <div className="rounded-xl border-2 border-primary bg-card p-6">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-thread-text">Et parfois…</p>
        <p className="mt-2 font-heading text-xl font-semibold leading-snug text-primary">{PAIN_CLOSING.quote}</p>
        <p className="mt-2 text-sm text-muted-foreground">{PAIN_CLOSING.lines.join(' ')}</p>
      </div>
    </div>
  )
}
