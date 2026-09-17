import { useMemo, useState } from 'react'
import { addDays, isWithinInterval, startOfDay } from 'date-fns'
import { Plus, Search } from 'lucide-react'
import { toast } from 'sonner'
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PostponeTaskDialog } from '@/features/tasks/components/PostponeTaskDialog'
import { TaskEmptyState } from '@/features/tasks/components/TaskEmptyState'
import { TaskFilters } from '@/features/tasks/components/TaskFilters'
import type { TaskPrimaryFilter } from '@/features/tasks/taskFilters'
import { TaskForm } from '@/features/tasks/components/TaskForm'
import { TaskKanban } from '@/features/tasks/components/TaskKanban'
import { TaskList } from '@/features/tasks/components/TaskList'
import { isDueToday, isOverdue } from '@/features/tasks/summary'
import type { TaskFormValues } from '@/features/tasks/taskForm.schema'
import { selectActiveWeddingIds, selectActiveWeddings } from '@/features/weddings/activeWeddings'
import { TASK_STATUS_LABELS } from '@/lib/taskStatus'
import { useWorkspaceStore } from '@/store/workspaceStore'
import type { Task, TaskPriority, TaskStatus } from '@/types/entities'

interface TaskBoardProps {
  /** Quand fourni, le tableau est limité à ce mariage (onglet Tâches d'une fiche mariage). */
  scopeWeddingId?: string
}

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

function matchesPrimaryFilter(task: Task, filter: TaskPrimaryFilter, today: Date): boolean {
  switch (filter) {
    case 'toutes':
      return true
    case 'aujourdhui':
      return isDueToday(task, today)
    case 'cette_semaine':
      return Boolean(
        task.dueDate &&
          task.status !== 'terminee' &&
          isWithinInterval(new Date(task.dueDate), { start: startOfDay(today), end: addDays(startOfDay(today), 7) }),
      )
    case 'en_retard':
      return isOverdue(task, today)
    case 'en_attente':
      return task.status === 'en_attente'
    case 'terminees':
      return task.status === 'terminee'
    default:
      return true
  }
}

export function TaskBoard({ scopeWeddingId }: TaskBoardProps) {
  const allWeddings = useWorkspaceStore((s) => s.workspace.weddings)
  const allVendors = useWorkspaceStore((s) => s.workspace.vendors)
  const allTasks = useWorkspaceStore((s) => s.workspace.tasks)
  const addTask = useWorkspaceStore((s) => s.addTask)
  const updateTask = useWorkspaceStore((s) => s.updateTask)
  const updateTaskStatus = useWorkspaceStore((s) => s.updateTaskStatus)
  const completeTask = useWorkspaceStore((s) => s.completeTask)
  const reportTask = useWorkspaceStore((s) => s.reportTask)
  const deleteTask = useWorkspaceStore((s) => s.deleteTask)

  const weddings = selectActiveWeddings(allWeddings)
  const activeWeddingIds = selectActiveWeddingIds(allWeddings)
  // Périmètre "un mariage" : comportement inchangé. Périmètre global : une
  // tâche sans weddingId (générique) reste toujours visible, une tâche liée
  // à un mariage archivé est exclue.
  const tasksInScope = scopeWeddingId
    ? allTasks.filter((t) => t.weddingId === scopeWeddingId)
    : allTasks.filter((t) => !t.weddingId || activeWeddingIds.has(t.weddingId))

  const weddingNameById = useMemo(() => new Map(allWeddings.map((w) => [w.id, w.coupleName])), [allWeddings])
  const vendorNameById = useMemo(() => new Map(allVendors.map((v) => [v.id, v.name])), [allVendors])

  const [view, setView] = useState<'kanban' | 'liste'>('kanban')
  const [primaryFilter, setPrimaryFilter] = useState<TaskPrimaryFilter>('toutes')
  const [weddingFilter, setWeddingFilter] = useState('tous')
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'toutes'>('toutes')
  const [query, setQuery] = useState('')

  const [formOpen, setFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [postponeOpen, setPostponeOpen] = useState(false)
  const [postponingTask, setPostponingTask] = useState<Task | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Task | null>(null)

  const today = new Date()
  const filtered = tasksInScope
    .filter((t) => matchesPrimaryFilter(t, primaryFilter, today))
    .filter((t) => (scopeWeddingId ? true : weddingFilter === 'tous' || t.weddingId === weddingFilter))
    .filter((t) => priorityFilter === 'toutes' || t.priority === priorityFilter)
    .filter((t) => {
      const q = query.trim().toLowerCase()
      if (!q) return true
      const wedding = t.weddingId ? (weddingNameById.get(t.weddingId) ?? '') : ''
      const vendor = t.vendorId ? (vendorNameById.get(t.vendorId) ?? '') : ''
      return t.title.toLowerCase().includes(q) || wedding.toLowerCase().includes(q) || vendor.toLowerCase().includes(q)
    })

  const openCreate = () => {
    setEditingTask(null)
    setFormOpen(true)
  }
  const openEdit = (task: Task) => {
    setEditingTask(task)
    setFormOpen(true)
  }

  const handleSubmit = (values: TaskFormValues) => {
    const patch = toTaskPatch(values)
    if (editingTask) {
      updateTask(editingTask.id, patch)
      toast.success('Tâche mise à jour.')
    } else {
      addTask(patch)
      toast.success('Tâche créée.')
    }
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

  const handleChangeStatus = (task: Task, status: TaskStatus) => {
    updateTaskStatus(task.id, status)
    toast.success(`Déplacée vers « ${TASK_STATUS_LABELS[status]} ».`)
  }

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

  if (tasksInScope.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <TaskEmptyState
          title={scopeWeddingId ? 'Aucune tâche pour ce mariage.' : 'Aucune tâche pour le moment.'}
          description={
            scopeWeddingId
              ? 'Ajoutez une tâche pour commencer à organiser ce mariage.'
              : 'Créez votre première tâche pour commencer à structurer votre prochain mariage.'
          }
          onAdd={openCreate}
        />
        <TaskForm
          key={formOpen ? (editingTask?.id ?? 'new') : 'closed'}
          open={formOpen}
          onOpenChange={setFormOpen}
          task={editingTask}
          defaultWeddingId={scopeWeddingId}
          weddings={weddings}
          vendors={allVendors}
          onSubmit={handleSubmit}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={view} onValueChange={(v) => setView(v as 'kanban' | 'liste')}>
          <TabsList>
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
            <TabsTrigger value="liste">Liste</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button onClick={openCreate}>
          <Plus className="size-4" aria-hidden="true" />
          Nouvelle tâche
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        <TaskFilters
          primary={primaryFilter}
          onPrimaryChange={setPrimaryFilter}
          weddingOptions={scopeWeddingId ? undefined : weddings}
          weddingFilter={scopeWeddingId ? undefined : weddingFilter}
          onWeddingFilterChange={scopeWeddingId ? undefined : setWeddingFilter}
          priorityFilter={priorityFilter}
          onPriorityFilterChange={setPriorityFilter}
        />
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Titre, mariage ou prestataire…"
            className="pl-8"
            aria-label="Rechercher une tâche"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
          Aucune tâche ne correspond à ces filtres.
        </p>
      ) : view === 'kanban' ? (
        <TaskKanban tasks={filtered} weddingNameById={weddingNameById} vendorNameById={vendorNameById} {...cardActions} />
      ) : (
        <TaskList tasks={filtered} weddingNameById={weddingNameById} vendorNameById={vendorNameById} {...cardActions} />
      )}

      <TaskForm
        key={formOpen ? (editingTask?.id ?? 'new') : 'closed'}
        open={formOpen}
        onOpenChange={setFormOpen}
        task={editingTask}
        defaultWeddingId={scopeWeddingId}
        weddings={weddings}
        vendors={allVendors}
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
    </div>
  )
}
