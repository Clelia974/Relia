import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { TriangleAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import { TaskPriorityBadge } from '@/features/tasks/components/TaskPriorityBadge'
import { TaskStatusBadge } from '@/features/tasks/components/TaskStatusBadge'
import type { CalendarItem } from '@/features/calendar/calendarItems'
import { cn } from '@/lib/utils'

interface CalendarEventCardProps {
  item: CalendarItem
}

export function CalendarEventCard({ item }: CalendarEventCardProps) {
  const title = item.kind === 'task' ? item.task.title : item.event.title
  const dateLabel = format(new Date(item.date), 'd MMMM', { locale: fr })
  const timeLabel = item.kind === 'event' && item.event.startTime ? `${item.event.startTime}${item.event.endTime ? `–${item.event.endTime}` : ''}` : null
  const href = item.kind === 'task' ? `/mariages/${item.weddingId}/taches` : `/mariages/${item.weddingId}/planning`

  return (
    <Link
      to={href}
      className={cn(
        'flex flex-col gap-1 rounded-lg border bg-card px-3 py-2.5 text-sm transition-colors hover:border-thread/50',
        item.isAlert ? 'border-risk/40' : 'border-border',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={cn('font-medium text-foreground', item.kind === 'task' && item.task.status === 'terminee' && 'text-muted-foreground line-through')}>
          {title}
        </span>
        {item.isAlert && <TriangleAlert className="size-4 shrink-0 text-risk" aria-hidden="true" />}
      </div>
      <p className="text-xs text-muted-foreground">{item.weddingName}</p>
      <p className="text-xs text-muted-foreground">
        {dateLabel}
        {timeLabel && ` · ${timeLabel}`}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {item.kind === 'task' ? (
          <>
            <TaskStatusBadge status={item.task.status} />
            <TaskPriorityBadge priority={item.task.priority} />
          </>
        ) : (
          <span className="text-xs text-muted-foreground">{item.event.location}</span>
        )}
      </div>
    </Link>
  )
}
