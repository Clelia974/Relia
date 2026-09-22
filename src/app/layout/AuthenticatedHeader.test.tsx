import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { AuthenticatedHeader } from '@/app/layout/AuthenticatedHeader'

afterEach(cleanup)

/** useAuth parle à Supabase (réseau) — mocké ici pour isoler le composant. */
const useAuthMock = vi.hoisted(() => vi.fn())
vi.mock('@/hooks/useAuth', () => ({ useAuth: useAuthMock }))

const logoutMock = vi.fn()

beforeEach(() => {
  logoutMock.mockReset()
  useAuthMock.mockReturnValue({
    user: { id: 'u1', email: 'local@relia.app' },
    isLoading: false,
    isAuthenticated: true,
    logout: logoutMock,
  })
})

function renderHeader() {
  const router = createMemoryRouter([
    { path: '/', element: <AuthenticatedHeader /> },
    { path: '/aujourdhui', element: <p>Page Aujourd'hui</p> },
  ])
  return render(<RouterProvider router={router} />)
}

describe('AuthenticatedHeader', () => {
  it('affiche le CTA vers l\'application et amène sur /aujourdhui', () => {
    renderHeader()

    fireEvent.click(screen.getByRole('button', { name: 'Aller à mon application' }))

    expect(screen.getByText("Page Aujourd'hui")).toBeInTheDocument()
  })

  it('affiche l\'email du compte dans le menu', () => {
    renderHeader()

    // Radix DropdownMenuTrigger s'ouvre au pointerdown, pas au click — cf. absence de userEvent dans ce repo.
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Menu du compte' }))

    expect(screen.getByText('local@relia.app')).toBeInTheDocument()
  })

  it('appelle logout depuis le menu', () => {
    renderHeader()

    fireEvent.pointerDown(screen.getByRole('button', { name: 'Menu du compte' }))
    fireEvent.click(screen.getByText('Déconnexion'))

    expect(logoutMock).toHaveBeenCalledTimes(1)
  })

  it('ne rend rien quand personne n\'est authentifié', () => {
    useAuthMock.mockReturnValue({ user: null, isLoading: false, isAuthenticated: false, logout: logoutMock })

    const { container } = renderHeader()

    expect(container).toBeEmptyDOMElement()
  })
})
