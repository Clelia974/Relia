import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { PaymentPage } from '@/pages/PaymentPage'

afterEach(cleanup)

const useSubscriptionCheckMock = vi.hoisted(() => vi.fn())
const useStripeCheckoutMock = vi.hoisted(() => vi.fn())
vi.mock('@/features/payment/useSubscriptionCheck', () => ({ useSubscriptionCheck: useSubscriptionCheckMock }))
vi.mock('@/features/payment/useStripeCheckout', () => ({ useStripeCheckout: useStripeCheckoutMock }))

const createCheckoutSessionMock = vi.fn()

beforeEach(() => {
  createCheckoutSessionMock.mockReset()
  useStripeCheckoutMock.mockReturnValue({ createCheckoutSession: createCheckoutSessionMock, isLoading: false, error: null })
})

function renderPage(initialPath = '/paiement') {
  const router = createMemoryRouter([{ path: '/paiement', element: <PaymentPage /> }], { initialEntries: [initialPath] })
  return render(<RouterProvider router={router} />)
}

describe('PaymentPage', () => {
  it('essai en cours : affiche le badge, le nombre de jours restants et le CTA Pro', () => {
    useSubscriptionCheckMock.mockReturnValue({ status: 'trial', hasAccess: true, daysLeftInTrial: 5, isLoading: false })

    renderPage()

    expect(screen.getByText('Essai Pro en cours')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Passer au Pro' })).toBeInTheDocument()
  })

  it('essai expiré (zéro blocage) : badge Gratuit, message informatif, CTA Pro toujours proposé', () => {
    useSubscriptionCheckMock.mockReturnValue({ status: 'expired', hasAccess: false, daysLeftInTrial: 0, isLoading: false })

    renderPage()

    expect(screen.getByText('Version Gratuite')).toBeInTheDocument()
    expect(screen.getByText(/vous restez sur la version Gratuite/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Passer au Pro' })).toBeInTheDocument()
  })

  it('abonnement actif : pas de carte "Passer au Pro"', () => {
    useSubscriptionCheckMock.mockReturnValue({ status: 'active', hasAccess: true, daysLeftInTrial: null, isLoading: false })

    renderPage()

    expect(screen.getByText('Pro actif')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Passer au Pro' })).not.toBeInTheDocument()
  })

  it('clic sur "Passer au Pro" appelle createCheckoutSession avec le prix mensuel par défaut', () => {
    useSubscriptionCheckMock.mockReturnValue({ status: 'trial', hasAccess: true, daysLeftInTrial: 10, isLoading: false })

    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Passer au Pro' }))

    expect(createCheckoutSessionMock).toHaveBeenCalledWith(import.meta.env.VITE_STRIPE_PRICE_SOLO_MONTHLY)
  })

  it('bascule Annuel puis clic : appelle createCheckoutSession avec le prix annuel', () => {
    useSubscriptionCheckMock.mockReturnValue({ status: 'trial', hasAccess: true, daysLeftInTrial: 10, isLoading: false })

    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /Annuel/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Passer au Pro' }))

    expect(createCheckoutSessionMock).toHaveBeenCalledWith(import.meta.env.VITE_STRIPE_PRICE_SOLO_YEARLY)
  })

  it('paramètre ?paiement=annule affiche une notification puis nettoie l’URL', () => {
    useSubscriptionCheckMock.mockReturnValue({ status: 'trial', hasAccess: true, daysLeftInTrial: 10, isLoading: false })

    renderPage('/paiement?paiement=annule')

    expect(screen.queryByText('paiement=annule')).not.toBeInTheDocument()
  })
})
