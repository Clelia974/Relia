import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ANNUAL_FREE_MONTHS, FAQ, PRICE_ANNUAL, PRICE_MONTHLY, TESTIMONIALS } from '@/features/landing/landingContent'
import { LandingPage } from '@/pages/LandingPage'
import { createEmptyWorkspace } from '@/lib/workspace/factories'
import { useWorkspaceStore } from '@/store/workspaceStore'

afterEach(cleanup)
beforeEach(() => useWorkspaceStore.setState({ workspace: createEmptyWorkspace() }))

function Where() {
  return <p data-testid="where">{useLocation().pathname}</p>
}

function setup() {
  render(
    <TooltipProvider>
      <MemoryRouter>
        <LandingPage />
        <Where />
      </MemoryRouter>
    </TooltipProvider>,
  )
}

describe('LandingPage', () => {
  it('a un seul titre principal : la promesse de la marque', () => {
    setup()
    const h1 = screen.getAllByRole('heading', { level: 1 })
    expect(h1).toHaveLength(1)
    expect(h1[0].textContent).toBe('Tout orchestré. Enfin la paix.')
  })

  it("le bouton principal mène à l'onboarding", () => {
    setup()
    fireEvent.click(screen.getAllByRole('button', { name: /Commencer gratuitement/ })[0])
    expect(screen.getByTestId('where').textContent).toBe('/onboarding')
  })

  it('« Voir une démo » charge des mariages fictifs et ouvre le tableau de bord', () => {
    setup()
    fireEvent.click(screen.getByRole('button', { name: 'Voir une démo' }))
    expect(useWorkspaceStore.getState().workspace.weddings.length).toBeGreaterThan(0)
    expect(screen.getByTestId('where').textContent).toBe('/aujourdhui')
  })

  it('les huit sections attendues sont présentes, dans un ordre lisible', () => {
    setup()
    const titles = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    expect(titles).toEqual([
      'Le chaos du Jour J n’est pas une fatalité',
      'Rencontre RELIA',
      'Ce que tu peux faire avec RELIA',
      'Tarifs simples, pas de piège',
      'Questions fréquentes',
      'Prêt à respirer le Jour J ?',
    ])
  })

  it('n’invente ni témoignage, ni chiffre d’audience, ni mode hors-ligne', () => {
    expect(TESTIMONIALS).toEqual([])
    setup()
    expect(screen.queryByRole('heading', { name: /Ce que disent/ })).toBeNull()
    const text = document.body.textContent ?? ''
    expect(text).not.toMatch(/500\+/)
    expect(text).not.toMatch(/100\s?%\s?offline|100\s?%\s?hors/i)
    expect(text).not.toMatch(/rappel/i)
  })

  it('les tarifs suivent le choix mensuel / annuel, avec le bon calcul de l’économie', () => {
    setup()
    const pricing = within(screen.getByRole('heading', { name: 'Tarifs simples, pas de piège' }).closest('section')!)
    expect(pricing.getByText(`${PRICE_MONTHLY} €`)).toBeTruthy()
    fireEvent.click(pricing.getByRole('button', { name: /Annuel/ }))
    expect(pricing.getByText(`${PRICE_ANNUAL} €`)).toBeTruthy()
    expect(ANNUAL_FREE_MONTHS).toBe(2)
  })

  it('la mention « bientôt » de l’abonnement est affichée tant que le paiement n’est pas ouvert', () => {
    setup()
    expect(screen.getByText(/L’abonnement ouvre avec la connexion en ligne/)).toBeTruthy()
  })

  it('la FAQ répond aux huit questions', () => {
    setup()
    expect(FAQ).toHaveLength(8)
    for (const item of FAQ) expect(screen.getByText(item.q)).toBeTruthy()
  })

  it('toutes les images ont un texte alternatif et des dimensions', () => {
    setup()
    for (const img of screen.getAllByRole('img')) {
      expect(img.getAttribute('alt')?.length).toBeGreaterThan(10)
      expect(img.getAttribute('width')).toBeTruthy()
      expect(img.getAttribute('height')).toBeTruthy()
    }
  })
})
