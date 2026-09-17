import { FilterPills, type FilterOption } from '@/components/FilterPills'

export type { FilterOption as VendorFilterOption }

interface VendorFiltersProps<T extends string> {
  options: FilterOption<T>[]
  value: T
  onChange: (value: T) => void
}

export function VendorFilters<T extends string>({ options, value, onChange }: VendorFiltersProps<T>) {
  return <FilterPills options={options} value={value} onChange={onChange} ariaLabel="Filtrer les prestataires" />
}
