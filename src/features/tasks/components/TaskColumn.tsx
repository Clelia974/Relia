import { useState } from 'react'
import { TaskCard } from '@/features/tasks/components/TaskCard'
import { TASK_STATUS_LABELS } from '@/lib/taskStatus'
import { cn } from '@/lib/utils'
import type { Task, TaskStatus } from '@/types/entities'

interface TaskColumnProps {
  status: TaskStatus
  tasks: Task[]
  weddingNameById: Map<string, string>
  vendorNameById: Map<string, string>
  onComplete: (task: Task) => void
  onReopen: (task: Task) => void
  onPostpone: (task: Task) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  onChangeStatus: (task: Task, status: TaskStatus) => void
  onDropTask: (taskId: string, status: TaskStatus) => void
}

export function TaskColumn({
  status,
  tasks,
  weddingNameById,
  vendorNameById,
  onComplete,
  onReopen,
  onPostpone,
  onEdit,
  onDelete,
  onChangeStatus,
  onDropTask,
}: TaskColumnProps) {
  const [dragOver, setDragOver] = useState(false)
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null)

  return (
    <div
      className={cn(
        'flex w-72 shrink-0 flex-col gap-2.5 rounded-lg border border-border bg-muted/30 p-2.5 transition-colors',
        dragOver && 'border-thread bg-accent',
      )}
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        const taskId = e.dataTransfer.getData('text/plain')
        if (taskId) onDropTask(taskId, status)
      }}
    >
      <div className="flex items-center justify-between px-1 py-1">
        <h3 className="text-sm font-semibold text-foreground">{TASK_STATUS_LABELS[status]}</h3>
        <span className="text-xs text-muted-foreground">{tasks.length}</span>
      </div>

      <div className="flex flex-col gap-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('text/plain', task.id)
              e.dataTransfer.effectAllowed = 'move'
              setDraggingTaskId(task.id)
            }}
            onDragEnd={() => setDraggingTaskId(null)}
            className={cn(
              'cursor-grab transition-opacity active:cursor-grabbing',
              draggingTaskId === task.id && 'opacity-50 shadow-lg',
            )}
          >
            <TaskCard
              task={task}
              weddingName={task.weddingId ? weddingNameById.get(task.weddingId) : undefined}
              vendorName={task.vendorId ? vendorNameById.get(task.vendorId) : undefined}
              onComplete={onComplete}
              onReopen={onReopen}
              onPostpone={onPostpone}
              onEdit={onEdit}
              onDelete={onDelete}
              onChangeStatus={onChangeStatus}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
