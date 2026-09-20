import { useMemo, useState } from 'react'
import { CalendarFilters } from '@/features/calendar/components/CalendarFilters'
import { MonthView } from '@/features/calendar/components/MonthView'
import {
  buildCalendarItems,
  computeConflictsByWedding,
  filterCalendarItems,
  type CalendarSelection,
  type CalendarToggleFilters,
} from '@/features/calendar/calendarItems'
import { useWorkspaceStore } from '@/store/workspaceStore'

export function CalendrierGlobalPage() {
  const allWeddings = useWorkspaceStore((s) => s.workspace.weddings)
  const weddings = allWeddings.filter((w) => !w.archived)
  const tasks = useWorkspaceStore((s) => s.workspace.tasks)
  const vendors = useWorkspaceStore((s) => s.workspace.vendors)
  const events = useWorkspaceStore((s) => s.workspace.timelineEvents)
  const ignoredConflictIds = useWorkspaceStore((s) => s.workspace.ignoredConflictIds)

  const [selection, setSelection] = useState<CalendarSelection>({ weddingIds: [], vendorIds: [] })
  const [toggles, setToggles] = useState<CalendarToggleFilters>({ tasks: true, events: true, alertsOnly: false })

  const conflictsByWedding = useMemo(
    () => computeConflictsByWedding(weddings, events, ignoredConflictIds),
    [weddings, events, ignoredConflictIds],
  )

  const items = useMemo(
    () => filterCalendarItems(buildCalendarItems(weddings, tasks, events, conflictsByWedding), selection, toggles),
    [weddings, tasks, events, conflictsByWedding, selection, toggles],
  )

  return (
    <div className="flex flex-col gap-4">
      <h1 className="sr-only">Calendrier</h1>
      <MonthView
        items={items}
        filters={
          <CalendarFilters
            weddings={weddings}
            vendors={vendors}
            selection={selection}
            onSelectionChange={setSelection}
            toggles={toggles}
            onTogglesChange={setToggles}
          />
        }
      />
    </div>
  )
}
