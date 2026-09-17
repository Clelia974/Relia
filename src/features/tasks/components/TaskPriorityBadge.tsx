import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { TASK_PRIORITY_LABELS } from '@/lib/taskPriority'
import type { TaskPriority } from '@/types/entities'

const PRIORITY_TONE: Record<TaskPriority, string> = {
  normale: 'bg-muted text-muted-foreground',
  haute: 'bg-warning-bg text-warning',
  urgente: 'bg-risk-bg text-risk',
}

export function TaskPriorityBadge({ priority }: { priority: TaskPriority }) {
  return <Badge className={cn('border-transparent font-medium', PRIORITY_TONE[priority])}>{TASK_PRIORITY_LABELS[priority]}</Badge>
}
