import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
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
import { Label } from '@/components/ui/label'
import { TimelineConflictAlert } from '@/features/timeline/components/TimelineConflictAlert'
import { TimelineConflictDialog } from '@/features/timeline/components/TimelineConflictDialog'
import { TimelineEventForm } from '@/features/timeline/components/TimelineEventForm'
import { TimelineGanttView } from '@/features/timeline/components/TimelineGanttView'
import { TimelinePreparation } from '@/features/timeline/components/TimelinePreparation'
import { TimelineViewSwitcher, type TimelineView } from '@/features/timeline/components/TimelineViewSwitcher'
import { WeddingDayTimeline } from '@/features/timeline/components/WeddingDayTimeline'
import { DEFAULT_MIN_BUFFER_MINUTES, detectTimelineConflicts, type TimelineConflict } from '@/features/timeline/conflicts'
import { resolveTimeRange } from '@/features/timeline/timeRange'
import type { TimelineEventFormValues } from '@/features/timeline/timelineEventForm.schema'
import { useWorkspaceStore } from '@/store/workspaceStore'
import type { WeddingOutletContext } from '@/pages/mariages/WeddingLayout'
import type { TimelineEvent } from '@/types/entities'

function toEventPatch(values: TimelineEventFormValues) {
  return {
    title: values.title.trim(),
    description: values.description.trim() || undefined,
    date: new Date(values.date).toISOString(),
    startTime: values.startTime,
    endTime: values.endTime,
    durationMinutes: resolveTimeRange(values.startTime, values.endTime)?.durationMinutes,
    location: values.location.trim() || undefined,
    vendorId: values.vendorId || undefined,
    responsiblePerson: values.responsiblePerson.trim() || undefined,
    isPhotoMoment: values.isPhotoMoment,
    bufferBeforeMinutes: values.bufferBeforeMinutes === '' ? undefined : Number(values.bufferBeforeMinutes),
    bufferAfterMinutes: values.bufferAfterMinutes === '' ? undefined : Number(values.bufferAfterMinutes),
    type: values.type as TimelineEvent['type'],
    status: values.status as TimelineEvent['status'],
    notes: values.notes.trim() || undefined,
  }
}

export function WeddingPlanningTab() {
  const { wedding } = useOutletContext<WeddingOutletContext>()
  const allEvents = useWorkspaceStore((s) => s.workspace.timelineEvents)
  const allTasks = useWorkspaceStore((s) => s.workspace.tasks)
  const allVendors = useWorkspaceStore((s) => s.workspace.vendors)
  const ignoredConflictIds = useWorkspaceStore((s) => s.workspace.ignoredConflictIds)
  const addTimelineEvent = useWorkspaceStore((s) => s.addTimelineEvent)
  const updateTimelineEvent = useWorkspaceStore((s) => s.updateTimelineEvent)
  const deleteTimelineEvent = useWorkspaceStore((s) => s.deleteTimelineEvent)
  const ignoreTimelineConflict = useWorkspaceStore((s) => s.ignoreTimelineConflict)
  const updateWedding = useWorkspaceStore((s) => s.updateWedding)

  const events = allEvents.filter((e) => e.weddingId === wedding.id)
  const tasks = allTasks.filter((t) => t.weddingId === wedding.id)
  const vendors = allVendors.filter((v) => v.weddingIds.includes(wedding.id))
  const vendorNameById = useMemo(() => new Map(allVendors.map((v) => [v.id, v.name])), [allVendors])

  const [view, setView] = useState<TimelineView>('frise')
  const [formOpen, setFormOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null)
  const [pendingDelete, setPendingDelete] = useState<TimelineEvent | null>(null)
  const [activeConflict, setActiveConflict] = useState<TimelineConflict | null>(null)
  const [bufferDraft, setBufferDraft] = useState(String(wedding.minBufferMinutes ?? DEFAULT_MIN_BUFFER_MINUTES))

  const minBuffer = wedding.minBufferMinutes ?? DEFAULT_MIN_BUFFER_MINUTES
  const conflicts = useMemo(
    () => detectTimelineConflicts(events, { minBufferMinutes: minBuffer, ignoredConflictIds }),
    [events, minBuffer, ignoredConflictIds],
  )

  const openCreate = () => {
    setEditingEvent(null)
    setFormOpen(true)
  }
  const openEdit = (event: TimelineEvent) => {
    setActiveConflict(null)
    setEditingEvent(event)
    setFormOpen(true)
  }

  const handleSubmit = (values: TimelineEventFormValues) => {
    const patch = toEventPatch(values)
    if (editingEvent) {
      updateTimelineEvent(editingEvent.id, patch)
      toast.success('Moment mis à jour.')
    } else {
      addTimelineEvent({ ...patch, weddingId: wedding.id })
      toast.success('Moment ajouté.')
    }
    setFormOpen(false)
  }

  const confirmDelete = () => {
    if (!pendingDelete) return
    deleteTimelineEvent(pendingDelete.id)
    setPendingDelete(null)
    toast.success('Moment supprimé.')
  }

  const handleIgnoreConflict = (conflict: TimelineConflict) => {
    ignoreTimelineConflict(conflict.id)
    toast.success('Alerte ignorée.')
    setActiveConflict(null)
  }

  const saveBuffer = () => {
    const parsed = Number(bufferDraft)
    if (Number.isNaN(parsed) || parsed < 0) {
      toast.error('Veuillez saisir une marge positive.')
      setBufferDraft(String(minBuffer))
      return
    }
    updateWedding(wedding.id, { minBufferMinutes: parsed })
    toast.success('Marge minimale mise à jour.')
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">Planning</h1>
          <p className="mt-1 text-sm text-muted-foreground">Préparez et sécurisez le déroulé de ce mariage.</p>
        </div>
        <div className="flex items-end gap-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="min-buffer" className="text-xs">
              Marge minimale recommandée (min)
            </Label>
            <Input
              id="min-buffer"
              inputMode="numeric"
              className="w-28"
              value={bufferDraft}
              onChange={(e) => setBufferDraft(e.target.value)}
              onBlur={saveBuffer}
            />
          </div>
        </div>
      </div>

      <TimelineConflictAlert conflicts={conflicts} onSeeOptions={setActiveConflict} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <TimelineViewSwitcher value={view} onChange={setView} />
        <Button onClick={openCreate}>
          <Plus className="size-4" aria-hidden="true" />
          Ajouter un moment
        </Button>
      </div>

      {view === 'frise' && (
        <TimelinePreparation
          wedding={wedding}
          tasks={tasks}
          dayEvents={events.filter((e) => e.date.slice(0, 10) === wedding.date.slice(0, 10))}
          vendorNameById={vendorNameById}
        />
      )}
      {view === 'calendrier' && (
        <WeddingDayTimeline
          wedding={wedding}
          events={events}
          tasks={tasks}
          vendorNameById={vendorNameById}
          conflicts={conflicts}
          onEditEvent={openEdit}
          onDeleteEvent={setPendingDelete}
        />
      )}
      {view === 'gantt' && (
        <TimelineGanttView
          wedding={wedding}
          events={events}
          tasks={tasks}
          vendorNameById={vendorNameById}
          conflicts={conflicts}
          onEditEvent={openEdit}
        />
      )}

      <TimelineEventForm
        key={formOpen ? (editingEvent?.id ?? 'new') : 'closed'}
        open={formOpen}
        onOpenChange={setFormOpen}
        event={editingEvent}
        defaultDate={wedding.date.slice(0, 10)}
        vendors={vendors}
        onSubmit={handleSubmit}
      />

      <TimelineConflictDialog
        open={activeConflict !== null}
        onOpenChange={(open) => !open && setActiveConflict(null)}
        conflict={activeConflict}
        events={events}
        onEditEvent={openEdit}
        onIgnore={handleIgnoreConflict}
      />

      <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer « {pendingDelete?.title} » ?</AlertDialogTitle>
            <AlertDialogDescription>Ce moment sera définitivement supprimé. Cette action est irréversible.</AlertDialogDescription>
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
