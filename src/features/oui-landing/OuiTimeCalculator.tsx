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

const FIELD_INPUT_CLASSES = 'h-12 bg-card text-base text-foreground'

export function OuiTimeCalculator() {
  // Champs vides par défaut (pas de valeurs pré-remplies) : le résultat n'apparaît
  // qu'une fois que la décoratrice a saisi ses propres chiffres — effet de révélation
  // plutôt qu'un calcul déjà affiché avant toute interaction.
  const [count, setCount] = useState('')
  const [avgMinutes, setAvgMinutes] = useState('')
  const [repeats, setRepeats] = useState('')
  const [choice, setChoice] = useState<(typeof CHOICES)[number] | null>(null)

  const hours = useMemo(
    () => estimateHours(Number(count) || 0, Number(avgMinutes) || 0, Number(repeats) || 0),
    [count, avgMinutes, repeats],
  )
  const hasResult = hours > 0

  return (
    <div className="rounded-2xl bg-primary p-6 text-primary-foreground shadow-(--shadow-raised) sm:p-8">
      <div className="grid gap-5 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="oui-calc-count" className="text-primary-foreground/90">
            Demandes reçues pendant une grosse période
          </Label>
          <Input
            id="oui-calc-count"
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="ex. 50"
            value={count}
            onChange={(e) => setCount(e.target.value)}
            className={FIELD_INPUT_CLASSES}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="oui-calc-minutes" className="text-primary-foreground/90">
            Temps moyen par demande (min)
          </Label>
          <Input
            id="oui-calc-minutes"
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="ex. 15"
            value={avgMinutes}
            onChange={(e) => setAvgMinutes(e.target.value)}
            className={FIELD_INPUT_CLASSES}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="oui-calc-repeats" className="text-primary-foreground/90">
            Recherches / relances par demande
          </Label>
          <Input
            id="oui-calc-repeats"
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="ex. 2"
            value={repeats}
            onChange={(e) => setRepeats(e.target.value)}
            className={FIELD_INPUT_CLASSES}
          />
        </div>
      </div>

      {hasResult ? (
        <div key={hours} className="animate-notice-in">
          <div className="mt-8 flex flex-col items-center gap-1 border-t border-primary-foreground/20 pt-8 text-center">
            <p className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">≈ {hours} h</p>
            <p className="text-sm text-primary-foreground/80">par mois consacrées à ces tâches de suivi.</p>
          </div>

          <p className="mt-4 text-center text-xs text-primary-foreground/70">
            Cette estimation est indicative et dépend uniquement des informations que tu renseignes — elle ne mesure
            pas réellement ton activité.
          </p>

          <div className="mt-6 flex flex-col items-center gap-3 border-t border-primary-foreground/20 pt-6 sm:flex-row sm:justify-center">
            <p className="text-sm text-primary-foreground/80">Et ce temps, tu en ferais quoi ?</p>
            <div className="flex flex-wrap justify-center gap-2">
              {CHOICES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setChoice(c)}
                  className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    choice === c
                      ? 'border-card bg-card text-primary'
                      : 'border-primary-foreground/30 text-primary-foreground/80 hover:border-primary-foreground/60 hover:text-primary-foreground'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <p className="mt-8 border-t border-primary-foreground/20 pt-8 text-center text-sm text-primary-foreground/70">
          Renseigne tes chiffres pour voir ton estimation.
        </p>
      )}
    </div>
  )
}
