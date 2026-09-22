import { Badge } from '@/components/ui/badge'
import { type BadgeTone, toneClass } from '@/lib/badgeTone'
import { cn } from '@/lib/utils'
import { TIMELINE_EVENT_STATUS_LABELS } from '@/lib/timelineEventStatus'
import type { TimelineEventStatus } from '@/types/entities'

/** Même échelle de tons que VendorStatusBadge/TaskStatusBadge : warning réservé à ce qui demande une action, jamais à un simple statut atteint. */
const STATUS_TONE: Record<TimelineEventStatus, BadgeTone> = {
  prevu: 'muted',
  confirme: 'muted',
  a_verifier: 'warning',
  termine: 'muted',
}

export function TimelineEventStatusBadge({ status }: { status: TimelineEventStatus }) {
  return <Badge className={cn('border-transparent font-medium', toneClass(STATUS_TONE[status]))}>{TIMELINE_EVENT_STATUS_LABELS[status]}</Badge>
}
