import type { FilterOption } from '@/components/FilterPills'

/**
 * 'a_faire' | 'urgentes' | 'paiement_attente' sont uniquement accessibles
 * depuis les cartes de synthèse (Phase 1) — volontairement absentes de
 * TASK_PRIMARY_FILTERS pour ne pas alourdir la rangée de pilules existante
 * avec des filtres redondants ; matchesPrimaryFilter (TaskBoard.tsx) reste
 * le seul endroit qui interprète primary, carte ou pilule confondues.
 */
export type TaskPrimaryFilter =
  | 'toutes'
  | 'aujourdhui'
  | 'cette_semaine'
  | 'en_retard'
  | 'en_attente'
  | 'terminees'
  | 'a_faire'
  | 'urgentes'
  | 'paiement_attente'

export const TASK_PRIMARY_FILTERS: FilterOption<TaskPrimaryFilter>[] = [
  { key: 'toutes', label: 'Toutes' },
  { key: 'aujourdhui', label: "Aujourd'hui" },
  { key: 'cette_semaine', label: 'Cette semaine' },
  { key: 'en_retard', label: 'En retard' },
  { key: 'en_attente', label: 'En attente' },
  { key: 'terminees', label: 'Terminées' },
]
