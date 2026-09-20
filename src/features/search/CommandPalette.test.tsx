import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { CommandPalette } from '@/features/search/CommandPalette'
import { createEmptyWorkspace } from '@/lib/workspace/factories'
import { useWorkspaceStore } from '@/store/workspaceStore'

afterEach(cleanup)

function Where() {
  const location = useLocation()
  return <p data-testid="where">{location.pathname + location.search}</p>
}

function setup() {
  const onOpenChange = vi.fn()
  render(
    <MemoryRouter>
      <CommandPalette open onOpenChange={onOpenChange} />
      <Where />
    </MemoryRouter>,
  )
  return { onOpenChange, input: screen.getByRole('combobox', { name: 'Rechercher' }) }
}

describe('CommandPalette', () => {
  let weddingId: string

  beforeEach(() => {
    useWorkspaceStore.setState({ workspace: createEmptyWorkspace() })
    const s = useWorkspaceStore.getState()
    weddingId = s.createWedding({ coupleName: 'Élodie & Marc', date: '2026-06-06T00:00:00.000Z', venue: 'Château', soldAmount: 0, clientBudget: 0, status: 'signe' })
    s.createWedding({ coupleName: 'Élise & Paul', date: '2026-07-06T00:00:00.000Z', venue: '', soldAmount: 0, clientBudget: 0, status: 'signe' })
    s.addVendor({ name: 'Bastien Caron', category: 'DJ', weddingIds: [weddingId] })
  })

  it("invite à taper tant que le champ est vide", () => {
    setup()
    expect(screen.getByText('Tapez pour chercher dans tout votre espace.')).toBeTruthy()
  })

  it('affiche les résultats groupés sans tenir compte des accents', () => {
    const { input } = setup()
    fireEvent.change(input, { target: { value: 'elodie' } })
    expect(screen.getByText('Mariages')).toBeTruthy()
    expect(screen.getByRole('option', { name: /Élodie & Marc/ })).toBeTruthy()
    expect(screen.queryByRole('option', { name: /Élise/ })).toBeNull()
  })

  it('les flèches changent la sélection et Entrée ouvre le résultat choisi', () => {
    const { input, onOpenChange } = setup()
    fireEvent.change(input, { target: { value: 'el' } })
    const options = screen.getAllByRole('option')
    expect(options.length).toBe(2)
    expect(options[0].getAttribute('aria-selected')).toBe('true')
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(screen.getAllByRole('option')[1].getAttribute('aria-selected')).toBe('true')
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(screen.getByTestId('where').textContent).toMatch(/^\/mariages\/.+/)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('un prestataire ouvre sa fiche via ?fiche=', () => {
    const { input } = setup()
    fireEvent.change(input, { target: { value: 'bastien' } })
    fireEvent.click(screen.getByRole('option', { name: /Bastien Caron/ }))
    expect(screen.getByTestId('where').textContent).toMatch(/^\/prestataires\?fiche=/)
  })

  it("dit quand rien ne correspond", () => {
    const { input } = setup()
    fireEvent.change(input, { target: { value: 'zzzz' } })
    expect(screen.getByText(/Aucun résultat/)).toBeTruthy()
  })
})
