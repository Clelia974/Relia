import { useOutletContext } from 'react-router-dom'
import { TaskBoard } from '@/features/tasks/components/TaskBoard'
import type { WeddingOutletContext } from '@/pages/mariages/WeddingLayout'

export function WeddingTasksTab() {
  const { wedding } = useOutletContext<WeddingOutletContext>()
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground">Tâches</h1>
        <p className="mt-1 text-sm text-muted-foreground">Organisez le travail à faire pour ce mariage.</p>
      </div>
      <TaskBoard scopeWeddingId={wedding.id} />
    </div>
  )
}
