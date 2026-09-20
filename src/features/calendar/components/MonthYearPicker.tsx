import { type ReactNode, useState } from 'react'
import { format, getMonth, getYear, setMonth, setYear } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

const YEARS_PER_PAGE = 12

interface MonthYearPickerProps {
  value: Date
  onSelect: (date: Date) => void
  children: ReactNode
}

/** Saut direct à un mois ou une année : le titre du calendrier sert de déclencheur. */
export function MonthYearPicker({ value, onSelect, children }: MonthYearPickerProps) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'months' | 'years'>('months')
  const [year, setYearState] = useState(() => getYear(value))
  const [yearPageStart, setYearPageStart] = useState(() => getYear(value) - 4)

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setMode('months')
      setYearState(getYear(value))
      setYearPageStart(getYear(value) - 4)
    }
    setOpen(next)
  }

  const todayYear = getYear(new Date())
  const todayMonth = getMonth(new Date())

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-64" aria-label="Choisir un mois ou une année">
        <div className="mb-2 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={mode === 'months' ? 'Année précédente' : 'Années précédentes'}
            onClick={() => (mode === 'months' ? setYearState((y) => y - 1) : setYearPageStart((y) => y - YEARS_PER_PAGE))}
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </Button>
          <button
            type="button"
            onClick={() => setMode((m) => (m === 'months' ? 'years' : 'months'))}
            className="rounded-md px-2 py-1 font-heading text-base font-semibold tabular-nums text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={mode === 'months' ? `${year}, choisir une autre année` : 'Retour aux mois'}
          >
            {mode === 'months' ? year : `${yearPageStart} – ${yearPageStart + YEARS_PER_PAGE - 1}`}
          </button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={mode === 'months' ? 'Année suivante' : 'Années suivantes'}
            onClick={() => (mode === 'months' ? setYearState((y) => y + 1) : setYearPageStart((y) => y + YEARS_PER_PAGE))}
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </Button>
        </div>

        {mode === 'months' ? (
          <div className="grid grid-cols-3 gap-1">
            {Array.from({ length: 12 }, (_, m) => {
              const selected = year === getYear(value) && m === getMonth(value)
              const isTodayMonth = year === todayYear && m === todayMonth
              return (
                <button
                  key={m}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    onSelect(setMonth(setYear(value, year), m))
                    setOpen(false)
                  }}
                  className={cn(
                    'rounded-lg px-2 py-2 text-sm capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    selected ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-accent',
                    isTodayMonth && !selected && 'font-semibold text-thread-text',
                  )}
                >
                  {format(new Date(2000, m, 1), 'MMM', { locale: fr })}
                </button>
              )
            })}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {Array.from({ length: YEARS_PER_PAGE }, (_, i) => {
              const y = yearPageStart + i
              const selected = y === year
              return (
                <button
                  key={y}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    setYearState(y)
                    setMode('months')
                  }}
                  className={cn(
                    'rounded-lg px-2 py-2 text-sm tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    selected ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-accent',
                    y === todayYear && !selected && 'font-semibold text-thread-text',
                  )}
                >
                  {y}
                </button>
              )
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
