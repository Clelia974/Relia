import { useState } from 'react'
import { addDays, format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ArrowRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DAY_PHASE_LABELS } from '@/lib/dayPhase'

/**
 * Étapes illustratives — offsets génériques, pas calculés par le vrai
 * moteur de planning de l'app (comme le mockup "Bonjour Démonstration" du
 * hero actuel : une prévisualisation, pas une fonctionnalité branchée).
 * Les 4 phases du Jour J reprises ici SONT réelles (cf. src/lib/dayPhase.ts,
 * Vue Jour J) — seul l'habillage marketing autour est illustratif.
 */
function buildMilestones(weddingDate: Date) {
  return [
    { offsetLabel: 'J-90', dayOffset: -90, title: 'Prestataires confirmés' },
    { offsetLabel: 'J-30', dayOffset: -30, title: 'Devis et budget finalisés' },
    { offsetLabel: 'J-7', dayOffset: -7, title: 'Derniers ajustements planning' },
    {
      offsetLabel: 'Jour J',
      dayOffset: 0,
      title: [DAY_PHASE_LABELS.installation, DAY_PHASE_LABELS.ceremonie, DAY_PHASE_LABELS.reception, DAY_PHASE_LABELS.demontage].join(' → '),
    },
    { offsetLabel: 'J+7', dayOffset: 7, title: 'Bilan et clôture' },
  ].map((step) => ({ ...step, date: addDays(weddingDate, step.dayOffset) }))
}

interface WeddingTimelinePreviewProps {
  /** Auth-aware, passé par LandingPage.tsx — jamais un navigate('/inscription') en dur : une utilisatrice déjà connectée ne doit pas être renvoyée vers l'inscription. */
  ctaLabel: string
  onStart: () => void
}

export function WeddingTimelinePreview({ ctaLabel, onStart }: WeddingTimelinePreviewProps) {
  const [dateInput, setDateInput] = useState('')
  const [revealedFor, setRevealedFor] = useState<Date | null>(null)

  const handleGenerate = () => {
    if (!dateInput) return
    setRevealedFor(new Date(`${dateInput}T00:00:00`))
  }

  const milestones = revealedFor ? buildMilestones(revealedFor) : []

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 sm:p-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-thread-text">Essayer maintenant — sans compte</p>
        <h2 className="mt-2 font-heading text-2xl font-semibold text-foreground sm:text-3xl">Quelle est la date du mariage ?</h2>
        <p className="mt-1 text-sm text-muted-foreground">On te montre le déroulé, tout de suite.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="preview-date">Date du mariage</Label>
          <Input id="preview-date" type="date" value={dateInput} onChange={(e) => setDateInput(e.target.value)} />
        </div>
        <Button size="lg" disabled={!dateInput} onClick={handleGenerate}>
          Générer mon déroulé
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
      </div>

      {revealedFor && (
        <ol className="mt-2 flex flex-col gap-3">
          {milestones.map((step, i) => (
            <li
              key={step.offsetLabel}
              className="animate-notice-in flex items-start gap-3 rounded-lg border border-border bg-background px-4 py-3"
              style={{ animationDelay: `${i * 90}ms` }}
            >
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-sage/30 text-success">
                <Check className="size-3.5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-thread-text">
                  {step.offsetLabel} · {format(step.date, 'd MMMM yyyy', { locale: fr })}
                </p>
                <p className="text-sm text-foreground">{step.title}</p>
              </div>
            </li>
          ))}

          <li className="animate-notice-in mt-2 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between" style={{ animationDelay: `${milestones.length * 90}ms` }}>
            <p className="text-sm text-muted-foreground">Envie de piloter vraiment ce déroulé, avec tes prestataires et ton budget ?</p>
            <Button variant="outline" onClick={onStart}>
              {ctaLabel}
            </Button>
          </li>
        </ol>
      )}
    </div>
  )
}
