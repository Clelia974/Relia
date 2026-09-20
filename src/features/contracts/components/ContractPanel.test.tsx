import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { ContractPanel } from '@/features/contracts/components/ContractPanel'
import type { Contract } from '@/types/entities'

afterEach(cleanup)

function setup(contract?: Contract) {
  const onChange = vi.fn()
  render(<ContractPanel contract={contract} onChange={onChange} />)
  return onChange
}

describe('ContractPanel', () => {
  it('sans contrat enregistré, le statut affiché est "À rédiger" et aucune date n\'est demandée', () => {
    setup()
    expect(screen.getByRole('radio', { name: 'À rédiger' }).getAttribute('aria-checked')).toBe('true')
    expect(screen.queryByLabelText("Date d'envoi")).toBeNull()
    expect(screen.queryByLabelText('Date de signature')).toBeNull()
  })

  it('passer à "Envoyé au client" enregistre le statut avec une date d\'envoi', () => {
    const onChange = setup()
    fireEvent.click(screen.getByRole('radio', { name: 'Envoyé au client' }))
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ status: 'envoye', sentAt: expect.any(String) }))
  })

  it('passer à "Signé" enregistre une date de signature', () => {
    const onChange = setup({ status: 'envoye', sentAt: '2026-09-01T00:00:00.000Z' })
    fireEvent.click(screen.getByRole('radio', { name: 'Signé' }))
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ status: 'signe', sentAt: '2026-09-01T00:00:00.000Z', signedAt: expect.any(String) }))
  })

  it('un contrat signé affiche les deux dates et permet de corriger la date de signature', () => {
    const onChange = setup({ status: 'signe', sentAt: '2026-09-01T00:00:00.000Z', signedAt: '2026-09-10T00:00:00.000Z' })
    expect((screen.getByLabelText("Date d'envoi") as HTMLInputElement).value).toBe('2026-09-01')
    expect((screen.getByLabelText('Date de signature') as HTMLInputElement).value).toBe('2026-09-10')
    fireEvent.change(screen.getByLabelText('Date de signature'), { target: { value: '2026-09-12' } })
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ status: 'signe', signedAt: new Date('2026-09-12').toISOString() }))
  })

  it("enregistre les notes à la sortie du champ, et seulement si elles ont changé", () => {
    const onChange = setup({ status: 'a_rediger' })
    const notes = screen.getByLabelText(/Notes/)
    fireEvent.blur(notes)
    expect(onChange).not.toHaveBeenCalled()
    fireEvent.change(notes, { target: { value: 'Clause acompte à revoir' } })
    fireEvent.blur(notes)
    expect(onChange).toHaveBeenCalledWith({ status: 'a_rediger', notes: 'Clause acompte à revoir' })
  })

  it('précise que le dépôt du PDF viendra plus tard', () => {
    setup()
    expect(screen.getByText(/dépôt du contrat signé/i)).toBeTruthy()
  })
})
