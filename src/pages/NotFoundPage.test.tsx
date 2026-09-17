import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { NotFoundPage } from '@/pages/NotFoundPage'

afterEach(cleanup)

describe('NotFoundPage', () => {
  it('affiche un message 404 en français', () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    )
    expect(screen.getByText('404 — Page non trouvée.')).toBeInTheDocument()
  })

  it("le lien retour navigue vers /aujourdhui", () => {
    render(
      <MemoryRouter initialEntries={['/une-url-inconnue']}>
        <Routes>
          <Route path="/aujourdhui" element={<p>Page d'accueil</p>} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('link', { name: "Revenir à l'accueil" }))

    expect(screen.getByText("Page d'accueil")).toBeInTheDocument()
  })
})
