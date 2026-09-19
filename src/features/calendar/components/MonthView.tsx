import { useState } from 'react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import type { CalendarItem } from '@/features/calendar/calendarItems'
import { cn } from '@/lib/utils'

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MAX_CHIPS_PER_DAY = 3

export function MonthView({ items }: { items: CalendarItem[] }) {
  const [month, setMonth] = useState(() => new Date())

  const byDate = new Map<string, CalendarItem[]>()
  for (const item of items) {
    const key = item.date.slice(0, 10)
    if (!byDate.has(key)) byDate.set(key, [])
    byDate.get(key)!.push(item)
  }

  const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 1 })
  const gridEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-heading text-base font-semibold capitalize text-foreground">{format(month, 'MMMM yyyy', { locale: fr })}</h3>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" onClick={() => setMonth((m) => subMonths(m, 1))} aria-label="Mois précédent">
            <ChevronLeft className="size-4" aria-hidden="true" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setMonth((m) => addMonths(m, 1))} aria-label="Mois suivant">
            <ChevronRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="grid min-w-[640px] grid-cols-7 gap-px rounded-lg border border-border bg-border">
          {WEEKDAYS.map((day) => (
            <div key={day} className="bg-muted px-2 py-1.5 text-center text-xs font-medium text-muted-foreground">
              {day}
            </div>
          ))}
          {days.map((day) => {
            const key = format(day, 'yyyy-MM-dd')
            const dayItems = byDate.get(key) ?? []
            const inMonth = isSameMonth(day, month)
            return (
              <div key={key} className={cn('flex min-h-24 flex-col gap-1 bg-card p-1.5', !inMonth && 'bg-muted/40')}>
                <span
                  className={cn(
                    'flex size-5 items-center justify-center rounded-full text-xs',
                    isToday(day) ? 'bg-thread text-primary-foreground' : inMonth ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {format(day, 'd')}
                </span>
                <div className="flex flex-col gap-0.5">
                  {dayItems.slice(0, MAX_CHIPS_PER_DAY).map((item) => {
                    const title = item.kind === 'task' ? item.task.title : item.event.title
                    const href = item.kind === 'task' ? `/mariages/${item.weddingId}/taches` : `/mariages/${item.weddingId}/planning`
                    return (
                      <Link
                        key={`${item.kind}-${item.id}`}
                        to={href}
                        className={cn(
                          'truncate rounded px-1 py-0.5 text-[11px] leading-tight hover:underline',
                          item.isAlert ? 'bg-risk-bg text-risk' : 'bg-muted text-foreground',
                        )}
                        title={title}
                      >
                        {title}
                      </Link>
                    )
                  })}
                  {dayItems.length > MAX_CHIPS_PER_DAY && (
                    <span className="text-[11px] text-muted-foreground">+{dayItems.length - MAX_CHIPS_PER_DAY} de plus</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
