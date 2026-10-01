import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router-dom'
import { createEmptyWorkspace } from '@/lib/workspace/factories'
import { useWorkspaceStore } from '@/store/workspaceStore'
import { WeddingFloorPlanTab } from '@/pages/mariages/WeddingFloorPlanTab'

afterEach(cleanup)

const useIsDesktopMock = vi.hoisted(() => vi.fn())
vi.mock('@/hooks/useIsDesktop', () => ({ useIsDesktop: useIsDesktopMock }))

function seedAndRender() {
  const weddingId = useWorkspaceStore.getState().createWedding({
    coupleName: 'Camille & Antoine',
    date: '2026-06-06T00:00:00.000Z',
    venue: '',
    soldAmount: 5000,
    clientBudget: 5000,
    status: 'signe',
  })
  function Layout() {
    const wedding = useWorkspaceStore((s) => s.workspace.weddings.find((w) => w.id === weddingId))!
    return <Outlet context={{ wedding }} />
  }
  const router = createMemoryRouter([{ path: '/', element: <Layout />, children: [{ index: true, element: <WeddingFloorPlanTab /> }] }])
  render(<RouterProvider router={router} />)
  return weddingId
}

describe('WeddingFloorPlanTab', () => {
  beforeEach(() => {
    useWorkspaceStore.setState({ workspace: createEmptyWorkspace() })
    useIsDesktopMock.mockReturnValue(true)
  })

  it('crée la première version « Principal » et ouvre l’éditeur', () => {
    seedAndRender()
    fireEvent.click(screen.getByRole('button', { name: /Commencer le plan/ }))
    expect(useWorkspaceStore.getState().workspace.floorPlans.map((p) => p.title)).toEqual(['Principal'])
    expect(screen.getByRole('tab', { name: /Placement/ })).toBeInTheDocument()
    expect(screen.getByText('Dessinez la salle')).toBeInTheDocument()
  })

  it('sur mobile : plan en lecture seule et liste « qui est assis où »', async () => {
    useIsDesktopMock.mockReturnValue(false)
    const weddingId = seedAndRender()
    const store = useWorkspaceStore.getState()
    fireEvent.click(screen.getByRole('button', { name: /Commencer le plan/ }))
    store.addGuests(weddingId, [{ name: 'Camille Martin' }, { name: 'Antoine Durand' }])
    const planId = useWorkspaceStore.getState().workspace.floorPlans[0].id
    const guests = useWorkspaceStore.getState().workspace.guests
    store.setFloorPlanContent(planId, {
      elements: [{ id: 't1', kind: 'table_ronde', x: 0, y: 0, w: 120, h: 120, rotation: 0, z: 1, seats: 8, label: 'Table 1' }],
      assignments: [
        { guestId: guests[0].id, elementId: 't1', seat: 0 },
        { guestId: guests[1].id, elementId: 't1', seat: 1 },
      ],
    })
    expect(screen.getByText(/Ouvrez SilkyPlace sur ordinateur/)).toBeInTheDocument()
    expect(await screen.findByText('Camille Martin, Antoine Durand')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Table 1, place 1 : Camille Martin' })).toBeInTheDocument()
  })
})
