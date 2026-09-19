import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { EmptyState } from '@/components/EmptyState'
import { CalendarEventCard } from '@/features/calendar/components/CalendarEventCard'
import type { CalendarItem } from '@/features/calendar/calendarItems'

export function AgendaView({ items }: { items: CalendarItem[] }) {
  if (items.length === 0) {
    return <EmptyState description="Aucun élément ne correspond à ces filtres." />
  }

  const byDate = new Map<string, CalendarItem[]>()
  for (const item of items) {
    const key = item.date.slice(0, 10)
    if (!byDate.has(key)) byDate.set(key, [])
    byDate.get(key)!.push(item)
  }

  return (
    <div className="flex flex-col gap-5">
      {[...byDate.entries()].map(([dateKey, dateItems]) => (
        <section key={dateKey}>
          <h3 className="mb-2 font-heading text-sm font-semibold capitalize text-foreground">
            {format(new Date(dateKey), 'EEEE d MMMM yyyy', { locale: fr })}
          </h3>
          <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {dateItems.map((item) => (
              <CalendarEventCard key={`${item.kind}-${item.id}`} item={item} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
