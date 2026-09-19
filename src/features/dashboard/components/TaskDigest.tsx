import { useMemo, useState } from 'react'
import { CircleCheck, Clock3 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { useShallow } from 'zustand/react/shallow'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PostponeTaskDialog } from '@/features/tasks/components/PostponeTaskDialog'
import { TaskForm } from '@/features/tasks/components/TaskForm'
import { TaskList } from '@/features/tasks/components/TaskList'
import { getTodayActions } from '@/features/dashboard/summary'
import type { TaskFormValues } from '@/features/tasks/taskForm.schema'
import { useWorkspaceStore } from '@/store/workspaceStore'
import type { Task, TaskPriority, TaskStatus } from '@/types/entities'

const MAX_VISIBLE = 5

function toTaskPatch(values: TaskFormValues) {
  return {
    title: values.title.trim(),
    description: values.description.trim() || undefined,
    weddingId: values.weddingId,
    vendorId: values.vendorId || undefined,
    dueDate: new Date(values.dueDate).toISOString(),
    startDate: values.startDate ? new Date(values.startDate).toISOString() : undefined,
    endDate: values.endDate ? new Date(values.endDate).toISOString() : undefined,
    priority: values.priority as TaskPriority,
    status: values.status as TaskStatus,
    waitingOn: values.status === 'en_attente' && values.waitingOn ? (values.waitingOn as Task['waitingOn']) : undefined,
    waitingReason: values.status === 'en_attente' ? values.waitingReason.trim() || undefined : undefined,
    notes: values.notes.trim() || undefined,
  }
}

export function TaskDigest() {
  const { weddings: allWeddings, vendors, tasks } = useWorkspaceStore(
    useShallow((s) => ({ weddings: s.workspace.weddings, vendors: s.workspace.vendors, tasks: s.workspace.tasks })),
  )
  const updateTask = useWorkspaceStore((s) => s.updateTask)
  const updateTaskStatus = useWorkspaceStore((s) => s.updateTaskStatus)
  const completeTask = useWorkspaceStore((s) => s.completeTask)
  const reportTask = useWorkspaceStore((s) => s.reportTask)
  const deleteTask = useWorkspaceStore((s) => s.deleteTask)

  const weddingNameById = useMemo(() => new Map(allWeddings.map((w) => [w.id, w.coupleName])), [allWeddings])
  const vendorNameById = useMemo(() => new Map(vendors.map((v) => [v.id, v.name])), [vendors])
  const weddings = useMemo(() => allWeddings.filter((w) => !w.archived), [allWeddings])

  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [postponingTask, setPostponingTask] = useState<Task | null>(null)
  const [postponeOpen, setPostponeOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<Task | null>(null)

  const { items, waiting } = useMemo(() => getTodayActions({ weddings: allWeddings, tasks }), [allWeddings, tasks])
  const visibleItems = items.slice(0, MAX_VISIBLE)

  const openEdit = (task: Task) => {
    setEditingTask(task)
    setFormOpen(true)
  }
  const handleSubmit = (values: TaskFormValues) => {
    if (!editingTask) return
    updateTask(editingTask.id, toTaskPatch(values))
    toast.success('Tâche mise à jour.')
    setFormOpen(false)
  }
  const handleComplete = (task: Task) => {
    completeTask(task.id)
    toast.success('Tâche terminée.')
  }
  const handleReopen = (task: Task) => {
    updateTaskStatus(task.id, 'a_faire')
    toast.success('Tâche rouverte.')
  }
  const handleChangeStatus = (task: Task, status: TaskStatus) => updateTaskStatus(task.id, status)
  const openPostpone = (task: Task) => {
    setPostponingTask(task)
    setPostponeOpen(true)
  }
  const handlePostponeConfirm = (newDueDate: string, reason?: string) => {
    if (!postponingTask) return
    reportTask(postponingTask.id, { newDueDate, reason })
    toast.success('Tâche reportée.')
    setPostponeOpen(false)
  }
  const confirmDelete = () => {
    if (!pendingDelete) return
    deleteTask(pendingDelete.id)
    setPendingDelete(null)
    toast.success('Tâche supprimée.')
  }

  const cardActions = {
    onComplete: handleComplete,
    onReopen: handleReopen,
    onPostpone: openPostpone,
    onEdit: openEdit,
    onDelete: setPendingDelete,
    onChangeStatus: handleChangeStatus,
  }

  return (
    <Card id="actions-du-jour">
      <CardHeader>
        <CardTitle>Que dois-je faire aujourd'hui ?</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {tasks.length === 0 ? (
          <div>
            <p className="text-sm font-medium text-foreground">Tout est calme pour aujourd'hui.</p>
            <p className="mt-1 text-sm text-muted-foreground">Aucune action urgente pour le moment.</p>
          </div>
        ) : items.length === 0 ? (
          <p className="flex items-center gap-2 text-sm font-medium text-success">
            <CircleCheck className="size-4 shrink-0" aria-hidden="true" />
            Tout est à jour pour aujourd'hui ✓
          </p>
        ) : (
          <>
            <TaskList tasks={visibleItems} weddingNameById={weddingNameById} vendorNameById={vendorNameById} {...cardActions} />
            {items.length > MAX_VISIBLE && (
              <p className="text-xs text-muted-foreground">
                +{items.length - MAX_VISIBLE} autre{items.length - MAX_VISIBLE !== 1 ? 's' : ''} action{items.length - MAX_VISIBLE !== 1 ? 's' : ''} aujourd'hui.
              </p>
            )}
          </>
        )}

        {waiting.length > 0 && (
          <p className="flex items-center gap-1.5 border-t border-border pt-3 text-sm text-warning">
            <Clock3 className="size-3.5" aria-hidden="true" />
            {waiting.length} élément{waiting.length !== 1 ? 's' : ''} attend{waiting.length !== 1 ? 'ent' : ''} une réponse.
          </p>
        )}

        <Link to="/taches" className="text-sm text-foreground underline-offset-4 hover:underline">
          Voir toutes les tâches →
        </Link>
      </CardContent>

      <TaskForm
        key={formOpen ? (editingTask?.id ?? 'edit') : 'closed'}
        open={formOpen}
        onOpenChange={setFormOpen}
        task={editingTask}
        weddings={weddings}
        vendors={vendors}
        onSubmit={handleSubmit}
      />

      <PostponeTaskDialog
        key={postponeOpen ? (postponingTask?.id ?? 'postpone') : 'postpone-closed'}
        open={postponeOpen}
        onOpenChange={setPostponeOpen}
        task={postponingTask}
        onConfirm={handlePostponeConfirm}
      />

      <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer « {pendingDelete?.title} » ?</AlertDialogTitle>
            <AlertDialogDescription>Cette tâche sera définitivement supprimée. Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
