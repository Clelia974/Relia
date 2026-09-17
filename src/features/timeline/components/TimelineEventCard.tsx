import { Camera, Clock, MapPin, MoreHorizontal, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { TIMELINE_EVENT_STATUS_LABELS } from '@/lib/timelineEventStatus'
import type { TimelineEvent } from '@/types/entities'

const STATUS_TONE: Record<TimelineEvent['status'], string> = {
  prevu: 'bg-muted text-muted-foreground',
  confirme: 'bg-success-bg text-success',
  a_verifier: 'bg-warning-bg text-warning',
  termine: 'bg-success-bg text-success',
}

interface TimelineEventCardProps {
  event: TimelineEvent
  vendorName?: string
  hasConflict?: boolean
  onEdit: (event: TimelineEvent) => void
  onDelete: (event: TimelineEvent) => void
}

export function TimelineEventCard({ event, vendorName, hasConflict, onEdit, onDelete }: TimelineEventCardProps) {
  const duration = event.durationMinutes

  return (
    <Card className={cn(hasConflict && 'border-risk/50')}>
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium text-foreground">{event.title}</p>
            {event.startTime && (
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="size-3.5 shrink-0" aria-hidden="true" />
                {event.startTime}
                {event.endTime && `–${event.endTime}`}
                {duration !== undefined && ` · ${duration} min`}
              </p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={`Actions pour ${event.title}`}
                className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <MoreHorizontal className="size-4" aria-hidden="true" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => onEdit(event)}>Modifier</DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onSelect={() => onDelete(event)}>
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Badge className={cn('border-transparent font-medium', STATUS_TONE[event.status])}>
            {TIMELINE_EVENT_STATUS_LABELS[event.status]}
          </Badge>
          {event.isPhotoMoment && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Camera className="size-3.5" aria-hidden="true" />
              Moment photo
            </span>
          )}
          {hasConflict && <Badge className="border-transparent bg-risk-bg text-risk">Conflit détecté</Badge>}
        </div>

        {(event.location || vendorName || event.responsiblePerson) && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {event.location && (
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5" aria-hidden="true" />
                {event.location}
              </span>
            )}
            {vendorName && (
              <span className="flex items-center gap-1">
                <User className="size-3.5" aria-hidden="true" />
                {vendorName}
              </span>
            )}
            {event.responsiblePerson && <span>Responsable : {event.responsiblePerson}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
