import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { Wedding } from '@/types/entities'

export interface CalendarToggleFilters {
  tasks: boolean
  events: boolean
  alertsOnly: boolean
}

interface CalendarFiltersProps {
  weddings: Wedding[]
  weddingFilter: string
  onWeddingFilterChange: (value: string) => void
  toggles: CalendarToggleFilters
  onTogglesChange: (toggles: CalendarToggleFilters) => void
}

export function CalendarFilters({ weddings, weddingFilter, onWeddingFilterChange, toggles, onTogglesChange }: CalendarFiltersProps) {
  const toggle = (key: keyof CalendarToggleFilters) => onTogglesChange({ ...toggles, [key]: !toggles[key] })

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrer les éléments affichés">
        <FilterChip active={toggles.tasks} onClick={() => toggle('tasks')}>
          Tâches
        </FilterChip>
        <FilterChip active={toggles.events} onClick={() => toggle('events')}>
          Événements
        </FilterChip>
        <FilterChip active={toggles.alertsOnly} onClick={() => toggle('alertsOnly')}>
          Alertes uniquement
        </FilterChip>
      </div>

      <Select value={weddingFilter} onValueChange={onWeddingFilterChange}>
        <SelectTrigger className="w-full sm:w-56" aria-label="Filtrer par mariage">
          <SelectValue placeholder="Tous les mariages" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="tous">Tous les mariages</SelectItem>
          {weddings.map((w) => (
            <SelectItem key={w.id} value={w.id}>
              {w.coupleName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
        active ? 'border-transparent bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}
