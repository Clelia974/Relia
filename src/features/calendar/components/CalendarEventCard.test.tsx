import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { CalendarEventCard } from '@/features/calendar/components/CalendarEventCard'
import type { CalendarItem } from '@/features/calendar/calendarItems'
import type { TimelineEvent } from '@/types/entities'

afterEach(cleanup)

function makeItem(event: Partial<TimelineEvent>): CalendarItem {
  const full: TimelineEvent = {
    id: 'e1',
    weddingId: 'w1',
    title: 'Soirée dansante',
    date: '2026-06-06T00:00:00.000Z',
    type: 'jalon',
    status: 'prevu',
    isPhotoMoment: false,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...event,
  }
  return { kind: 'event', id: full.id, weddingId: full.weddingId, weddingName: 'Camille & Antoine', date: full.date, event: full, isAlert: false }
}

describe('CalendarEventCard — 13. affichage dans le calendrier', () => {
  it('affiche "(+1 j)" pour un moment qui traverse minuit', () => {
    render(
      <MemoryRouter>
        <CalendarEventCard item={makeItem({ startTime: '23:00', endTime: '01:00' })} />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link').textContent).toContain('23:00–01:00 (+1 j)')
  })

  it("n'affiche pas de suffixe pour un moment le même jour", () => {
    render(
      <MemoryRouter>
        <CalendarEventCard item={makeItem({ startTime: '09:00', endTime: '10:00' })} />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link').textContent).toContain('09:00–10:00')
    expect(screen.getByRole('link').textContent).not.toContain('+1 j')
  })
})
