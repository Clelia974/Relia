import { Check, X } from 'lucide-react'

const FOR_YOU = [
  'Tu organises plusieurs mariages en parallèle.',
  'Tu gères toi-même une partie de ton organisation.',
  'Tes tâches, prestataires, matériel et finances sont répartis entre plusieurs outils.',
  'Tu as déjà tes mariages dans un tableur.',
  'Tu veux avoir une vision plus claire du Jour J.',
  'Tu veux pouvoir fermer ton ordinateur sans te demander ce que tu as oublié.',
]

const NOT_YET = [
  "Tu n'as pas encore de mariage à organiser.",
  'Ton système actuel — carnet, tableur ou autre — fonctionne parfaitement pour toi.',
]

export function WhoItsForSection() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 sm:p-8">
        <p className="font-heading text-lg font-semibold text-foreground">ZORDI est fait pour toi si…</p>
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
        <p className="text-sm text-muted-foreground">
          Et c’est très bien. ZORDI n’a pas vocation à ajouter un outil là où tu n’en as pas besoin.
        </p>
      </div>
    </div>
  )
}
