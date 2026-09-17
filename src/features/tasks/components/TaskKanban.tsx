import { TaskColumn } from '@/features/tasks/components/TaskColumn'
import { KANBAN_COLUMNS } from '@/lib/taskStatus'
import type { Task, TaskStatus } from '@/types/entities'

interface TaskKanbanProps {
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

export function TaskKanban({ tasks, onChangeStatus, ...rest }: TaskKanbanProps) {
  const handleDropTask = (taskId: string, status: TaskStatus) => {
    const task = tasks.find((t) => t.id === taskId)
    if (task && task.status !== status) onChangeStatus(task, status)
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {KANBAN_COLUMNS.map((status) => (
        <TaskColumn
          key={status}
          status={status}
          tasks={tasks.filter((t) => t.status === status)}
          onChangeStatus={onChangeStatus}
          onDropTask={handleDropTask}
          {...rest}
        />
      ))}
    </div>
  )
}
