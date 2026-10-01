import { describe, expect, it } from 'vitest'
import {
  addGuests,
  assignSeat,
  createFloorPlan,
  deleteGuest,
  duplicateFloorPlan,
  guestsByTable,
  parseGuestLines,
  sanitizeAssignments,
  seatingStats,
  setFloorPlanContent,
} from '@/features/floorplan/floorPlanOps'
import { createEmptyWorkspace } from '@/lib/workspace/factories'
import type { FloorElement, SeatAssignment, Workspace } from '@/types/entities'

const T = '2026-10-01T00:00:00.000Z'
const table = (id: string, seats: number, label?: string): FloorElement => ({ id, kind: 'table_ronde', x: 0, y: 0, w: 100, h: 100, rotation: 0, z: 0, seats, label })
const seat = (guestId: string, elementId: string, s: number): SeatAssignment => ({ guestId, elementId, seat: s })

describe('assignSeat', () => {
  it('assoit un invité non placé', () => {
    expect(assignSeat([], 'g1', 't1', 0)).toEqual([seat('g1', 't1', 0)])
  })

  it('déplace un invité déjà assis', () => {
    expect(assignSeat([seat('g1', 't1', 0)], 'g1', 't2', 3)).toEqual([seat('g1', 't2', 3)])
  })

  it('échange deux invités assis', () => {
    const next = assignSeat([seat('g1', 't1', 0), seat('g2', 't2', 1)], 'g1', 't2', 1)
    expect(next).toEqual(expect.arrayContaining([seat('g1', 't2', 1), seat('g2', 't1', 0)]))
    expect(next).toHaveLength(2)
  })

  it('un invité non placé qui prend une place occupée renvoie l’autre dans les non placés', () => {
    expect(assignSeat([seat('g2', 't1', 0)], 'g1', 't1', 0)).toEqual([seat('g1', 't1', 0)])
  })
})

describe('sanitizeAssignments', () => {
  it('retire places supprimées, places en trop, invités inconnus et doublons', () => {
    const elements = [table('t1', 2)]
    const result = sanitizeAssignments(
      elements,
      [seat('g1', 't1', 0), seat('g2', 't1', 5), seat('g3', 'disparue', 0), seat('inconnu', 't1', 1), seat('g1', 't1', 1)],
      new Set(['g1', 'g2', 'g3']),
    )
    expect(result).toEqual([seat('g1', 't1', 0)])
  })
})

describe('parseGuestLines', () => {
  it('une ligne par invité, groupe après ; ou tabulation, sans doublons', () => {
    expect(parseGuestLines('Camille Martin ; Famille de Camille\n\nAntoine\tTémoins\n  Lina   Roux \nAntoine\tTémoins')).toEqual([
      { name: 'Camille Martin', group: 'Famille de Camille' },
      { name: 'Antoine', group: 'Témoins' },
      { name: 'Lina Roux' },
    ])
  })
})

describe('workspace', () => {
  function setup() {
    let n = 0
    let ws: Workspace = { ...createEmptyWorkspace(), weddings: [{ id: 'w1', coupleName: 'C', date: T, venue: '', soldAmount: 1, clientBudget: 1, status: 'signe' as const, archived: false, vendorIds: [], createdAt: T, updatedAt: T }] }
    ws = addGuests(ws, 'w1', [{ name: 'Camille' }, { name: 'Antoine' }], () => `g${++n}`, T)
    ws = createFloorPlan(ws, 'w1', 'Principal', 'p1', T)
    ws = setFloorPlanContent(ws, 'p1', { elements: [table('t1', 8, 'Table 2'), table('t2', 4, 'Table 1')], assignments: [seat('g1', 't1', 0), seat('g2', 't1', 1)] }, T)
    return ws
  }

  it('la copie d’une version garde formes et placement', () => {
    const ws = duplicateFloorPlan(setup(), 'p1', 'p2', 'Version pluie', T)
    expect(ws.floorPlans[1]).toMatchObject({ id: 'p2', title: 'Version pluie', assignments: ws.floorPlans[0].assignments })
  })

  it('supprimer un invité le retire de toutes les versions', () => {
    let ws = duplicateFloorPlan(setup(), 'p1', 'p2', 'Copie', T)
    ws = deleteGuest(ws, 'g1')
    expect(ws.floorPlans.every((p) => p.assignments.every((a) => a.guestId !== 'g1'))).toBe(true)
  })

  it('compteur et liste par table (tables triées par nom, invités par place)', () => {
    const ws = setup()
    const plan = ws.floorPlans[0]
    expect(seatingStats(plan.elements, plan.assignments, 3)).toEqual({ total: 12, filled: 2, unplaced: 1 })
    const list = guestsByTable(plan.elements, plan.assignments, ws.guests)
    expect(list.map((t) => t.table.label)).toEqual(['Table 1', 'Table 2'])
    expect(list[1].guests.map((g) => g.name)).toEqual(['Camille', 'Antoine'])
  })
})
