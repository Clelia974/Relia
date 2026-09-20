import { Badge } from '@/components/ui/badge'
import { type BadgeTone, toneClass } from '@/lib/badgeTone'
import { cn } from '@/lib/utils'
import { TASK_STATUS_LABELS } from '@/lib/taskStatus'
import type { TaskStatus } from '@/types/entities'

const STATUS_TONE: Record<TaskStatus, BadgeTone> = {
  a_preparer: 'muted',
  a_faire: 'muted',
  en_cours: 'muted',
  en_attente: 'warning',
  terminee: 'muted',
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return <Badge className={cn('border-transparent font-medium', toneClass(STATUS_TONE[status]))}>{TASK_STATUS_LABELS[status]}</Badge>
}
