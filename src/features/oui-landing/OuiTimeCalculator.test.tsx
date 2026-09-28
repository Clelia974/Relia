import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { OuiTimeCalculator } from '@/features/oui-landing/OuiTimeCalculator'

afterEach(cleanup)

describe('OuiTimeCalculator', () => {
  it("n'affiche aucun résultat tant que les champs sont vides (effet de révélation)", () => {
    render(<OuiTimeCalculator />)
    expect(screen.queryByText(/h$/)).toBeNull()
    expect(screen.getByText('Renseigne tes chiffres pour voir ton estimation.')).toBeInTheDocument()
  })

  it('affiche l’estimation une fois les deux champs nécessaires renseignés', () => {
    render(<OuiTimeCalculator />)
    fireEvent.change(screen.getByLabelText(/Demandes reçues/), { target: { value: '50' } })
    fireEvent.change(screen.getByLabelText(/Temps moyen par demande/), { target: { value: '15' } })
    expect(screen.getByText('≈ 12.5 h')).toBeInTheDocument()
    expect(screen.queryByText('Renseigne tes chiffres pour voir ton estimation.')).toBeNull()
  })
})
