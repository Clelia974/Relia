import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { TimelineGanttView } from '@/features/timeline/components/TimelineGanttView'
import type { TimelineEvent, Wedding } from '@/types/entities'

afterEach(cleanup)

const wedding: Wedding = {
  id: 'w1',
  coupleName: 'Test',
  date: '2026-06-06T00:00:00.000Z',
  venue: '',
  soldAmount: 0,
  clientBudget: 0,
  status: 'signe',
  archived: false,
  vendorIds: [],
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
}

function makeEvent(overrides: Partial<TimelineEvent>): TimelineEvent {
  return {
    id: 'e1',
    weddingId: 'w1',
    title: 'Soirée dansante',
    date: '2026-06-06T00:00:00.000Z',
    type: 'jalon',
    status: 'prevu',
    isPhotoMoment: false,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('TimelineGanttView — 14. affichage dans le Gantt', () => {
  it("dessine une barre de largeur positive (jamais réduite au minimum de 3%) pour un moment nocturne", () => {
    const event = makeEvent({ startTime: '23:00', endTime: '01:00' })
    render(
      <TimelineGanttView wedding={wedding} events={[event]} tasks={[]} vendorNameById={new Map()} conflicts={[]} onEditEvent={vi.fn()} />,
    )

    const bar = screen.getByRole('button', { name: /Soirée dansante/ })
    // 120 minutes sur une plage de 120 minutes (23:00 à 01:00, seul événement) → largeur 100%, jamais le minimum de 3% réservé aux créneaux quasi nuls.
    expect(bar.style.width).not.toBe('3%')
    expect(screen.getByText(/23:00–01:00 \(\+1 j\)/)).toBeInTheDocument()
  })

  it("affiche un moment le même jour sans suffixe", () => {
    const event = makeEvent({ startTime: '09:00', endTime: '10:00' })
    render(
      <TimelineGanttView wedding={wedding} events={[event]} tasks={[]} vendorNameById={new Map()} conflicts={[]} onEditEvent={vi.fn()} />,
    )
    expect(screen.getByText('09:00–10:00')).toBeInTheDocument()
  })

  it("indique quand aucun moment n'a d'horaire, sans planter", () => {
    render(
      <TimelineGanttView wedding={wedding} events={[makeEvent({})]} tasks={[]} vendorNameById={new Map()} conflicts={[]} onEditEvent={vi.fn()} />,
    )
    expect(screen.getByText(/Aucun moment avec horaire/)).toBeInTheDocument()
  })
})
