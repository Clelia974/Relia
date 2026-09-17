import { cn } from '@/lib/utils'

export interface FilterOption<T extends string> {
  key: T
  label: string
}

interface FilterPillsProps<T extends string> {
  options: FilterOption<T>[]
  value: T
  onChange: (value: T) => void
  ariaLabel: string
}

/** Rangée de filtres en pilules — primitive partagée par les listes de mariages, prestataires et tâches. */
export function FilterPills<T extends string>({ options, value, onChange, ariaLabel }: FilterPillsProps<T>) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={option.key}
          type="button"
          onClick={() => onChange(option.key)}
          aria-pressed={value === option.key}
          className={cn(
            'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
            value === option.key
              ? 'border-transparent bg-primary text-primary-foreground'
              : 'border-border text-muted-foreground hover:text-foreground',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
