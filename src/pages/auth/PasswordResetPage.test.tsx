import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { PasswordResetPage } from '@/pages/auth/PasswordResetPage'

afterEach(cleanup)

const { resetPasswordForEmailMock } = vi.hoisted(() => ({ resetPasswordForEmailMock: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ supabase: { auth: { resetPasswordForEmail: resetPasswordForEmailMock } } }))

beforeEach(() => resetPasswordForEmailMock.mockReset())

function renderPage() {
  const router = createMemoryRouter([{ path: '/mot-de-passe-oublie', element: <PasswordResetPage /> }], {
    initialEntries: ['/mot-de-passe-oublie'],
  })
  return render(<RouterProvider router={router} />)
}

describe('PasswordResetPage', () => {
  it('email valide : envoie le lien et affiche la confirmation', async () => {
    resetPasswordForEmailMock.mockResolvedValue({ error: null })
    renderPage()

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'sophie@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer le lien' }))

    expect(await screen.findByText('Email envoyé')).toBeInTheDocument()
    expect(resetPasswordForEmailMock).toHaveBeenCalledWith(
      'sophie@example.com',
      expect.objectContaining({ redirectTo: expect.stringContaining('/nouveau-mot-de-passe') }),
    )
  })

  it('email invalide : bloque avant tout appel réseau', () => {
    renderPage()

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'pas-un-email' } })
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer le lien' }))

    expect(screen.getByText('Adresse email invalide.')).toBeInTheDocument()
    expect(resetPasswordForEmailMock).not.toHaveBeenCalled()
  })
})
