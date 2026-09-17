import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { TASK_STATUS_LABELS } from '@/lib/taskStatus'
import type { TaskStatus } from '@/types/entities'

const STATUS_TONE: Record<TaskStatus, string> = {
  a_preparer: 'bg-muted text-muted-foreground',
  a_faire: 'bg-muted text-muted-foreground',
  en_cours: 'bg-warning-bg text-warning',
  en_attente: 'bg-warning-bg text-warning',
  terminee: 'bg-success-bg text-success',
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return <Badge className={cn('border-transparent font-medium', STATUS_TONE[status])}>{TASK_STATUS_LABELS[status]}</Badge>
}
