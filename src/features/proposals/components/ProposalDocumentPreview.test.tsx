import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { computeProposalTotals } from '@/features/proposals/calculations'
import { ProposalDocumentPreview } from '@/features/proposals/components/ProposalDocumentPreview'
import { createEmptyWorkspace } from '@/lib/workspace/factories'
import type { Wedding } from '@/types/entities'

afterEach(cleanup)

const wedding: Wedding = {
  id: 'w1',
  coupleName: 'Alice & Bob',
  date: '2026-06-06T00:00:00.000Z',
  venue: '',
  soldAmount: 0,
  clientBudget: 0,
  status: 'signe',
  archived: false,
  vendorIds: [],
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
}

function renderPreview(templateLabel?: string) {
  const { businessConfig } = createEmptyWorkspace()
  render(
    <ProposalDocumentPreview
      businessConfig={businessConfig}
      wedding={wedding}
      title="Ma proposition"
      proposalNumber="DEV-2026-0001"
      templateLabel={templateLabel}
      clientName="Alice & Bob"
      lineItems={[]}
      totals={computeProposalTotals([], 'franchise_en_base', undefined, undefined)}
      vatMode="franchise_en_base"
    />,
  )
}

describe('ProposalDocumentPreview — nom de la formule', () => {
  it('affiche le numéro et le nom de la formule quand il est fourni', () => {
    renderPreview('Gold')
    expect(screen.getByText(/Proposition n° DEV-2026-0001\s*— Gold/)).toBeTruthy()
  })

  it("n'affiche que le numéro quand le nom de la formule est masqué", () => {
    renderPreview(undefined)
    const heading = screen.getByText(/Proposition n° DEV-2026-0001/)
    expect(heading.textContent).not.toContain('—')
    expect(screen.queryByText(/Gold/)).toBeNull()
  })
})
