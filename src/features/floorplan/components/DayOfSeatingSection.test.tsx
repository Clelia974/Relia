import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { DayOfSeatingSection } from '@/features/floorplan/components/DayOfSeatingSection'
import type { FloorElement, FloorPlan, Guest } from '@/types/entities'

afterEach(cleanup)

const T = '2026-10-01T00:00:00.000Z'
const table = (id: string, label: string): FloorElement => ({ id, kind: 'table_ronde', x: 0, y: 0, w: 120, h: 120, rotation: 0, z: 1, seats: 8, label })
const guests: Guest[] = [
  { id: 'g1', weddingId: 'w1', name: 'Mamie Jeanne', notes: 'sans gluten', createdAt: T },
  { id: 'g2', weddingId: 'w1', name: 'Hugo Moreau', createdAt: T },
  { id: 'g3', weddingId: 'w1', name: 'Clara Robin', createdAt: T },
]
const plan: FloorPlan = {
  id: 'p1',
  weddingId: 'w1',
  title: 'Principal',
  elements: [table('t1', 'Table 1'), table('t2', 'Table 2')],
  assignments: [
    { guestId: 'g1', elementId: 't1', seat: 0 },
    { guestId: 'g2', elementId: 't2', seat: 0 },
  ],
  createdAt: T,
  updatedAt: T,
}

function renderSection(onPlanChange = vi.fn()) {
  render(
    <MemoryRouter>
      <DayOfSeatingSection weddingId="w1" plans={[plan, { ...plan, id: 'p2', title: 'Version pluie' }]} guests={guests} planId="p1" onPlanChange={onPlanChange} />
    </MemoryRouter>,
  )
}

describe('DayOfSeatingSection', () => {
  it('liste les invités par table, avec leurs notes', () => {
    renderSection()
    expect(screen.getByText('Table 1')).toBeInTheDocument()
    expect(screen.getByText('Mamie Jeanne')).toBeInTheDocument()
    expect(screen.getByText(/sans gluten/)).toBeInTheDocument()
  })

  it('« Où est assis… ? » : ne garde que la table de l’invité (accents ignorés), et signale les invités sans place', () => {
    renderSection()
    fireEvent.change(screen.getByLabelText('Chercher un invité'), { target: { value: 'mamie' } })
    expect(screen.getByText('Table 1')).toBeInTheDocument()
    expect(screen.queryByText('Table 2')).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Chercher un invité'), { target: { value: 'clara' } })
    expect(screen.getByText(/Sans place : Clara Robin/)).toBeInTheDocument()
  })

  it('propose de choisir la version du plan quand il y en a plusieurs', () => {
    renderSection()
    expect(screen.getByLabelText('Version du plan')).toBeInTheDocument()
  })
})
