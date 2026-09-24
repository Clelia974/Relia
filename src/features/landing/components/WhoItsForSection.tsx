import { Check, X } from 'lucide-react'

/** Qualifie sans stats ni témoignage — juste une reformulation honnête de qui trouve (ou pas) de la valeur à Relia aujourd'hui. */
const FOR_YOU = [
  'Tu organises plusieurs mariages en parallèle',
  'Tes tâches, prestataires et finances sont éparpillés entre plusieurs outils',
  'Tu as déjà tes mariages dans un tableur — importe-les en quelques minutes',
  'Tu veux essayer 14 jours, sans carte bancaire',
]

const NOT_YET = [
  "Tu n'as pas encore de mariage à organiser",
  'Ton système actuel (tableur, carnet) te suffit très bien',
]

export function WhoItsForSection() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 sm:p-8">
        <p className="font-heading text-lg font-semibold text-foreground">Relia est fait pour toi si…</p>
        <ul className="flex flex-col gap-3 text-sm">
          {FOR_YOU.map((item) => (
            <li key={item} className="flex items-start gap-3">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-success-bg text-success">
                <Check className="size-3.5" aria-hidden="true" />
              </span>
              <span className="text-foreground">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-muted/50 p-6 sm:p-8">
        <p className="font-heading text-lg font-semibold text-foreground">Pas encore le bon moment si…</p>
        <ul className="flex flex-col gap-3 text-sm">
          {NOT_YET.map((item) => (
            <li key={item} className="flex items-start gap-3">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-card text-muted-foreground">
                <X className="size-3.5" aria-hidden="true" />
              </span>
              <span className="text-foreground/80">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
