import { useEffect, useMemo, useState } from 'react'
import { format, isSameDay, isTomorrow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Link } from 'react-router-dom'
import { useShallow } from 'zustand/react/shallow'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getUpcomingEvents } from '@/features/dashboard/summary'
import { useWorkspaceStore } from '@/store/workspaceStore'

function dayLabel(dateIso: string, today: Date): string {
  const date = new Date(dateIso)
  if (isSameDay(date, today)) return "Aujourd'hui"
  if (isTomorrow(date)) return 'Demain'
  return format(date, 'EEEE d MMMM', { locale: fr })
}

export function UpcomingEvents() {
  const upcomingWorkspace = useWorkspaceStore(
    useShallow((s) => ({ weddings: s.workspace.weddings, timelineEvents: s.workspace.timelineEvents, tasks: s.workspace.tasks })),
  )
  // Rafraîchi seulement quand le jour change, pour ne pas casser la
  // mémoïsation ci-dessous à chaque rendu tout en évitant de rester figé
  // sur "hier" si la page reste ouverte après minuit.
  const [today, setToday] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => {
      setToday((prev) => (isSameDay(prev, new Date()) ? prev : new Date()))
    }, 60_000)
    return () => clearInterval(id)
  }, [])
  const entries = useMemo(() => getUpcomingEvents(upcomingWorkspace, today), [upcomingWorkspace, today])

  const groups = useMemo(() => {
    const result: { label: string; items: typeof entries }[] = []
    for (const entry of entries) {
      const label = dayLabel(entry.date, today)
      const group = result.at(-1)
      if (group && group.label === label) {
        group.items.push(entry)
      } else {
        result.push({ label, items: [entry] })
      }
    }
    return result
  }, [entries, today])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Prochains événements</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {groups.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun événement à venir pour le moment.</p>
        ) : (
          groups.map((group) => (
            <div key={group.label} className="flex flex-col gap-1.5">
              <p className="text-xs font-medium capitalize text-muted-foreground">{group.label}</p>
              <ul className="flex flex-col gap-1.5">
                {group.items.map((entry) => (
                  <li key={entry.id} className="text-sm">
                    <Link
                      to={`/mariages/${entry.weddingId}/${entry.kind === 'tache' ? 'taches' : 'planning'}`}
                      className="flex items-baseline gap-2 hover:underline"
                    >
                      {entry.time && <span className="shrink-0 tabular-nums text-muted-foreground">{entry.time}</span>}
                      <span className="min-w-0 truncate text-foreground">— {entry.title}</span>
                    </Link>
                    <p className="pl-0 text-xs text-muted-foreground">{entry.weddingName}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}

        <Link to="/calendrier" className="text-sm text-foreground underline-offset-4 hover:underline">
          Voir le calendrier →
        </Link>
      </CardContent>
    </Card>
  )
}
