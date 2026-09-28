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
  it('affiche l’en-tête Relia par défaut', () => {
    useSubmitLeadMock.mockReturnValue({ submitLead: vi.fn(), isLoading: false, error: null })
    renderAt('/lead/new/u1')

    expect(screen.getByLabelText("Relia — retour à l'accueil")).toBeInTheDocument()
  })

  it('masque l’en-tête Relia en mode ?embed=1 (pensé pour un iframe sur le site de la décoratrice)', () => {
    useSubmitLeadMock.mockReturnValue({ submitLead: vi.fn(), isLoading: false, error: null })
    renderAt('/lead/new/u1?embed=1')

    expect(screen.queryByLabelText("Relia — retour à l'accueil")).not.toBeInTheDocument()
    expect(screen.getByText('Faire une demande')).toBeInTheDocument()
  })
})
