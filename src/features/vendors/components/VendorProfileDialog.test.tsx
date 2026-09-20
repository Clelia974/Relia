import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { VendorProfileDialog } from '@/features/vendors/components/VendorProfileDialog'
import { createEmptyWorkspace } from '@/lib/workspace/factories'
import { useWorkspaceStore } from '@/store/workspaceStore'

afterEach(cleanup)

describe('VendorProfileDialog', () => {
  let vendorId: string

  beforeEach(() => {
    useWorkspaceStore.setState({ workspace: createEmptyWorkspace() })
    const base = { date: '2026-06-06T00:00:00.000Z', venue: '', soldAmount: 0, clientBudget: 0, status: 'signe' as const }
    const w1 = useWorkspaceStore.getState().createWedding({ ...base, coupleName: 'Alice & Bob' })
    const w2 = useWorkspaceStore.getState().createWedding({ ...base, coupleName: 'Chloé & Dan' })
    vendorId = useWorkspaceStore.getState().addVendor({ name: 'Studio Lumière', category: 'Photographe', phone: '0612345678', weddingIds: [w1] })
    useWorkspaceStore.getState().addVendorToWedding(vendorId, w2)
    useWorkspaceStore.getState().updateVendorAssignment(vendorId, w1, { status: 'confirme', arrivalTime: '09:30', estimatedCost: 1500, notes: 'Préparatifs' })
  })

  function open(onClose = vi.fn()) {
    render(
      <MemoryRouter>
        <TooltipProvider>
          <VendorProfileDialog vendorId={vendorId} onClose={onClose} />
        </TooltipProvider>
      </MemoryRouter>,
    )
    return onClose
  }

  it('affiche les infos globales et chaque affectation avec son statut, horaire, coûts et notes', () => {
    open()
    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(screen.getByText('Studio Lumière')).toBeTruthy()
    expect(screen.getByText('0612345678')).toBeTruthy()
    expect(screen.getByText('Alice & Bob')).toBeTruthy()
    expect(screen.getByText('Chloé & Dan')).toBeTruthy()
    expect(screen.getByText('Confirmé')).toBeTruthy()
    expect(screen.getByText('À contacter')).toBeTruthy()
    expect(screen.getByText('09:30')).toBeTruthy()
    expect(screen.getByText('Préparatifs')).toBeTruthy()
  })

  it('chaque mariage lié pointe vers sa vue Prestataires', () => {
    open()
    expect(screen.getByRole('link', { name: 'Alice & Bob' }).getAttribute('href')).toMatch(/^\/mariages\/.+\/prestataires$/)
  })

  it('se ferme avec Escape', () => {
    const onClose = open()
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })

  it('les boutons sont atteignables au clavier (éléments focusables natifs)', () => {
    open()
    const button = screen.getByRole('button', { name: /modifier la fiche/i })
    button.focus()
    expect(document.activeElement).toBe(button)
  })
})
