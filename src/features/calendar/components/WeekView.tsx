import { useState } from 'react'
import { addWeeks, eachDayOfInterval, endOfWeek, format, isToday, startOfWeek, subWeeks } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CalendarEventCard } from '@/features/calendar/components/CalendarEventCard'
import type { CalendarItem } from '@/features/calendar/calendarItems'
import { cn } from '@/lib/utils'

export function WeekView({ items }: { items: CalendarItem[] }) {
  const [anchor, setAnchor] = useState(() => new Date())

  const start = startOfWeek(anchor, { weekStartsOn: 1 })
  const end = endOfWeek(anchor, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start, end })

  const byDate = new Map<string, CalendarItem[]>()
  for (const item of items) {
    const key = item.date.slice(0, 10)
    if (!byDate.has(key)) byDate.set(key, [])
    byDate.get(key)!.push(item)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-base font-semibold text-foreground">
          Semaine du {format(start, 'd MMMM', { locale: fr })} au {format(end, 'd MMMM yyyy', { locale: fr })}
        </h3>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" onClick={() => setAnchor((a) => subWeeks(a, 1))} aria-label="Semaine précédente">
            <ChevronLeft className="size-4" aria-hidden="true" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setAnchor((a) => addWeeks(a, 1))} aria-label="Semaine suivante">
            <ChevronRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd')
          const dayItems = byDate.get(key) ?? []
          return (
            <div key={key} className="flex flex-col gap-2">
              <p className={cn('text-xs font-medium capitalize', isToday(day) ? 'text-thread' : 'text-muted-foreground')}>
                {format(day, 'EEE d', { locale: fr })}
              </p>
              <div className="flex flex-col gap-1.5">
                {dayItems.length === 0 ? (
                  <p className="text-xs text-muted-foreground">—</p>
                ) : (
                  dayItems.map((item) => <CalendarEventCard key={`${item.kind}-${item.id}`} item={item} />)
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
