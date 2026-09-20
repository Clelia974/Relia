import { type KeyboardEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { MonthYearPicker } from '@/features/calendar/components/MonthYearPicker'
import { CalendarEventCard } from '@/features/calendar/components/CalendarEventCard'
import type { CalendarItem } from '@/features/calendar/calendarItems'
import { useReturnFocus } from '@/lib/useReturnFocus'
import { cn } from '@/lib/utils'

const WEEKDAYS = ['lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.']
const MAX_PILLS_PER_DAY = 3
const MAX_DOTS_PER_DAY = 3

function itemTitle(item: CalendarItem) {
  return item.kind === 'task' ? item.task.title : item.event.title
}

function itemTime(item: CalendarItem) {
  return item.kind === 'event' ? item.event.startTime : undefined
}

function describeDay(day: Date, count: number) {
  const label = format(day, 'EEEE d MMMM', { locale: fr })
  const today = isToday(day) ? ", aujourd'hui" : ''
  const items = count === 0 ? '' : `, ${count} élément${count > 1 ? 's' : ''}`
  return `${label}${today}${items}`
}

/** Vue Mois façon Apple Calendar : en-tête épuré, grille sans bordures lourdes, jour ouvert en détail au clic. */
export function MonthView({ items, filters }: { items: CalendarItem[]; filters?: ReactNode }) {
  const [cursor, setCursor] = useState(() => new Date())
  const [openDay, setOpenDay] = useState<Date | null>(null)
  const returnFocus = useReturnFocus()
  const cellRefs = useRef(new Map<string, HTMLButtonElement>())
  const focusAfterRender = useRef(false)

  const byDate = useMemo(() => {
    const map = new Map<string, CalendarItem[]>()
    for (const item of items) {
      const key = item.date.slice(0, 10)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(item)
    }
    return map
  }, [items])

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 }),
  })
  const rows = days.length / 7

  useEffect(() => {
    if (!focusAfterRender.current) return
    focusAfterRender.current = false
    cellRefs.current.get(format(cursor, 'yyyy-MM-dd'))?.focus()
  }, [cursor])

  const moveCursor = (next: Date) => {
    focusAfterRender.current = true
    setCursor(next)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, Date> = {
      ArrowLeft: addDays(cursor, -1),
      ArrowRight: addDays(cursor, 1),
      ArrowUp: addDays(cursor, -7),
      ArrowDown: addDays(cursor, 7),
      PageUp: subMonths(cursor, 1),
      PageDown: addMonths(cursor, 1),
    }
    const next = moves[event.key]
    if (!next) return
    event.preventDefault()
    moveCursor(next)
  }

  const openItems = openDay ? (byDate.get(format(openDay, 'yyyy-MM-dd')) ?? []) : []

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <h2 aria-live="polite" className="font-heading text-3xl font-semibold tracking-tight text-foreground">
          <MonthYearPicker value={cursor} onSelect={(date) => setCursor(date)}>
            <button
              type="button"
              aria-label={`${format(cursor, 'MMMM yyyy', { locale: fr })}, choisir un mois ou une année`}
              className="-mx-2 inline-flex items-center gap-2 rounded-lg px-2 py-0.5 text-left transition-colors hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span>
                <span className="capitalize">{format(cursor, 'MMMM', { locale: fr })}</span>{' '}
                <span className="font-normal text-muted-foreground">{format(cursor, 'yyyy')}</span>
              </span>
              <ChevronDown className="size-5 text-muted-foreground" aria-hidden="true" />
            </button>
          </MonthYearPicker>
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>
            Aujourd'hui
          </Button>
          <div className="flex items-center overflow-hidden rounded-lg border border-border">
            <Button variant="ghost" size="icon" className="rounded-none" onClick={() => setCursor((c) => subMonths(c, 1))} aria-label="Mois précédent">
              <ChevronLeft className="size-4" aria-hidden="true" />
            </Button>
            <span className="h-5 w-px bg-border" aria-hidden="true" />
            <Button variant="ghost" size="icon" className="rounded-none" onClick={() => setCursor((c) => addMonths(c, 1))} aria-label="Mois suivant">
              <ChevronRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </header>

      {filters}

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="grid grid-cols-7 border-b border-border" aria-hidden="true">
          {WEEKDAYS.map((day) => (
            <div key={day} className="px-2 py-2 text-right text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        <div
          role="group"
          aria-label={`Calendrier de ${format(cursor, 'MMMM yyyy', { locale: fr })}`}
          onKeyDown={handleKeyDown}
          className="grid grid-cols-7 gap-px bg-border"
          style={{ gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` }}
        >
          {days.map((day) => {
            const key = format(day, 'yyyy-MM-dd')
            const dayItems = byDate.get(key) ?? []
            const inMonth = isSameMonth(day, cursor)
            const today = isToday(day)
            const showMonthLabel = day.getDate() === 1

            return (
              <button
                key={key}
                type="button"
                ref={(node) => {
                  if (node) cellRefs.current.set(key, node)
                  else cellRefs.current.delete(key)
                }}
                tabIndex={isSameDay(day, cursor) ? 0 : -1}
                aria-current={today ? 'date' : undefined}
                aria-label={describeDay(day, dayItems.length)}
                onClick={() => {
                  setCursor(day)
                  setOpenDay(day)
                }}
                className={cn(
                  'flex min-h-16 flex-col gap-1 bg-card p-1.5 text-left transition-colors hover:bg-accent/40 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:min-h-28',
                  !inMonth && 'bg-muted/30 hover:bg-muted/50',
                )}
              >
                <span className="flex justify-end">
                  <span
                    className={cn(
                      'flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs font-medium tabular-nums',
                      today ? 'bg-thread text-primary-foreground' : inMonth ? 'text-foreground' : 'text-muted-foreground/70',
                    )}
                  >
                    {showMonthLabel ? (
                      <>
                        <span className="sm:hidden">{format(day, 'd')}</span>
                        <span className="hidden whitespace-nowrap sm:inline">{format(day, 'd MMM', { locale: fr })}</span>
                      </>
                    ) : (
                      format(day, 'd')
                    )}
                  </span>
                </span>

                <span className="hidden flex-col gap-0.5 sm:flex">
                  {dayItems.slice(0, MAX_PILLS_PER_DAY).map((item) => {
                    const time = itemTime(item)
                    return (
                      <span
                        key={`${item.kind}-${item.id}`}
                        className={cn(
                          'flex items-center gap-1.5 truncate rounded px-1 py-0.5 text-[11px] leading-tight',
                          item.isAlert ? 'bg-risk-bg text-risk' : 'text-foreground',
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            'size-1.5 shrink-0 rounded-full',
                            item.kind === 'task' ? 'border border-current bg-transparent' : 'bg-current',
                            !item.isAlert && 'text-thread',
                          )}
                        />
                        {time && <span className="shrink-0 text-muted-foreground tabular-nums">{time}</span>}
                        <span className="truncate">{itemTitle(item)}</span>
                      </span>
                    )
                  })}
                  {dayItems.length > MAX_PILLS_PER_DAY && (
                    <span className="px-1 text-[11px] font-medium text-muted-foreground">
                      +{dayItems.length - MAX_PILLS_PER_DAY} de plus
                    </span>
                  )}
                </span>

                {dayItems.length > 0 && (
                  <span className="flex justify-center gap-0.5 sm:hidden" aria-hidden="true">
                    {dayItems.slice(0, MAX_DOTS_PER_DAY).map((item) => (
                      <span key={`${item.kind}-${item.id}`} className={cn('size-1.5 rounded-full', item.isAlert ? 'bg-risk' : 'bg-thread')} />
                    ))}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <Dialog open={openDay !== null} onOpenChange={(open) => !open && setOpenDay(null)}>
        <DialogContent className="max-h-[85dvh] max-w-md overflow-y-auto" {...returnFocus}>
          <DialogHeader>
            <DialogTitle className="first-letter:uppercase">{openDay ? format(openDay, 'EEEE d MMMM', { locale: fr }) : ''}</DialogTitle>
            <DialogDescription>
              {openItems.length === 0
                ? 'Rien de prévu ce jour-là.'
                : `${openItems.length} élément${openItems.length > 1 ? 's' : ''} prévu${openItems.length > 1 ? 's' : ''}.`}
            </DialogDescription>
          </DialogHeader>
          {openItems.length > 0 && (
            <div className="flex flex-col gap-2">
              {openItems.map((item) => (
                <CalendarEventCard key={`${item.kind}-${item.id}`} item={item} />
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
