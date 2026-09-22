import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { LoginPage } from '@/pages/auth/LoginPage'

afterEach(cleanup)

const { signInWithPasswordMock } = vi.hoisted(() => ({ signInWithPasswordMock: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ supabase: { auth: { signInWithPassword: signInWithPasswordMock } } }))

beforeEach(() => signInWithPasswordMock.mockReset())

function renderPage() {
  const router = createMemoryRouter(
    [
      { path: '/connexion', element: <LoginPage /> },
      { path: '/aujourdhui', element: <p>Page Aujourd'hui</p> },
    ],
    { initialEntries: ['/connexion'] },
  )
  return render(<RouterProvider router={router} />)
}

async function fillAndSubmit(email: string, password: string) {
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: email } })
  fireEvent.change(screen.getByLabelText('Mot de passe'), { target: { value: password } })
  fireEvent.click(screen.getByRole('button', { name: 'Se connecter' }))
}

describe('LoginPage', () => {
  it('connexion réussie : redirige vers /aujourdhui', async () => {
    signInWithPasswordMock.mockResolvedValue({ error: null })
    renderPage()

    await fillAndSubmit('sophie@example.com', 'motdepasse123')

    expect(signInWithPasswordMock).toHaveBeenCalledWith({ email: 'sophie@example.com', password: 'motdepasse123' })
    await waitFor(() => expect(screen.getByText("Page Aujourd'hui")).toBeInTheDocument())
  })

  it('identifiants invalides : affiche un message clair', async () => {
    signInWithPasswordMock.mockResolvedValue({ error: { message: 'Invalid login credentials' } })
    renderPage()

    await fillAndSubmit('sophie@example.com', 'mauvaispass')

    expect(await screen.findByRole('alert')).toHaveTextContent('Email ou mot de passe incorrect.')
  })

  it('champs vides : validation locale sans appeler Supabase', () => {
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: 'Se connecter' }))

    expect(screen.getByText("L'email est obligatoire.")).toBeInTheDocument()
    expect(signInWithPasswordMock).not.toHaveBeenCalled()
  })
})
