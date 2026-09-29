import { useMemo, useState } from 'react'
import { Clock, Inbox, RotateCcw } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/** Estimation volontairement simple (pas de prétention scientifique) : quelques minutes par demande × le nombre de recherches/relances nécessaires. */
function estimateHours(count: number, avgMinutes: number, repeats: number): number {
  if (count <= 0 || avgMinutes <= 0) return 0
  const minutesPerFollowUp = 3
  const totalMinutes = count * avgMinutes + count * Math.max(0, repeats) * minutesPerFollowUp
  return Math.round((totalMinutes / 60) * 10) / 10
}

interface StatFieldProps {
  id: string
  icon: typeof Inbox
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
}

/**
 * Carte "métrique" (icône + libellé court + grand chiffre éditable) plutôt qu'un
 * champ de formulaire classique — les 3 cartes ont strictement la même structure
 * interne, donc s'alignent naturellement sur une même ligne, quelle que soit la
 * largeur d'écran.
 */
function StatField({ id, icon: Icon, label, placeholder, value, onChange }: StatFieldProps) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-[#DDE6EF]/15 bg-[#DDE6EF]/5 p-4 sm:p-5">
      <Label htmlFor={id} className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-[#DDE6EF]/70">
        <Icon className="size-3.5 shrink-0" aria-hidden="true" />
        {label}
      </Label>
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        min={0}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-auto rounded-none border-0 border-b-2 border-[#DDE6EF]/20 bg-transparent px-0 py-1 font-heading text-3xl font-semibold text-[#DDE6EF] placeholder:text-[#DDE6EF]/30 focus-visible:border-[#DDE6EF] focus-visible:ring-0"
      />
    </div>
  )
}

export function ZordiTimeCalculator() {
  // Champs vides par défaut (pas de valeurs pré-remplies) : le résultat n'apparaît
  // qu'une fois que la décoratrice a saisi ses propres chiffres — effet de révélation
  // plutôt qu'un calcul déjà affiché avant toute interaction.
  const [count, setCount] = useState('')
  const [avgMinutes, setAvgMinutes] = useState('')
  const [repeats, setRepeats] = useState('')

  const hours = useMemo(
    () => estimateHours(Number(count) || 0, Number(avgMinutes) || 0, Number(repeats) || 0),
    [count, avgMinutes, repeats],
  )
  const hasResult = hours > 0

  return (
    <div className="rounded-2xl bg-[#680808] p-6 text-[#DDE6EF] shadow-(--shadow-raised) sm:p-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatField id="zordi-calc-count" icon={Inbox} label="Demandes reçues" placeholder="50" value={count} onChange={setCount} />
        <StatField id="zordi-calc-minutes" icon={Clock} label="Minutes par demande" placeholder="15" value={avgMinutes} onChange={setAvgMinutes} />
        <StatField id="zordi-calc-repeats" icon={RotateCcw} label="Relances par demande" placeholder="2" value={repeats} onChange={setRepeats} />
      </div>

      {hasResult ? (
        <div key={hours} className="animate-notice-in mt-8 flex flex-col items-center gap-1 border-t border-[#DDE6EF]/20 pt-8 text-center">
          <p className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">≈ {hours} h</p>
          <p className="text-sm text-[#DDE6EF]/80">par mois consacrées à ces tâches de suivi.</p>
          <p className="mt-3 text-xs text-[#DDE6EF]/70">
            Cette estimation est indicative et dépend uniquement des informations que tu renseignes — elle ne mesure
            pas réellement ton activité.
          </p>
        </div>
      ) : (
        <p className="mt-8 border-t border-[#DDE6EF]/20 pt-8 text-center text-sm text-[#DDE6EF]/70">
          Renseigne tes chiffres pour voir ton estimation.
        </p>
      )}
    </div>
  )
}
