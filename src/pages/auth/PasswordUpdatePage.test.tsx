import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { PasswordUpdatePage } from '@/pages/auth/PasswordUpdatePage'

afterEach(cleanup)

const { getSessionMock, updateUserMock } = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
  updateUserMock: vi.fn(),
}))
vi.mock('@/lib/supabase', () => ({ supabase: { auth: { getSession: getSessionMock, updateUser: updateUserMock } } }))

beforeEach(() => {
  getSessionMock.mockReset()
  updateUserMock.mockReset()
})

function renderPage() {
  const router = createMemoryRouter(
    [
      { path: '/nouveau-mot-de-passe', element: <PasswordUpdatePage /> },
      { path: '/connexion', element: <p>Page connexion</p> },
    ],
    { initialEntries: ['/nouveau-mot-de-passe'] },
  )
  return render(<RouterProvider router={router} />)
}

describe('PasswordUpdatePage', () => {
  it('sans session de récupération valide : propose de redemander un lien', async () => {
    getSessionMock.mockResolvedValue({ data: { session: null } })
    renderPage()

    expect(await screen.findByText('Lien invalide ou expiré')).toBeInTheDocument()
  })

  it('avec une session valide : met à jour le mot de passe et redirige vers /connexion', async () => {
    getSessionMock.mockResolvedValue({ data: { session: { user: { id: 'u1' } } } })
    updateUserMock.mockResolvedValue({ error: null })
    renderPage()

    await screen.findByLabelText('Nouveau mot de passe')
    fireEvent.change(screen.getByLabelText('Nouveau mot de passe'), { target: { value: 'nouveaupass123' } })
    fireEvent.change(screen.getByLabelText('Confirmer'), { target: { value: 'nouveaupass123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Mettre à jour' }))

    expect(updateUserMock).toHaveBeenCalledWith({ password: 'nouveaupass123' })
    await waitFor(() => expect(screen.getByText('Page connexion')).toBeInTheDocument())
  })
})
