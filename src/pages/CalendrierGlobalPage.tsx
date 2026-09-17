import { useMemo, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AgendaView } from '@/features/calendar/components/AgendaView'
import { CalendarFilters, type CalendarToggleFilters } from '@/features/calendar/components/CalendarFilters'
import { MonthView } from '@/features/calendar/components/MonthView'
import { WeekView } from '@/features/calendar/components/WeekView'
import { buildCalendarItems, computeConflictsByWedding } from '@/features/calendar/calendarItems'
import { useWorkspaceStore } from '@/store/workspaceStore'

export function CalendrierGlobalPage() {
  const allWeddings = useWorkspaceStore((s) => s.workspace.weddings)
  const weddings = allWeddings.filter((w) => !w.archived)
  const tasks = useWorkspaceStore((s) => s.workspace.tasks)
  const events = useWorkspaceStore((s) => s.workspace.timelineEvents)
  const ignoredConflictIds = useWorkspaceStore((s) => s.workspace.ignoredConflictIds)

  const [weddingFilter, setWeddingFilter] = useState('tous')
  const [toggles, setToggles] = useState<CalendarToggleFilters>({ tasks: true, events: true, alertsOnly: false })

  const conflictsByWedding = useMemo(
    () => computeConflictsByWedding(weddings, events, ignoredConflictIds),
    [weddings, events, ignoredConflictIds],
  )

  const items = useMemo(() => {
    const all = buildCalendarItems(weddings, tasks, events, conflictsByWedding)
    return all
      .filter((item) => weddingFilter === 'tous' || item.weddingId === weddingFilter)
      .filter((item) => (item.kind === 'task' ? toggles.tasks : toggles.events))
      .filter((item) => !toggles.alertsOnly || item.isAlert)
  }, [weddings, tasks, events, conflictsByWedding, weddingFilter, toggles])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground">Calendrier</h1>
        <p className="mt-1 text-sm text-muted-foreground">Tâches et moments de planning, tous mariages confondus.</p>
      </div>

      <CalendarFilters
        weddings={weddings}
        weddingFilter={weddingFilter}
        onWeddingFilterChange={setWeddingFilter}
        toggles={toggles}
        onTogglesChange={setToggles}
      />

      <Tabs defaultValue="agenda">
        <TabsList>
          <TabsTrigger value="mois">Mois</TabsTrigger>
          <TabsTrigger value="semaine">Semaine</TabsTrigger>
          <TabsTrigger value="agenda">Agenda</TabsTrigger>
        </TabsList>
        <TabsContent value="mois" className="pt-4">
          <MonthView items={items} />
        </TabsContent>
        <TabsContent value="semaine" className="pt-4">
          <WeekView items={items} />
        </TabsContent>
        <TabsContent value="agenda" className="pt-4">
          <AgendaView items={items} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
