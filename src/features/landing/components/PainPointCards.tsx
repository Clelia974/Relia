import { PAIN_MOMENTS } from '@/features/landing/landingContent'

/**
 * 4 moments reconnaissables (texte de Clélia) — version cartes légères :
 * la question en titre, ses lignes en une seule phrase courte en dessous.
 */
export function PainPointCards() {
  return (
    <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      {PAIN_MOMENTS.map((moment) => (
        <li key={moment.quote} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-7 shadow-(--shadow-card)">
          <p className="font-heading text-lg font-semibold leading-snug text-[#520C0C]">{moment.quote}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{moment.lines.join(' ')}</p>
        </li>
      ))}
    </ul>
  )
}
