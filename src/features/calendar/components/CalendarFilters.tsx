import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ListFilter, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { CalendarSelection, CalendarToggleFilters } from '@/features/calendar/calendarItems'
import { cn } from '@/lib/utils'
import type { Vendor, Wedding } from '@/types/entities'

export type { CalendarToggleFilters }

const MAX_VISIBLE_CHIPS = 4

interface CalendarFiltersProps {
  weddings: Wedding[]
  vendors: Vendor[]
  selection: CalendarSelection
  onSelectionChange: (selection: CalendarSelection) => void
  toggles: CalendarToggleFilters
  onTogglesChange: (toggles: CalendarToggleFilters) => void
}

function toggleId(ids: string[], id: string) {
  return ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
}

function normalize(text: string) {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

export function CalendarFilters({ weddings, vendors, selection, onSelectionChange, toggles, onTogglesChange }: CalendarFiltersProps) {
  const toggle = (key: keyof CalendarToggleFilters) => onTogglesChange({ ...toggles, [key]: !toggles[key] })
  const activeCount = selection.weddingIds.length + selection.vendorIds.length

  const chips = [
    ...selection.weddingIds.flatMap((id) => {
      const wedding = weddings.find((w) => w.id === id)
      return wedding ? [{ key: `w-${id}`, label: wedding.coupleName, remove: () => onSelectionChange({ ...selection, weddingIds: toggleId(selection.weddingIds, id) }) }] : []
    }),
    ...selection.vendorIds.flatMap((id) => {
      const vendor = vendors.find((v) => v.id === id)
      return vendor ? [{ key: `v-${id}`, label: vendor.name, remove: () => onSelectionChange({ ...selection, vendorIds: toggleId(selection.vendorIds, id) }) }] : []
    }),
  ]

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
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

        <FilterPanel weddings={weddings} vendors={vendors} selection={selection} onSelectionChange={onSelectionChange} activeCount={activeCount} />
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5" aria-label="Filtres actifs" role="group">
          {chips.slice(0, MAX_VISIBLE_CHIPS).map((chip) => (
            <span key={chip.key} className="inline-flex items-center gap-1 rounded-full bg-accent py-1 pl-2.5 pr-1 text-xs font-medium text-accent-foreground">
              <span className="max-w-40 truncate">{chip.label}</span>
              <button
                type="button"
                onClick={chip.remove}
                aria-label={`Retirer le filtre ${chip.label}`}
                className="rounded-full p-0.5 hover:bg-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            </span>
          ))}
          {chips.length > MAX_VISIBLE_CHIPS && <span className="text-xs text-muted-foreground">+{chips.length - MAX_VISIBLE_CHIPS}</span>}
          <button
            type="button"
            onClick={() => onSelectionChange({ weddingIds: [], vendorIds: [] })}
            className="rounded px-1.5 py-1 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Tout effacer
          </button>
        </div>
      )}
    </div>
  )
}

function FilterPanel({
  weddings,
  vendors,
  selection,
  onSelectionChange,
  activeCount,
}: Pick<CalendarFiltersProps, 'weddings' | 'vendors' | 'selection' | 'onSelectionChange'> & { activeCount: number }) {
  const [weddingQuery, setWeddingQuery] = useState('')
  const [vendorQuery, setVendorQuery] = useState('')

  const sortedWeddings = useMemo(() => [...weddings].sort((a, b) => a.date.localeCompare(b.date)), [weddings])
  const availableVendors = useMemo(
    () =>
      vendors
        .filter(
          (v) =>
            selection.weddingIds.length === 0 ||
            v.weddingIds.some((id) => selection.weddingIds.includes(id)) ||
            selection.vendorIds.includes(v.id),
        )
        .sort((a, b) => a.name.localeCompare(b.name, 'fr')),
    [vendors, selection.weddingIds, selection.vendorIds],
  )

  const shownWeddings = sortedWeddings.filter((w) => normalize(w.coupleName).includes(normalize(weddingQuery)))
  const shownVendors = availableVendors.filter((v) => normalize(`${v.name} ${v.company ?? ''} ${v.category}`).includes(normalize(vendorQuery)))

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" aria-label={activeCount > 0 ? `Filtrer, ${activeCount} filtre${activeCount > 1 ? 's' : ''} actif${activeCount > 1 ? 's' : ''}` : 'Filtrer'}>
          <ListFilter className="size-4" aria-hidden="true" />
          Filtrer
          {activeCount > 0 && (
            <span className="ml-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold text-primary-foreground">
              {activeCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="flex max-h-[var(--radix-popover-content-available-height)] w-[22rem] flex-col gap-4 overflow-y-auto p-4" aria-label="Filtres du calendrier">
        <FilterSection
          title="Mariages"
          query={weddingQuery}
          onQueryChange={setWeddingQuery}
          searchLabel="Rechercher un mariage"
          emptyLabel="Aucun mariage trouvé."
        >
          {shownWeddings.map((w) => (
            <FilterRow
              key={w.id}
              id={`cal-w-${w.id}`}
              checked={selection.weddingIds.includes(w.id)}
              onChange={() => onSelectionChange({ ...selection, weddingIds: toggleId(selection.weddingIds, w.id) })}
              label={w.coupleName}
              hint={format(new Date(w.date), 'd MMM yyyy', { locale: fr })}
            />
          ))}
        </FilterSection>

        <FilterSection
          title="Prestataires"
          query={vendorQuery}
          onQueryChange={setVendorQuery}
          searchLabel="Rechercher un prestataire"
          emptyLabel="Aucun prestataire trouvé."
        >
          {shownVendors.map((v) => (
            <FilterRow
              key={v.id}
              id={`cal-v-${v.id}`}
              checked={selection.vendorIds.includes(v.id)}
              onChange={() => onSelectionChange({ ...selection, vendorIds: toggleId(selection.vendorIds, v.id) })}
              label={v.name}
              hint={v.category}
            />
          ))}
        </FilterSection>

        {activeCount > 0 && (
          <Button variant="ghost" size="sm" className="self-start" onClick={() => onSelectionChange({ weddingIds: [], vendorIds: [] })}>
            Réinitialiser les filtres
          </Button>
        )}
      </PopoverContent>
    </Popover>
  )
}

function FilterSection({
  title,
  query,
  onQueryChange,
  searchLabel,
  emptyLabel,
  children,
}: {
  title: string
  query: string
  onQueryChange: (value: string) => void
  searchLabel: string
  emptyLabel: string
  children: React.ReactNode
}) {
  const hasRows = Array.isArray(children) ? children.length > 0 : Boolean(children)
  return (
    <section className="flex flex-col gap-2" aria-label={title}>
      <h3 className="font-heading text-sm font-semibold text-foreground">{title}</h3>
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input value={query} onChange={(e) => onQueryChange(e.target.value)} placeholder="Rechercher…" aria-label={searchLabel} className="h-8 pl-8" />
      </div>
      <div className="flex max-h-44 flex-col overflow-y-auto rounded-lg border border-border">
        {hasRows ? children : <p className="px-3 py-3 text-xs text-muted-foreground">{emptyLabel}</p>}
      </div>
    </section>
  )
}

function FilterRow({ id, checked, onChange, label, hint }: { id: string; checked: boolean; onChange: () => void; label: string; hint: string }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm hover:bg-accent/60">
      <Checkbox id={id} checked={checked} onCheckedChange={onChange} />
      <span className="min-w-0 flex-1 truncate text-foreground">{label}</span>
      <span className="shrink-0 text-xs text-muted-foreground">{hint}</span>
    </label>
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
