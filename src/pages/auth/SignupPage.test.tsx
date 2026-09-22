import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { SignupPage } from '@/pages/auth/SignupPage'

afterEach(cleanup)

const { signUpMock } = vi.hoisted(() => ({ signUpMock: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ supabase: { auth: { signUp: signUpMock } } }))

beforeEach(() => signUpMock.mockReset())

function renderPage() {
  const router = createMemoryRouter([{ path: '/inscription', element: <SignupPage /> }], {
    initialEntries: ['/inscription'],
  })
  return render(<RouterProvider router={router} />)
}

describe('SignupPage', () => {
  it('inscription réussie : affiche la confirmation avec l’email saisi', async () => {
    signUpMock.mockResolvedValue({ error: null })
    renderPage()

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'sophie@example.com' } })
    fireEvent.change(screen.getByLabelText('Mot de passe'), { target: { value: 'motdepasse123' } })
    fireEvent.change(screen.getByLabelText('Confirmer le mot de passe'), { target: { value: 'motdepasse123' } })
    fireEvent.click(screen.getByRole('button', { name: "S'inscrire" }))

    expect(await screen.findByText('Vérifiez votre email')).toBeInTheDocument()
    expect(screen.getByText('sophie@example.com')).toBeInTheDocument()
    expect(signUpMock).toHaveBeenCalledWith({
      email: 'sophie@example.com',
      password: 'motdepasse123',
      options: { emailRedirectTo: expect.stringContaining('/aujourdhui') },
    })
  })

  it('mots de passe différents : bloque avant tout appel réseau', () => {
    renderPage()

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'sophie@example.com' } })
    fireEvent.change(screen.getByLabelText('Mot de passe'), { target: { value: 'motdepasse123' } })
    fireEvent.change(screen.getByLabelText('Confirmer le mot de passe'), { target: { value: 'autrepass456' } })
    fireEvent.click(screen.getByRole('button', { name: "S'inscrire" }))

    expect(screen.getByText('Les mots de passe ne correspondent pas.')).toBeInTheDocument()
    expect(signUpMock).not.toHaveBeenCalled()
  })

  it('mot de passe trop court : rejeté avant tout appel réseau', () => {
    renderPage()

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'sophie@example.com' } })
    fireEvent.change(screen.getByLabelText('Mot de passe'), { target: { value: 'court' } })
    fireEvent.change(screen.getByLabelText('Confirmer le mot de passe'), { target: { value: 'court' } })
    fireEvent.click(screen.getByRole('button', { name: "S'inscrire" }))

    expect(screen.getByText('Le mot de passe doit contenir au moins 8 caractères.')).toBeInTheDocument()
    expect(signUpMock).not.toHaveBeenCalled()
  })
})
