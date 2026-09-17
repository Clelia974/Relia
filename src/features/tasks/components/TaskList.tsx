import { TaskCard } from '@/features/tasks/components/TaskCard'
import type { Task, TaskStatus } from '@/types/entities'

interface TaskListProps {
  tasks: Task[]
  weddingNameById: Map<string, string>
  vendorNameById: Map<string, string>
  onComplete: (task: Task) => void
  onReopen: (task: Task) => void
  onPostpone: (task: Task) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  onChangeStatus: (task: Task, status: TaskStatus) => void
}

export function TaskList({ tasks, weddingNameById, vendorNameById, ...actions }: TaskListProps) {
  const sorted = [...tasks].sort((a, b) => {
    if (!a.dueDate) return 1
    if (!b.dueDate) return -1
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  })

  return (
    <div className="flex flex-col gap-2.5">
      {sorted.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          weddingName={task.weddingId ? weddingNameById.get(task.weddingId) : undefined}
          vendorName={task.vendorId ? vendorNameById.get(task.vendorId) : undefined}
          showStatusBadge
          {...actions}
        />
      ))}
    </div>
  )
}
