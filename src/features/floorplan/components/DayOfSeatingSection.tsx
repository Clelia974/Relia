import { useState } from 'react'
import { Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { guestsByTable } from '@/features/floorplan/floorPlanOps'
import { cn } from '@/lib/utils'
import type { FloorPlan, Guest } from '@/types/entities'

const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

interface DayOfSeatingSectionProps {
  weddingId: string
  /** Versions du plan de ce mariage, la plus ancienne (« Principal ») en premier. */
  plans: FloorPlan[]
  guests: Guest[]
  /** Version affichée (aussi utilisée par l'impression du Jour J). */
  planId: string
  onPlanChange: (planId: string) => void
}

/**
 * « Qui est assis où » le jour J : liste table par table, avec les notes
 * (régime, allergie…), et une recherche pour répondre vite à « je suis à
 * quelle table ? ». N'apparaît que si un plan de table existe.
 */
export function DayOfSeatingSection({ weddingId, plans, guests, planId, onPlanChange }: DayOfSeatingSectionProps) {
  const [query, setQuery] = useState('')
  const plan = plans.find((p) => p.id === planId) ?? plans[0]
  const tables = guestsByTable(plan.elements, plan.assignments, guests)
  const q = normalize(query.trim())
  const matches = (g: Guest) => q !== '' && normalize(g.name).includes(q)
  const visible = q ? tables.filter((t) => t.guests.some(matches)) : tables
  const placed = new Set(plan.assignments.map((a) => a.guestId))
  const unplacedMatches = q ? guests.filter((g) => !placed.has(g.id) && matches(g)) : []

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-semibold text-foreground">Plan de table</h2>
          <p className="text-xs text-muted-foreground">
            {plan.assignments.length} invité{plan.assignments.length > 1 ? 's' : ''} placé{plan.assignments.length > 1 ? 's' : ''} ·{' '}
            <Link to={`/mariages/${weddingId}/plan?version=${plan.id}&mode=placement`} className="text-thread-text hover:underline">
              Ouvrir le plan
            </Link>
          </p>
        </div>
        {plans.length > 1 && (
          <Select value={plan.id} onValueChange={onPlanChange}>
            <SelectTrigger className="w-48" aria-label="Version du plan">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {plans.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Où est assis… ? (nom d’un invité)" aria-label="Chercher un invité" className="pl-9" />
      </div>

      {q && visible.length === 0 && unplacedMatches.length === 0 && <p className="text-sm text-muted-foreground">Aucun invité ne correspond.</p>}
      {unplacedMatches.length > 0 && (
        <p className="text-sm text-warning">
          Sans place : {unplacedMatches.map((g) => g.name).join(', ')}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map(({ table, guests: seated }) => (
          <Card key={table.id}>
            <CardContent className="flex flex-col gap-2">
              <p className="flex items-baseline justify-between gap-2">
                <span className="font-medium text-foreground">{table.label ?? 'Table'}</span>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {seated.length}/{table.seats ?? 0}
                </span>
              </p>
              {seated.length === 0 ? (
                <p className="text-xs text-muted-foreground">Personne pour l’instant</p>
              ) : (
                <ul className="flex flex-col gap-0.5 text-sm">
                  {seated.map((g) => (
                    <li key={g.id} className={cn('text-foreground/85', matches(g) && 'font-semibold text-foreground')}>
                      {g.name}
                      {g.notes && <span className="text-xs text-muted-foreground"> — {g.notes}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
