import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MonthYearPicker } from '@/features/calendar/components/MonthYearPicker'

afterEach(cleanup)

function setup(onSelect = vi.fn()) {
  render(
    <MonthYearPicker value={new Date(2026, 8, 20)} onSelect={onSelect}>
      <button type="button">Septembre 2026</button>
    </MonthYearPicker>,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Septembre 2026' }))
  return onSelect
}

describe('MonthYearPicker', () => {
  it("ouvre une grille de 12 mois pour l'année courante et sélectionne un mois", () => {
    const onSelect = setup()
    expect(screen.getByRole('button', { name: /2026, choisir une autre année/ })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'mars' }))
    expect(onSelect).toHaveBeenCalledTimes(1)
    const date = onSelect.mock.calls[0][0] as Date
    expect([date.getFullYear(), date.getMonth()]).toEqual([2026, 2])
  })

  it("permet de changer d'année avec les chevrons", () => {
    const onSelect = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Année suivante' }))
    fireEvent.click(screen.getByRole('button', { name: 'janv.' }))
    const date = onSelect.mock.calls[0][0] as Date
    expect([date.getFullYear(), date.getMonth()]).toEqual([2027, 0])
  })

  it("permet de sauter directement à une année via la liste des années", () => {
    const onSelect = setup()
    fireEvent.click(screen.getByRole('button', { name: /2026, choisir une autre année/ }))
    fireEvent.click(screen.getByRole('button', { name: '2029' }))
    fireEvent.click(screen.getByRole('button', { name: 'déc.' }))
    const date = onSelect.mock.calls[0][0] as Date
    expect([date.getFullYear(), date.getMonth()]).toEqual([2029, 11])
  })

  it('marque le mois affiché comme sélectionné', () => {
    setup()
    expect(screen.getByRole('button', { name: 'sept.' }).getAttribute('aria-pressed')).toBe('true')
  })
})
