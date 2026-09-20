import { Badge } from '@/components/ui/badge'
import { type BadgeTone, toneClass } from '@/lib/badgeTone'
import { cn } from '@/lib/utils'
import { TASK_PRIORITY_LABELS } from '@/lib/taskPriority'
import type { TaskPriority } from '@/types/entities'

const PRIORITY_TONE: Record<TaskPriority, BadgeTone> = {
  normale: 'muted',
  haute: 'warning',
  urgente: 'risk',
}

/** La priorité normale est la valeur par défaut : elle n'ajoute pas de pastille (seules "Haute" et "Urgente" méritent l'attention). */
export function TaskPriorityBadge({ priority }: { priority: TaskPriority }) {
  if (priority === 'normale') return null
  return <Badge className={cn('border-transparent font-medium', toneClass(PRIORITY_TONE[priority]))}>{TASK_PRIORITY_LABELS[priority]}</Badge>
}
