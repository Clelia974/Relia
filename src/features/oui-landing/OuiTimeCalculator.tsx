import { useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const CHOICES = ['Ma famille', 'Ma créativité', 'Mon repos', 'Autre chose'] as const

/** Estimation volontairement simple (pas de prétention scientifique) : quelques minutes par demande × le nombre de recherches/relances nécessaires. */
function estimateHours(count: number, avgMinutes: number, repeats: number): number {
  if (count <= 0 || avgMinutes <= 0) return 0
  const minutesPerFollowUp = 3
  const totalMinutes = count * avgMinutes + count * Math.max(0, repeats) * minutesPerFollowUp
  return Math.round((totalMinutes / 60) * 10) / 10
}

export function OuiTimeCalculator() {
  const [count, setCount] = useState(50)
  const [avgMinutes, setAvgMinutes] = useState(15)
  const [repeats, setRepeats] = useState(2)
  const [choice, setChoice] = useState<(typeof CHOICES)[number]>(CHOICES[0])

  const hours = useMemo(() => estimateHours(count, avgMinutes, repeats), [count, avgMinutes, repeats])

  return (
    <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="oui-calc-count">Demandes reçues pendant une grosse période</Label>
          <Input
            id="oui-calc-count"
            type="number"
            inputMode="numeric"
            min={0}
            value={count}
            onChange={(e) => setCount(Number(e.target.value) || 0)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="oui-calc-minutes">Temps moyen par demande (min)</Label>
          <Input
            id="oui-calc-minutes"
            type="number"
            inputMode="numeric"
            min={0}
            value={avgMinutes}
            onChange={(e) => setAvgMinutes(Number(e.target.value) || 0)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="oui-calc-repeats">Recherches / relances par demande</Label>
          <Input
            id="oui-calc-repeats"
            type="number"
            inputMode="numeric"
            min={0}
            value={repeats}
            onChange={(e) => setRepeats(Number(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className="mt-8 flex flex-col items-center gap-1 border-t border-border pt-8 text-center">
        <p className="font-heading text-4xl font-semibold tracking-tight text-primary sm:text-5xl">≈ {hours} h</p>
        <p className="text-sm text-muted-foreground">par mois consacrées à ces tâches de suivi.</p>
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Cette estimation est indicative et dépend uniquement des informations que tu renseignes — elle ne mesure pas
        réellement ton activité.
      </p>

      <div className="mt-6 flex flex-col items-center gap-3 border-t border-border pt-6 sm:flex-row sm:justify-center">
        <p className="text-sm text-muted-foreground">Et ce temps, tu en ferais quoi ?</p>
        <div className="flex flex-wrap justify-center gap-2">
          {CHOICES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setChoice(c)}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                choice === c
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-muted-foreground hover:text-foreground'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
