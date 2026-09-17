import type { FilterOption } from '@/components/FilterPills'

export type TaskPrimaryFilter = 'toutes' | 'aujourdhui' | 'cette_semaine' | 'en_retard' | 'en_attente' | 'terminees'

export const TASK_PRIMARY_FILTERS: FilterOption<TaskPrimaryFilter>[] = [
  { key: 'toutes', label: 'Toutes' },
  { key: 'aujourdhui', label: "Aujourd'hui" },
  { key: 'cette_semaine', label: 'Cette semaine' },
  { key: 'en_retard', label: 'En retard' },
  { key: 'en_attente', label: 'En attente' },
  { key: 'terminees', label: 'Terminées' },
]
