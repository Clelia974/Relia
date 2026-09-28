import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { ContratPartagePage } from '@/pages/ContratPartagePage'

afterEach(cleanup)

const useContratPartageMock = vi.hoisted(() => vi.fn())
vi.mock('@/features/contracts/useContratPartage', () => ({ useContratPartage: useContratPartageMock }))

function renderAt(path: string) {
  const router = createMemoryRouter([{ path: '/contrat/:shareId', element: <ContratPartagePage /> }], { initialEntries: [path] })
  return render(<RouterProvider router={router} />)
}

describe('ContratPartagePage — consultation publique d’un contrat partagé', () => {
  it('affiche un message de chargement pendant la récupération', () => {
    useContratPartageMock.mockReturnValue({ fileUrl: null, fileName: null, isLoading: true, error: null })
    renderAt('/contrat/share-1')

    expect(screen.getByText('Chargement du contrat…')).toBeInTheDocument()
  })

  it('affiche une erreur lisible si le lien est introuvable', () => {
    useContratPartageMock.mockReturnValue({
      fileUrl: null,
      fileName: null,
      isLoading: false,
      error: 'Ce contrat est introuvable — le lien est peut-être incorrect.',
    })
    renderAt('/contrat/inconnu')

    expect(screen.getByText('Ce contrat est introuvable — le lien est peut-être incorrect.')).toBeInTheDocument()
  })

  it('affiche le nom du fichier et un lien de téléchargement une fois chargé', () => {
    useContratPartageMock.mockReturnValue({
      fileUrl: 'https://example.supabase.co/storage/v1/object/public/contrats/u1/uuid-contrat.pdf',
      fileName: 'contrat.pdf',
      isLoading: false,
      error: null,
    })
    renderAt('/contrat/share-1')

    expect(screen.getByText('contrat.pdf')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Télécharger' })).toHaveAttribute(
      'href',
      'https://example.supabase.co/storage/v1/object/public/contrats/u1/uuid-contrat.pdf',
    )
  })
})
