import { Mail, MapPin, Phone, User } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import type { DayOfItem } from '@/features/dayof/dayOfTimeline'
import { formatTimeRange } from '@/features/timeline/timeRange'
import { DAY_PHASE_LABELS } from '@/lib/dayPhase'
import { TASK_STATUS_LABELS } from '@/lib/taskStatus'
import { TIMELINE_EVENT_STATUS_LABELS } from '@/lib/timelineEventStatus'
import { cn } from '@/lib/utils'
import type { Vendor } from '@/types/entities'

interface DayOfItemCardProps {
  item: DayOfItem
  vendor?: Vendor
  onToggleTask: (taskId: string, done: boolean) => void
}

export function DayOfItemCard({ item, vendor, onToggleTask }: DayOfItemCardProps) {
  const isTask = item.kind === 'task'
  const title = isTask ? item.task.title : item.event.title
  const notes = isTask ? item.task.notes : item.event.notes
  const description = isTask ? item.task.description : item.event.description
  const phase = isTask ? item.task.phase : item.event.phase
  const done = isTask && item.task.status === 'terminee'

  const timeLabel = isTask
    ? undefined
    : item.event.startTime && item.event.endTime
      ? formatTimeRange(item.event.startTime, item.event.endTime)
      : (item.event.startTime ?? undefined)

  return (
    <Card>
      <CardContent className={cn('flex flex-col gap-2', isTask ? 'border-l-4 border-l-blue-400' : 'border-l-4 border-l-thread')}>
        <div className="flex items-start gap-3">
          {isTask && (
            <Checkbox
              checked={done}
              onCheckedChange={(checked) => onToggleTask(item.task.id, checked === true)}
              aria-label={done ? 'Marquer comme non terminée' : 'Terminer'}
              className="mt-0.5"
            />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              {timeLabel && <span className="font-mono text-xs font-semibold text-foreground">{timeLabel}</span>}
              <p className={cn('font-medium text-foreground', done && 'text-muted-foreground line-through')}>{title}</p>
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              <span>{isTask ? TASK_STATUS_LABELS[item.task.status] : TIMELINE_EVENT_STATUS_LABELS[item.event.status]}</span>
              {phase && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{DAY_PHASE_LABELS[phase]}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {description && <p className="pl-0 text-xs text-muted-foreground">{description}</p>}
        {!isTask && item.event.location && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="size-3.5" aria-hidden="true" />
            {item.event.location}
          </p>
        )}
        {!isTask && item.event.responsiblePerson && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <User className="size-3.5" aria-hidden="true" />
            {item.event.responsiblePerson}
          </p>
        )}
        {notes && <p className="text-xs italic text-muted-foreground">{notes}</p>}

        {vendor && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-2 text-xs">
            <span className="font-medium text-foreground">{vendor.name}</span>
            {vendor.phone && (
              <a href={`tel:${vendor.phone}`} className="flex items-center gap-1 text-thread hover:underline">
                <Phone className="size-3.5" aria-hidden="true" />
                Appeler
              </a>
            )}
            {vendor.email && (
              <a href={`mailto:${vendor.email}`} className="flex items-center gap-1 text-thread hover:underline">
                <Mail className="size-3.5" aria-hidden="true" />
                Email
              </a>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
