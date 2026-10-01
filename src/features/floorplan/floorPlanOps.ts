import { isTable } from '@/features/floorplan/floorPlanGeometry'
import type { FloorElement, FloorPlan, Guest, SeatAssignment, Workspace } from '@/types/entities'

/**
 * Opérations pures du plan de salle / plan de table (Workspace → Workspace,
 * ou sur le contenu d'une version) — le store et l'éditeur ne font que les
 * appeler, ce qui les garde testables sans React.
 */

export interface FloorPlanContent {
  elements: FloorElement[]
  assignments: SeatAssignment[]
}

// ——— Versions du plan ———

export function createFloorPlan(ws: Workspace, weddingId: string, title: string, id: string, now: string): Workspace {
  const plan: FloorPlan = { id, weddingId, title, elements: [], assignments: [], createdAt: now, updatedAt: now }
  return { ...ws, floorPlans: [...ws.floorPlans, plan] }
}

/** Copie une version (formes ET placement) — pratique pour tester une variante sans perdre l'originale. */
export function duplicateFloorPlan(ws: Workspace, id: string, newId: string, title: string, now: string): Workspace {
  const source = ws.floorPlans.find((p) => p.id === id)
  if (!source) return ws
  return { ...ws, floorPlans: [...ws.floorPlans, { ...source, id: newId, title, createdAt: now, updatedAt: now }] }
}

export function renameFloorPlan(ws: Workspace, id: string, title: string, now: string): Workspace {
  return { ...ws, floorPlans: ws.floorPlans.map((p) => (p.id === id ? { ...p, title, updatedAt: now } : p)) }
}

export function deleteFloorPlan(ws: Workspace, id: string): Workspace {
  return { ...ws, floorPlans: ws.floorPlans.filter((p) => p.id !== id) }
}

/**
 * Retire les placements devenus impossibles : table supprimée ou changée en
 * autre chose, place au-delà du nouveau nombre de places, invité supprimé,
 * doublons (un invité = une place, une place = un invité).
 */
export function sanitizeAssignments(elements: FloorElement[], assignments: SeatAssignment[], guestIds?: Set<string>): SeatAssignment[] {
  const tables = new Map(elements.filter(isTable).map((e) => [e.id, e.seats ?? 0]))
  const seenGuests = new Set<string>()
  const seenSeats = new Set<string>()
  return assignments.filter((a) => {
    const seats = tables.get(a.elementId)
    const seatKey = `${a.elementId}:${a.seat}`
    if (seats === undefined || a.seat >= seats) return false
    if (guestIds && !guestIds.has(a.guestId)) return false
    if (seenGuests.has(a.guestId) || seenSeats.has(seatKey)) return false
    seenGuests.add(a.guestId)
    seenSeats.add(seatKey)
    return true
  })
}

export function setFloorPlanContent(ws: Workspace, id: string, content: FloorPlanContent, now: string): Workspace {
  const plan = ws.floorPlans.find((p) => p.id === id)
  if (!plan) return ws
  const guestIds = new Set(ws.guests.filter((g) => g.weddingId === plan.weddingId).map((g) => g.id))
  const assignments = sanitizeAssignments(content.elements, content.assignments, guestIds)
  return { ...ws, floorPlans: ws.floorPlans.map((p) => (p.id === id ? { ...p, elements: content.elements, assignments, updatedAt: now } : p)) }
}

// ——— Placement ———

/**
 * Assoit un invité à une place. S'il était déjà assis ailleurs, il quitte
 * son ancienne place ; si la place visée était prise, les deux invités
 * échangent (l'autre prend l'ancienne place, ou redevient « non placé »).
 */
export function assignSeat(assignments: SeatAssignment[], guestId: string, elementId: string, seat: number): SeatAssignment[] {
  const previous = assignments.find((a) => a.guestId === guestId)
  const occupant = assignments.find((a) => a.elementId === elementId && a.seat === seat)
  if (occupant?.guestId === guestId) return assignments
  const rest = assignments.filter((a) => a.guestId !== guestId && a !== occupant)
  const next = [...rest, { guestId, elementId, seat }]
  if (occupant && previous) next.push({ guestId: occupant.guestId, elementId: previous.elementId, seat: previous.seat })
  return next
}

export function unassignGuest(assignments: SeatAssignment[], guestId: string): SeatAssignment[] {
  return assignments.filter((a) => a.guestId !== guestId)
}

/** Places au total, places occupées, invités sans place — le compteur « 9/36 places · 5 non placés ». */
export function seatingStats(elements: FloorElement[], assignments: SeatAssignment[], guestCount: number) {
  const total = elements.filter(isTable).reduce((n, e) => n + (e.seats ?? 0), 0)
  return { total, filled: assignments.length, unplaced: Math.max(0, guestCount - assignments.length) }
}

/** Invités assis à chaque table, dans l'ordre des places — pour la liste imprimable et la vue mobile. */
export function guestsByTable(elements: FloorElement[], assignments: SeatAssignment[], guests: Guest[]) {
  const byId = new Map(guests.map((g) => [g.id, g]))
  return elements
    .filter(isTable)
    .map((table) => ({
      table,
      guests: assignments
        .filter((a) => a.elementId === table.id)
        .sort((a, b) => a.seat - b.seat)
        .flatMap((a) => {
          const g = byId.get(a.guestId)
          return g ? [g] : []
        }),
    }))
    .sort((a, b) => (a.table.label ?? '').localeCompare(b.table.label ?? '', 'fr', { numeric: true }))
}

// ——— Invités ———

export interface NewGuest {
  name: string
  group?: string
  notes?: string
}

/**
 * Une liste collée (Excel, Notes, e-mail…) → invités. Une ligne = un
 * invité ; « Nom ; Groupe » ou « Nom<Tab>Groupe » renseigne le groupe.
 * Lignes vides et doublons exacts ignorés.
 */
export function parseGuestLines(text: string): NewGuest[] {
  const seen = new Set<string>()
  const guests: NewGuest[] = []
  for (const line of text.split(/\r?\n/)) {
    const [rawName, rawGroup] = line.split(/\t|;/)
    const name = rawName?.trim().replace(/\s+/g, ' ')
    if (!name) continue
    const group = rawGroup?.trim() || undefined
    const key = `${name.toLowerCase()}|${group?.toLowerCase() ?? ''}`
    if (seen.has(key)) continue
    seen.add(key)
    guests.push({ name, ...(group ? { group } : {}) })
  }
  return guests
}

export function addGuests(ws: Workspace, weddingId: string, guests: NewGuest[], newId: () => string, now: string): Workspace {
  const created: Guest[] = guests.map((g) => ({ id: newId(), weddingId, ...g, createdAt: now }))
  return { ...ws, guests: [...ws.guests, ...created] }
}

export function updateGuest(ws: Workspace, id: string, patch: Partial<NewGuest>): Workspace {
  return { ...ws, guests: ws.guests.map((g) => (g.id === id ? { ...g, ...patch } : g)) }
}

/** Supprime un invité et le retire de toutes les versions du plan. */
export function deleteGuest(ws: Workspace, id: string): Workspace {
  return {
    ...ws,
    guests: ws.guests.filter((g) => g.id !== id),
    floorPlans: ws.floorPlans.map((p) => (p.assignments.some((a) => a.guestId === id) ? { ...p, assignments: unassignGuest(p.assignments, id) } : p)),
  }
}
