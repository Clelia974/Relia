import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { TimelineEventForm } from '@/features/timeline/components/TimelineEventForm'
import type { TimelineEvent, Vendor } from '@/types/entities'

afterEach(cleanup)

const vendors: Vendor[] = []

function fillRequiredFields(title: string, start: string, end: string) {
  fireEvent.change(screen.getByLabelText('Nom du moment'), { target: { value: title } })
  fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-06-06' } })
  fireEvent.change(screen.getByLabelText('Heure de début'), { target: { value: start } })
  fireEvent.change(screen.getByLabelText('Heure de fin'), { target: { value: end } })
}

describe('TimelineEventForm — 15. création et modification (moment nocturne)', () => {
  it('accepte et soumet un moment 23:00 → 01:00 (traverse minuit)', () => {
    const onSubmit = vi.fn()
    render(<TimelineEventForm open onOpenChange={vi.fn()} vendors={vendors} onSubmit={onSubmit} />)

    fillRequiredFields('Soirée dansante', '23:00', '01:00')
    expect(screen.getByText(/120 minutes/)).toBeInTheDocument()
    expect(screen.getByText(/se termine le lendemain/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Ajouter le moment' }))

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ startTime: '23:00', endTime: '01:00' }))
  })

  it('accepte 23:30 → 02:00 (traverse minuit, 150 minutes)', () => {
    const onSubmit = vi.fn()
    render(<TimelineEventForm open onOpenChange={vi.fn()} vendors={vendors} onSubmit={onSubmit} />)

    fillRequiredFields('Fin de soirée', '23:30', '02:00')
    expect(screen.getByText(/150 minutes/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Ajouter le moment' }))
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ startTime: '23:30', endTime: '02:00' }))
  })

  it('rejette une heure de fin identique à l\'heure de début, avec un message en français', () => {
    const onSubmit = vi.fn()
    render(<TimelineEventForm open onOpenChange={vi.fn()} vendors={vendors} onSubmit={onSubmit} />)

    fillRequiredFields('Pause', '10:00', '10:00')
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter le moment' }))

    expect(screen.getByText("L'heure de fin ne peut pas être identique à l'heure de début.")).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('modification : un moment nocturne existant se pré-remplit et se resoumet correctement', () => {
    const existing: TimelineEvent = {
      id: 'e1',
      weddingId: 'w1',
      title: 'Soirée dansante',
      date: '2026-06-06T00:00:00.000Z',
      startTime: '23:00',
      endTime: '01:00',
      durationMinutes: 120,
      type: 'jalon',
      status: 'prevu',
      isPhotoMoment: false,
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    }
    const onSubmit = vi.fn()
    render(<TimelineEventForm open onOpenChange={vi.fn()} vendors={vendors} event={existing} onSubmit={onSubmit} />)

    expect(screen.getByLabelText('Heure de début')).toHaveValue('23:00')
    expect(screen.getByLabelText('Heure de fin')).toHaveValue('01:00')

    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ startTime: '23:00', endTime: '01:00' }))
  })

  it('même jour (09:00 → 10:00) reste accepté sans mention "lendemain"', () => {
    const onSubmit = vi.fn()
    render(<TimelineEventForm open onOpenChange={vi.fn()} vendors={vendors} onSubmit={onSubmit} />)

    fillRequiredFields('Coiffure', '09:00', '10:00')
    expect(screen.getByText(/60 minutes/)).toBeInTheDocument()
    expect(screen.queryByText(/se termine le lendemain/)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Ajouter le moment' }))
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ startTime: '09:00', endTime: '10:00' }))
  })
})
