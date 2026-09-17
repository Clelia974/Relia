import { TaskBoard } from '@/features/tasks/components/TaskBoard'

export function TachesGlobalPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground">Tâches</h1>
        <p className="mt-1 text-sm text-muted-foreground">Toutes vos tâches, tous mariages confondus.</p>
      </div>
      <TaskBoard />
    </div>
  )
}
