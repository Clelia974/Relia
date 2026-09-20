import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { FinancesGlobalPage } from '@/pages/FinancesGlobalPage'
import { createEmptyWorkspace } from '@/lib/workspace/factories'
import { useWorkspaceStore } from '@/store/workspaceStore'

afterEach(cleanup)

const currency = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
/** Neutralise les variantes d'espace insécable produites par Intl selon l'environnement ICU. */
const normalizeSpaces = (s: string) => s.replace(/[\s  ]+/g, ' ').trim()

/**
 * Les sections "Budget du mariage" et "Rentabilité de l'entreprise" sont
 * volontairement séparées et peuvent afficher le même montant formaté (ex.
 * clientBudget === soldAmount dans les fixtures ci-dessous) — toujours
 * scoper la recherche à la section "Rentabilité" que ces tests vérifient.
 */
function expectAmount(amount: number) {
  const region = screen.getByRole('region', { name: "Rentabilité de l'entreprise" })
  const expected = normalizeSpaces(currency.format(amount))
  expect(
    within(region).getByText((_, el) => el?.tagName === 'P' && normalizeSpaces(el.textContent ?? '') === expected),
  ).toBeInTheDocument()
}

beforeEach(() => {
  useWorkspaceStore.setState({ workspace: createEmptyWorkspace() })
})

function seedWedding(coupleName: string, soldAmount: number) {
  return useWorkspaceStore.getState().createWedding({
    coupleName,
    date: '2026-06-06T00:00:00.000Z',
    venue: '',
    soldAmount,
    clientBudget: soldAmount,
    status: 'signe',
  })
}

function seedVendorCost(weddingId: string, estimatedCost: number) {
  useWorkspaceStore.getState().addVendor({
    name: 'Prestataire',
    category: 'Autre',
    weddingIds: [weddingId],
    estimatedCost,
  })
}

describe('FinancesGlobalPage — totaux agrégés excluent les mariages à données incomplètes', () => {
  it('exclut des totaux un mariage sans coût renseigné (mix de 2 complets + 1 incomplet)', () => {
    const wA = seedWedding('Mariage A', 5000)
    seedVendorCost(wA, 2000)
    const wB = seedWedding('Mariage B', 4000)
    seedVendorCost(wB, 1500)
    seedWedding('Mariage C (incomplet)', 3000) // aucun coût renseigné

    render(
      <MemoryRouter>
        <FinancesGlobalPage />
      </MemoryRouter>,
    )

    // Coûts totaux attendus : 2000 + 1500 = 3500, sans le mariage incomplet.
    expectAmount(3500)
    // Profit prévisionnel attendu : (5000-2000) + (4000-1500) = 5500.
    expectAmount(5500)
    // Chiffre d'affaires attendu : 5000 + 4000 = 9000, sans le mariage incomplet.
    expectAmount(9000)
  })

  it('affiche un décompte des mariages non comptabilisés', () => {
    const wA = seedWedding('Mariage A', 5000)
    seedVendorCost(wA, 2000)
    seedWedding('Mariage B (incomplet)', 3000)

    render(
      <MemoryRouter>
        <FinancesGlobalPage />
      </MemoryRouter>,
    )

    expect(screen.getByText(/1 mariage à données incomplètes/)).toBeInTheDocument()
  })

  it("n'affiche aucun décompte quand tous les mariages sont complets", () => {
    const wA = seedWedding('Mariage A', 5000)
    seedVendorCost(wA, 2000)

    render(
      <MemoryRouter>
        <FinancesGlobalPage />
      </MemoryRouter>,
    )

    expect(screen.queryByText(/données incomplètes/)).not.toBeInTheDocument()
  })

  it('le mariage incomplet reste visible dans la liste, avec "—" au lieu de chiffres inventés', () => {
    seedWedding('Mariage Incomplet', 3000)

    render(
      <MemoryRouter>
        <FinancesGlobalPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('Mariage Incomplet')).toBeInTheDocument()
    expect(screen.getByText('Données incomplètes')).toBeInTheDocument()
  })
})
