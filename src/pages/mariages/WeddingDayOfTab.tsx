import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Printer, TriangleAlert } from 'lucide-react'
import { Link, useOutletContext } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmptyState } from '@/components/EmptyState'
import { DayOfItemCard } from '@/features/dayof/components/DayOfItemCard'
import { DayOfVendorSection } from '@/features/dayof/components/DayOfVendorSection'
import { buildDayOfTimeline, filterDayOfTimelineByPhase, findMismatchedDayOfEvents, type DayOfItem } from '@/features/dayof/dayOfTimeline'
import { TimelineConflictAlert } from '@/features/timeline/components/TimelineConflictAlert'
import { TimelineConflictDialog } from '@/features/timeline/components/TimelineConflictDialog'
import { TimelineEventForm } from '@/features/timeline/components/TimelineEventForm'
import { TimelineGanttView } from '@/features/timeline/components/TimelineGanttView'
import { DEFAULT_MIN_BUFFER_MINUTES, detectTimelineConflicts, type TimelineConflict } from '@/features/timeline/conflicts'
import { formatTimeRange } from '@/features/timeline/timeRange'
import { toTimelineEventPatch, type TimelineEventFormValues } from '@/features/timeline/timelineEventForm.schema'
import { getWeddingAssignments } from '@/features/vendors/assignments'
import { DAY_PHASE_LABELS, DAY_PHASE_OPTIONS } from '@/lib/dayPhase'
import { TASK_STATUS_LABELS } from '@/lib/taskStatus'
import { TIMELINE_EVENT_STATUS_LABELS } from '@/lib/timelineEventStatus'
import { VENDOR_STATUS_LABELS } from '@/lib/vendorStatus'
import { useWorkspaceStore } from '@/store/workspaceStore'
import type { WeddingOutletContext } from '@/pages/mariages/WeddingLayout'
import type { DayPhase, TimelineEvent } from '@/types/entities'

type DayOfView = 'liste' | 'gantt'

function printRow(item: DayOfItem, vendorNameById: Map<string, string>) {
  const isTask = item.kind === 'task'
  const title = isTask ? item.task.title : item.event.title
  const phase = isTask ? item.task.phase : item.event.phase
  const status = isTask ? TASK_STATUS_LABELS[item.task.status] : TIMELINE_EVENT_STATUS_LABELS[item.event.status]
  const vendorId = isTask ? item.task.vendorId : item.event.vendorId
  const responsible = (!isTask && item.event.responsiblePerson) || (vendorId ? vendorNameById.get(vendorId) : undefined)
  const time = !isTask && item.event.startTime && item.event.endTime ? formatTimeRange(item.event.startTime, item.event.endTime) : '—'

  return {
    key: `${item.kind}-${isTask ? item.task.id : item.event.id}`,
    time,
    title,
    responsible: responsible ?? '—',
    phase: phase ? DAY_PHASE_LABELS[phase] : '—',
    status,
  }
}

export function WeddingDayOfTab() {
  const { wedding } = useOutletContext<WeddingOutletContext>()
  const allTasks = useWorkspaceStore((s) => s.workspace.tasks)
  const allEvents = useWorkspaceStore((s) => s.workspace.timelineEvents)
  const allVendors = useWorkspaceStore((s) => s.workspace.vendors)
  const allVendorWeddingLinks = useWorkspaceStore((s) => s.workspace.vendorWeddingLinks)
  const ignoredConflictIds = useWorkspaceStore((s) => s.workspace.ignoredConflictIds)
  const updateTaskStatus = useWorkspaceStore((s) => s.updateTaskStatus)
  const updateTimelineEvent = useWorkspaceStore((s) => s.updateTimelineEvent)
  const ignoreTimelineConflict = useWorkspaceStore((s) => s.ignoreTimelineConflict)

  const tasks = allTasks.filter((t) => t.weddingId === wedding.id)
  const events = allEvents.filter((e) => e.weddingId === wedding.id)
  const vendors = allVendors.filter((v) => v.weddingIds.includes(wedding.id))
  const vendorById = useMemo(() => new Map(allVendors.map((v) => [v.id, v])), [allVendors])
  const vendorNameById = useMemo(() => new Map(allVendors.map((v) => [v.id, v.name])), [allVendors])
  /** Statut + horaire d'arrivée de tous les prestataires du mariage — pas seulement ceux ayant un moment planning ce jour-là (cf. DayOfVendorSection). */
  const vendorAssignments = useMemo(
    () => getWeddingAssignments(allVendors, allVendorWeddingLinks, wedding.id),
    [allVendors, allVendorWeddingLinks, wedding.id],
  )

  const weddingDay = wedding.date.slice(0, 10)
  /** Périmètre strict jour J — mêmes tableaux utilisés par la liste et le Gantt, jamais deux filtres qui pourraient diverger. */
  const dayEvents = useMemo(() => events.filter((e) => e.date.slice(0, 10) === weddingDay), [events, weddingDay])
  const dayTasks = useMemo(() => tasks.filter((t) => t.dueDate && t.dueDate.slice(0, 10) === weddingDay), [tasks, weddingDay])

  const [view, setView] = useState<DayOfView>('liste')
  const [activePhases, setActivePhases] = useState<Set<DayPhase>>(() => new Set(DAY_PHASE_OPTIONS))
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [activeConflict, setActiveConflict] = useState<TimelineConflict | null>(null)

  const timeline = useMemo(() => buildDayOfTimeline(wedding.date, dayTasks, dayEvents), [wedding.date, dayTasks, dayEvents])
  const filtered = useMemo(
    () => filterDayOfTimelineByPhase(timeline, activePhases, DAY_PHASE_OPTIONS),
    [timeline, activePhases],
  )
  const mismatchedEvents = useMemo(() => findMismatchedDayOfEvents(wedding.date, events), [wedding.date, events])

  const minBuffer = wedding.minBufferMinutes ?? DEFAULT_MIN_BUFFER_MINUTES
  const conflicts = useMemo(
    () => detectTimelineConflicts(dayEvents, { minBufferMinutes: minBuffer, ignoredConflictIds }),
    [dayEvents, minBuffer, ignoredConflictIds],
  )

  const printRows = useMemo(() => timeline.map((item) => printRow(item, vendorNameById)), [timeline, vendorNameById])
  const exportDate = format(new Date(), 'd MMMM yyyy', { locale: fr })

  const togglePhase = (phase: DayPhase) => {
    setActivePhases((prev) => {
      const next = new Set(prev)
      if (next.has(phase)) next.delete(phase)
      else next.add(phase)
      return next
    })
  }

  const handleToggleTask = (taskId: string, done: boolean) => {
    updateTaskStatus(taskId, done ? 'terminee' : 'a_faire')
  }

  const openEdit = (event: TimelineEvent) => {
    setActiveConflict(null)
    setEditingEvent(event)
    setFormOpen(true)
  }

  const handleSubmit = (values: TimelineEventFormValues) => {
    if (!editingEvent) return
    updateTimelineEvent(editingEvent.id, toTimelineEventPatch(values))
    toast.success('Moment mis à jour.')
    setFormOpen(false)
  }

  const handleIgnoreConflict = (conflict: TimelineConflict) => {
    ignoreTimelineConflict(conflict.id)
    toast.success('Alerte ignorée.')
    setActiveConflict(null)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* data-testid : distingue ce bloc interactif du bloc print-only ci-dessous, qui répète volontairement les mêmes titres/prestataires pour l'impression — sans ça, les requêtes de test par texte deviennent ambiguës entre les deux copies. */}
      <div data-testid="dayof-screen" className="no-print flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl font-semibold text-foreground">Jour J</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {format(new Date(wedding.date), 'EEEE d MMMM yyyy', { locale: fr })} — déroulé chronologique du mariage.
            </p>
          </div>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="size-4" aria-hidden="true" />
            Imprimer / Exporter
          </Button>
        </div>

        {mismatchedEvents.length > 0 && (
          <div className="flex flex-col gap-1 rounded-lg border border-warning/40 bg-warning-bg px-4 py-3 text-sm text-warning">
            <p className="flex items-center gap-2 font-medium">
              <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
              {mismatchedEvents.length} moment{mismatchedEvents.length > 1 ? 's' : ''} marqué{mismatchedEvents.length > 1 ? 's' : ''} « Jour J » ne
              correspond{mismatchedEvents.length > 1 ? 'ent' : ''} plus à la date actuelle du mariage.
            </p>
            <p className="text-xs">
              {mismatchedEvents.map((e) => e.title).join(', ')} — vérifiez ces moments dans le{' '}
              <Link to={`/mariages/${wedding.id}/planning`} className="underline">
                Planning
              </Link>
              .
            </p>
          </div>
        )}

        <TimelineConflictAlert conflicts={conflicts} onSeeOptions={setActiveConflict} />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs value={view} onValueChange={(v) => setView(v as DayOfView)}>
            <TabsList>
              <TabsTrigger value="liste">Liste</TabsTrigger>
              <TabsTrigger value="gantt">Gantt</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-wrap gap-2">
            {DAY_PHASE_OPTIONS.map((phase) => (
              <Button
                key={phase}
                type="button"
                variant={activePhases.has(phase) ? 'default' : 'outline'}
                size="sm"
                onClick={() => togglePhase(phase)}
              >
                {DAY_PHASE_LABELS[phase]}
              </Button>
            ))}
          </div>
        </div>

        {view === 'liste' ? (
          timeline.length === 0 ? (
            <EmptyState description="Aucune tâche ni aucun moment prévu pour le jour du mariage." />
          ) : filtered.length === 0 ? (
            <EmptyState description="Aucun élément pour ces filtres." />
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map((item) => {
                const vendorId = item.kind === 'task' ? item.task.vendorId : item.event.vendorId
                return (
                  <DayOfItemCard
                    key={`${item.kind}-${item.kind === 'task' ? item.task.id : item.event.id}`}
                    item={item}
                    vendor={vendorId ? vendorById.get(vendorId) : undefined}
                    onToggleTask={handleToggleTask}
                  />
                )
              })}
            </div>
          )
        ) : (
          <TimelineGanttView
            wedding={wedding}
            events={dayEvents}
            tasks={dayTasks}
            vendorNameById={vendorNameById}
            conflicts={conflicts}
            onEditEvent={openEdit}
          />
        )}

        <DayOfVendorSection assignments={vendorAssignments} />
      </div>

      <div data-testid="dayof-print" className="print-only print-area flex flex-col gap-4">
        <div>
          <h1 className="text-xl font-semibold">{wedding.coupleName}</h1>
          <p className="text-sm">
            Jour J : {format(new Date(wedding.date), 'EEEE d MMMM yyyy', { locale: fr })} — Exporté le {exportDate}
          </p>
        </div>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-black/30 text-left">
              <th className="py-1 pr-3">Heure</th>
              <th className="py-1 pr-3">Moment / Tâche</th>
              <th className="py-1 pr-3">Responsable / Prestataire</th>
              <th className="py-1 pr-3">Phase</th>
              <th className="py-1">Statut</th>
            </tr>
          </thead>
          <tbody>
            {printRows.map((row) => (
              <tr key={row.key} className="border-b border-black/10">
                <td className="py-1 pr-3 whitespace-nowrap">{row.time}</td>
                <td className="py-1 pr-3">{row.title}</td>
                <td className="py-1 pr-3">{row.responsible}</td>
                <td className="py-1 pr-3">{row.phase}</td>
                <td className="py-1">{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {printRows.length === 0 && <p className="text-sm">Aucune tâche ni aucun moment prévu pour le jour du mariage.</p>}

        {vendorAssignments.length > 0 && (
          <>
            <h2 className="text-base font-semibold">Prestataires</h2>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-black/30 text-left">
                  <th className="py-1 pr-3">Prestataire</th>
                  <th className="py-1 pr-3">Statut</th>
                  <th className="py-1 pr-3">Arrivée</th>
                  <th className="py-1">Téléphone</th>
                </tr>
              </thead>
              <tbody>
                {vendorAssignments.map(({ vendor, link }) => (
                  <tr key={vendor.id} className="border-b border-black/10">
                    <td className="py-1 pr-3">{vendor.name}</td>
                    <td className="py-1 pr-3">{VENDOR_STATUS_LABELS[link.status]}</td>
                    <td className="py-1 pr-3">{link.arrivalTime ?? '—'}</td>
                    <td className="py-1">{vendor.phone ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      <TimelineEventForm
        key={formOpen ? (editingEvent?.id ?? 'new') : 'closed'}
        open={formOpen}
        onOpenChange={setFormOpen}
        event={editingEvent}
        defaultDate={weddingDay}
        vendors={vendors}
        onSubmit={handleSubmit}
      />

      <TimelineConflictDialog
        open={activeConflict !== null}
        onOpenChange={(open) => !open && setActiveConflict(null)}
        conflict={activeConflict}
        events={dayEvents}
        onEditEvent={openEdit}
        onIgnore={handleIgnoreConflict}
      />
    </div>
  )
}
