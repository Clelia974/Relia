import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { WeddingEditForm } from '@/features/weddings/components/WeddingEditForm'
import type { Wedding } from '@/types/entities'

afterEach(cleanup)

function makeWedding(overrides: Partial<Wedding> = {}): Wedding {
  return {
    id: 'w1',
    coupleName: 'Camille & Antoine',
    date: '2026-10-04T00:00:00.000Z',
    venue: 'Domaine des Roses',
    soldAmount: 15000,
    clientBudget: 15000,
    status: 'signe',
    archived: false,
    vendorIds: [],
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('WeddingEditForm', () => {
  it('pré-remplit les champs avec les valeurs actuelles du mariage', () => {
    render(
      <WeddingEditForm open wedding={makeWedding()} hasTimelineEvents={false} onOpenChange={vi.fn()} onSubmit={vi.fn()} />,
    )
    expect(screen.getByLabelText('Nom du couple')).toHaveValue('Camille & Antoine')
    expect(screen.getByLabelText('Date du mariage')).toHaveValue('2026-10-04')
    expect(screen.getByLabelText(/lieu du mariage/i)).toHaveValue('Domaine des Roses')
    expect(screen.getByRole('checkbox', { name: 'Archiver ce mariage' })).not.toBeChecked()
  })

  it('soumet les valeurs modifiées (nom, date, lieu, montants, statut)', () => {
    const onSubmit = vi.fn()
    render(
      <WeddingEditForm open wedding={makeWedding()} hasTimelineEvents={false} onOpenChange={vi.fn()} onSubmit={onSubmit} />,
    )
    fireEvent.change(screen.getByLabelText('Nom du couple'), { target: { value: 'Camille & Julien' } })
    fireEvent.change(screen.getByLabelText(/lieu du mariage/i), { target: { value: 'Château du Lac' } })
    fireEvent.change(screen.getByLabelText(/montant du contrat/i), { target: { value: '16000' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ coupleName: 'Camille & Julien', venue: 'Château du Lac', soldAmount: '16000' }),
    )
  })

  it('cocher "Archiver ce mariage" inclut archived: true dans la soumission, sans toucher au statut', () => {
    const onSubmit = vi.fn()
    render(
      <WeddingEditForm open wedding={makeWedding()} hasTimelineEvents={false} onOpenChange={vi.fn()} onSubmit={onSubmit} />,
    )
    fireEvent.click(screen.getByRole('checkbox', { name: 'Archiver ce mariage' }))
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ archived: true, status: 'signe' }))
  })

  it('affiche une erreur française et ne soumet pas si le nom du couple est vidé', () => {
    const onSubmit = vi.fn()
    render(
      <WeddingEditForm open wedding={makeWedding()} hasTimelineEvents={false} onOpenChange={vi.fn()} onSubmit={onSubmit} />,
    )
    fireEvent.change(screen.getByLabelText('Nom du couple'), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))

    expect(screen.getByText('Veuillez renseigner le nom du couple.')).toBeTruthy()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("n'affiche l'avertissement planning que si la date change ET que des événements existent déjà", () => {
    render(<WeddingEditForm open wedding={makeWedding()} hasTimelineEvents={false} onOpenChange={vi.fn()} onSubmit={vi.fn()} />)
    fireEvent.change(screen.getByLabelText('Date du mariage'), { target: { value: '2026-11-01' } })
    expect(screen.queryByText(/planning existant ne sera pas automatiquement décalé/i)).toBeNull()

    cleanup()
    render(<WeddingEditForm open wedding={makeWedding()} hasTimelineEvents onOpenChange={vi.fn()} onSubmit={vi.fn()} />)
    expect(screen.queryByText(/planning existant ne sera pas automatiquement décalé/i)).toBeNull()
    fireEvent.change(screen.getByLabelText('Date du mariage'), { target: { value: '2026-11-01' } })
    expect(screen.getByText(/planning existant ne sera pas automatiquement décalé/i)).toBeTruthy()
  })

  it('annuler sans modification ferme immédiatement, sans confirmation', () => {
    const onOpenChange = vi.fn()
    render(
      <WeddingEditForm open wedding={makeWedding()} hasTimelineEvents={false} onOpenChange={onOpenChange} onSubmit={vi.fn()} />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }))

    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(screen.queryByText('Abandonner les modifications ?')).toBeNull()
  })

  it('annuler avec une modification affiche une confirmation ; "Continuer l\'édition" garde le formulaire ouvert', () => {
    const onOpenChange = vi.fn()
    render(
      <WeddingEditForm open wedding={makeWedding()} hasTimelineEvents={false} onOpenChange={onOpenChange} onSubmit={vi.fn()} />,
    )
    fireEvent.change(screen.getByLabelText('Nom du couple'), { target: { value: 'Autre nom' } })
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }))

    expect(screen.getByText('Abandonner les modifications ?')).toBeTruthy()
    expect(onOpenChange).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: "Continuer l'édition" }))
    expect(onOpenChange).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Nom du couple')).toHaveValue('Autre nom')
  })

  it('"Abandonner" ferme le formulaire sans appeler onSubmit', () => {
    const onOpenChange = vi.fn()
    const onSubmit = vi.fn()
    render(
      <WeddingEditForm open wedding={makeWedding()} hasTimelineEvents={false} onOpenChange={onOpenChange} onSubmit={onSubmit} />,
    )
    fireEvent.change(screen.getByLabelText('Nom du couple'), { target: { value: 'Autre nom' } })
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }))
    fireEvent.click(screen.getByRole('button', { name: 'Abandonner' }))

    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
