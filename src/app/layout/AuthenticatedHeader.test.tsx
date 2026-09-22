import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { AuthenticatedHeader } from '@/app/layout/AuthenticatedHeader'

afterEach(cleanup)

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
})
