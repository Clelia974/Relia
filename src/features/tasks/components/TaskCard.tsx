import { Bot, Calendar, History, MoreHorizontal, RotateCcw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { TaskPriorityBadge } from '@/features/tasks/components/TaskPriorityBadge'
import { TaskStatusBadge } from '@/features/tasks/components/TaskStatusBadge'
import { isOverdue, isDueToday } from '@/features/tasks/summary'
import { formatShortDate } from '@/lib/dateFormat'
import { cn } from '@/lib/utils'
import { KANBAN_COLUMNS, TASK_STATUS_LABELS } from '@/lib/taskStatus'
import type { Task, TaskStatus } from '@/types/entities'

interface TaskCardProps {
  task: Task
  weddingName?: string
  vendorName?: string
  showStatusInMenu?: boolean
  showStatusBadge?: boolean
  onComplete: (task: Task) => void
  onReopen: (task: Task) => void
  onPostpone: (task: Task) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  onChangeStatus: (task: Task, status: TaskStatus) => void
}

export function TaskCard({
  task,
  weddingName,
  vendorName,
  showStatusInMenu = true,
  showStatusBadge = false,
  onComplete,
  onReopen,
  onPostpone,
  onEdit,
  onDelete,
  onChangeStatus,
}: TaskCardProps) {
  const done = task.status === 'terminee'
  const overdue = isOverdue(task)
  const dueToday = isDueToday(task)

  return (
    <Card>
      <CardContent className="flex flex-col gap-2.5">
        <div className="flex items-start gap-2.5">
          <Checkbox
            checked={done}
            onCheckedChange={(checked) => (checked ? onComplete(task) : onReopen(task))}
            aria-label={done ? 'Marquer comme non terminée' : 'Terminer'}
            className="mt-0.5"
          />
          <div className="min-w-0 flex-1">
            <p className={cn('text-sm font-medium', done ? 'text-muted-foreground line-through' : 'text-foreground')}>
              {task.title}
            </p>
            {(weddingName || vendorName) && (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {weddingName}
                {weddingName && vendorName && ' · '}
                {vendorName}
              </p>
            )}
          </div>
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label={`Actions pour ${task.title}`}
                    className="shrink-0 relative rounded-md p-1.5 text-muted-foreground transition-colors after:absolute after:-inset-3.5 hover:bg-accent hover:text-accent-foreground"
                  >
                    <MoreHorizontal className="size-4" aria-hidden="true" />
                  </button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Actions</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => onEdit(task)}>Modifier</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onPostpone(task)}>Reporter</DropdownMenuItem>
              {showStatusInMenu && (
                <>
                  <DropdownMenuSeparator />
                  {KANBAN_COLUMNS.filter((s) => s !== task.status).map((s) => (
                    <DropdownMenuItem key={s} onSelect={() => onChangeStatus(task, s)}>
                      Déplacer vers « {TASK_STATUS_LABELS[s]} »
                    </DropdownMenuItem>
                  ))}
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => onDelete(task)}>
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pl-[26px]">
          {showStatusBadge && <TaskStatusBadge status={task.status} />}
          <TaskPriorityBadge priority={task.priority} />
          {task.postponedCount > 0 && !done && (
            <Badge
              className="border-transparent bg-warning-bg text-warning"
              title={lastPostponeSummary(task)}
            >
              <History className="size-3" aria-hidden="true" />
              Reportée {task.postponedCount > 1 ? `(${task.postponedCount}×)` : ''}
            </Badge>
          )}
          {task.source === 'automatic' && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Bot className="size-3" aria-hidden="true" />
              Automatique
            </span>
          )}
        </div>

        {task.dueDate && (
          <p
            className={cn(
              'flex items-center gap-1.5 pl-[26px] text-xs',
              overdue ? 'font-medium text-risk' : dueToday ? 'font-medium text-warning' : 'text-muted-foreground',
            )}
          >
            <Calendar className="size-3.5" aria-hidden="true" />
            {formatShortDate(task.dueDate)}
            {overdue && ' · en retard'}
            {dueToday && ' · aujourd\'hui'}
          </p>
        )}

        {done && (
          <button
            type="button"
            onClick={() => onReopen(task)}
            className="ml-[26px] flex w-fit items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline"
          >
            <RotateCcw className="size-3" aria-hidden="true" />
            Rouvrir
          </button>
        )}
      </CardContent>
    </Card>
  )
}

function lastPostponeSummary(task: Task): string | undefined {
  const last = task.postponeHistory.at(-1)
  if (!last) return undefined
  const from = formatShortDate(last.fromDate)
  const to = formatShortDate(last.toDate)
  return last.reason ? `Reportée du ${from} au ${to} — ${last.reason}` : `Reportée du ${from} au ${to}`
}
