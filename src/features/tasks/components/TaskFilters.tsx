import { FilterPills } from '@/components/FilterPills'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TASK_PRIMARY_FILTERS, type TaskPrimaryFilter } from '@/features/tasks/taskFilters'
import { TASK_PRIORITY_LABELS, TASK_PRIORITY_OPTIONS } from '@/lib/taskPriority'
import type { TaskPriority } from '@/types/entities'

interface TaskFiltersProps {
  primary: TaskPrimaryFilter
  onPrimaryChange: (value: TaskPrimaryFilter) => void
  weddingOptions?: { id: string; coupleName: string }[]
  weddingFilter?: string
  onWeddingFilterChange?: (value: string) => void
  priorityFilter: TaskPriority | 'toutes'
  onPriorityFilterChange: (value: TaskPriority | 'toutes') => void
}

export function TaskFilters({
  primary,
  onPrimaryChange,
  weddingOptions,
  weddingFilter,
  onWeddingFilterChange,
  priorityFilter,
  onPriorityFilterChange,
}: TaskFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <FilterPills options={TASK_PRIMARY_FILTERS} value={primary} onChange={onPrimaryChange} ariaLabel="Filtrer les tâches" />

      <div className="flex flex-wrap gap-2">
        {weddingOptions && onWeddingFilterChange && (
          <Select value={weddingFilter} onValueChange={onWeddingFilterChange}>
            <SelectTrigger className="w-full sm:w-44" aria-label="Filtrer par mariage">
              <SelectValue placeholder="Par mariage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">Tous les mariages</SelectItem>
              {weddingOptions.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {w.coupleName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={priorityFilter} onValueChange={(v) => onPriorityFilterChange(v as TaskPriority | 'toutes')}>
          <SelectTrigger className="w-full sm:w-40" aria-label="Filtrer par priorité">
            <SelectValue placeholder="Par priorité" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="toutes">Toutes priorités</SelectItem>
            {TASK_PRIORITY_OPTIONS.map((p) => (
              <SelectItem key={p} value={p}>
                {TASK_PRIORITY_LABELS[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
