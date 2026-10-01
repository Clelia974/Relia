import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { SilkyPlaceTimeCalculator } from '@/features/silkyplace-landing/SilkyPlaceTimeCalculator'

afterEach(cleanup)

describe('SilkyPlaceTimeCalculator', () => {
  it("n'affiche aucun résultat tant que les champs sont vides (effet de révélation)", () => {
    render(<SilkyPlaceTimeCalculator />)
    expect(screen.queryByText(/h$/)).toBeNull()
    expect(screen.getByText('Renseigne tes chiffres pour voir ton estimation.')).toBeInTheDocument()
  })

  it('affiche l’estimation une fois les deux champs nécessaires renseignés', () => {
    render(<SilkyPlaceTimeCalculator />)
    fireEvent.change(screen.getByLabelText(/Demandes reçues/), { target: { value: '50' } })
    fireEvent.change(screen.getByLabelText(/Minutes par demande/), { target: { value: '15' } })
    expect(screen.getByText('≈ 12.5 h')).toBeInTheDocument()
    expect(screen.queryByText('Renseigne tes chiffres pour voir ton estimation.')).toBeNull()
  })
})
