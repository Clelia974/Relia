import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { LeadFormPage } from '@/pages/LeadFormPage'

afterEach(cleanup)

const useSubmitLeadMock = vi.hoisted(() => vi.fn())
vi.mock('@/features/leads/useSubmitLead', () => ({ useSubmitLead: useSubmitLeadMock }))

function renderAt(path: string) {
  const router = createMemoryRouter([{ path: '/lead/new/:userId', element: <LeadFormPage /> }], {
    initialEntries: [path],
  })
  return render(<RouterProvider router={router} />)
}

describe('LeadFormPage — intégration (lien classique vs iframe)', () => {
  it("n'affiche jamais la marque Zordi — la cliente ne doit voir que la décoratrice, jamais la plateforme", () => {
    useSubmitLeadMock.mockReturnValue({ submitLead: vi.fn(), isLoading: false, error: null })
    renderAt('/lead/new/u1')

    expect(screen.queryByLabelText('Zordi — retour à l\'accueil')).not.toBeInTheDocument()
    expect(screen.queryByText('Zordi')).not.toBeInTheDocument()
    expect(screen.getByText('Faire une demande')).toBeInTheDocument()
  })

  it('reste utilisable en mode ?embed=1 (pensé pour un iframe sur le site de la décoratrice)', () => {
    useSubmitLeadMock.mockReturnValue({ submitLead: vi.fn(), isLoading: false, error: null })
    renderAt('/lead/new/u1?embed=1')

    expect(screen.queryByText('Zordi')).not.toBeInTheDocument()
    expect(screen.getByText('Faire une demande')).toBeInTheDocument()
  })
})
