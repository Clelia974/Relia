import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { CalendarFilters } from '@/features/calendar/components/CalendarFilters'
import type { CalendarSelection } from '@/features/calendar/calendarItems'
import type { Vendor, Wedding } from '@/types/entities'

afterEach(cleanup)

const wedding = (id: string, coupleName: string, date: string): Wedding => ({
  id,
  coupleName,
  date,
  venue: '',
  soldAmount: 0,
  clientBudget: 0,
  status: 'signe',
  archived: false,
  vendorIds: [],
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
})

const weddings = [wedding('w1', 'Alice & Bob', '2026-06-06T00:00:00.000Z'), wedding('w2', 'Chloé & Dan', '2026-07-11T00:00:00.000Z')]
const vendors: Vendor[] = [
  { id: 'v1', name: 'Studio Lumière', category: 'Photographe', weddingIds: ['w1'] },
  { id: 'v2', name: 'DJ Mix', category: 'DJ', weddingIds: ['w2'] },
]
const toggles = { tasks: true, events: true, alertsOnly: false }

function setup(selection: CalendarSelection = { weddingIds: [], vendorIds: [] }) {
  const onSelectionChange = vi.fn()
  render(
    <CalendarFilters
      weddings={weddings}
      vendors={vendors}
      selection={selection}
      onSelectionChange={onSelectionChange}
      toggles={toggles}
      onTogglesChange={vi.fn()}
    />,
  )
  return onSelectionChange
}

describe('CalendarFilters', () => {
  it('remplace la liste déroulante par un bouton Filtrer qui ouvre le panneau', () => {
    setup()
    expect(screen.queryByText('Tous les mariages')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Filtrer' }))
    expect(screen.getByLabelText('Rechercher un mariage')).toBeTruthy()
    expect(screen.getByLabelText('Rechercher un prestataire')).toBeTruthy()
  })

  it('sélectionne un mariage', () => {
    const onChange = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Filtrer' }))
    fireEvent.click(screen.getByRole('checkbox', { name: /Alice & Bob/ }))
    expect(onChange).toHaveBeenCalledWith({ weddingIds: ['w1'], vendorIds: [] })
  })

  it('sélectionne un prestataire', () => {
    const onChange = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Filtrer' }))
    fireEvent.click(screen.getByRole('checkbox', { name: /DJ Mix/ }))
    expect(onChange).toHaveBeenCalledWith({ weddingIds: [], vendorIds: ['v2'] })
  })

  it('la recherche restreint la liste des mariages', () => {
    setup()
    fireEvent.click(screen.getByRole('button', { name: 'Filtrer' }))
    fireEvent.change(screen.getByLabelText('Rechercher un mariage'), { target: { value: 'chloe' } })
    const section = screen.getByRole('region', { name: 'Mariages' })
    expect(within(section).queryByText('Alice & Bob')).toBeNull()
    expect(within(section).getByText('Chloé & Dan')).toBeTruthy()
  })

  it('quand un mariage est choisi, seuls ses prestataires sont proposés', () => {
    setup({ weddingIds: ['w1'], vendorIds: [] })
    fireEvent.click(screen.getByRole('button', { name: /Filtrer, 1 filtre actif/ }))
    const section = screen.getByRole('region', { name: 'Prestataires' })
    expect(within(section).getByText('Studio Lumière')).toBeTruthy()
    expect(within(section).queryByText('DJ Mix')).toBeNull()
  })

  it('affiche les filtres actifs en pastilles retirables', () => {
    const onChange = setup({ weddingIds: ['w1'], vendorIds: ['v1'] })
    fireEvent.click(screen.getByRole('button', { name: 'Retirer le filtre Alice & Bob' }))
    expect(onChange).toHaveBeenCalledWith({ weddingIds: [], vendorIds: ['v1'] })
  })
})
