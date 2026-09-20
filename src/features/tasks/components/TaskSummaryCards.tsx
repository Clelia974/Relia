import { Banknote, Circle, Flame, ListChecks, TriangleAlert, type LucideIcon } from 'lucide-react'
import { computeTaskSummaryCounts } from '@/features/tasks/summary'
import type { TaskPrimaryFilter } from '@/features/tasks/taskFilters'
import { cn } from '@/lib/utils'
import type { Task } from '@/types/entities'

interface TaskSummaryCardsProps {
  /** Déjà réduit au périmètre courant (mariage précis, ou mariages actifs + mariage sélectionné côté global) — jamais re-filtré ici par primary/priority/recherche : c'est justement ce que ces cartes permettent de basculer. */
  tasks: Task[]
  activeFilter: TaskPrimaryFilter
  onSelectFilter: (filter: TaskPrimaryFilter) => void
  today?: Date
}

interface CardDef {
  key: TaskPrimaryFilter
  label: string
  icon: LucideIcon
  count: number
}

/**
 * Rangée de synthèse (Phase 1) — au plus 5 cartes, chacune une entrée
 * valide de TaskPrimaryFilter. Cliquer une carte fixe primaryFilter sur sa
 * valeur ET réinitialise priorityFilter à 'toutes' (cf. TaskBoard.tsx) pour
 * que le compte affiché corresponde toujours exactement à ce qui s'affiche
 * ensuite — jamais un chiffre qui ne correspond plus après clic.
 */
export function TaskSummaryCards({ tasks, activeFilter, onSelectFilter, today = new Date() }: TaskSummaryCardsProps) {
  const counts = computeTaskSummaryCounts(tasks, today)

  const cards: CardDef[] = [
    { key: 'toutes', label: 'Total', icon: ListChecks, count: counts.total },
    { key: 'a_faire', label: 'À faire', icon: Circle, count: counts.aFaire },
    { key: 'en_retard', label: 'En retard', icon: TriangleAlert, count: counts.enRetard },
    { key: 'urgentes', label: 'Tâches urgentes', icon: Flame, count: counts.urgentes },
    { key: 'paiement_attente', label: "En attente d'un paiement", icon: Banknote, count: counts.attentePaiement },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" role="group" aria-label="Synthèse des tâches — cliquer pour filtrer">
      {cards.map((card) => {
        const active = activeFilter === card.key
        return (
          <button
            key={card.key}
            type="button"
            onClick={() => onSelectFilter(card.key)}
            aria-pressed={active}
            aria-label={`${card.label} : ${card.count} tâche${card.count > 1 ? 's' : ''}${active ? ', filtre actif' : ''}`}
            className={cn(
              'flex flex-col items-start gap-1.5 rounded-xl border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              active ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-foreground/25',
            )}
          >
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <card.icon className="size-3.5 shrink-0" aria-hidden="true" />
              {card.label}
            </span>
            <span className="font-heading text-xl font-semibold tabular-nums text-foreground">{card.count}</span>
          </button>
        )
      })}
    </div>
  )
}
