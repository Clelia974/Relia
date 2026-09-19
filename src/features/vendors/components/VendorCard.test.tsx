import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { VendorCard } from '@/features/vendors/components/VendorCard'
import type { Vendor } from '@/types/entities'

afterEach(cleanup)

const vendor: Vendor = {
  id: 'v1',
  name: 'Fleuriste Test',
  category: 'Fleuriste',
  status: 'a_contacter',
  weddingIds: ['w1', 'w2'],
}

const noop = vi.fn()

describe('VendorCard — badge "Coût à vérifier"', () => {
  it('5. affiche le badge quand costForThisWedding.needsCostReview est true', () => {
    render(
      <TooltipProvider>
        <VendorCard
          vendor={vendor}
          weddingDate="2026-06-06T00:00:00.000Z"
          costForThisWedding={{ estimatedCost: 1000, needsCostReview: true }}
          onEdit={noop}
          onDelete={noop}
          onMarkConfirmed={noop}
        />
      </TooltipProvider>,
    )
    expect(screen.getByText('Coût à vérifier')).toBeTruthy()
    expect(screen.getByText(/repris automatiquement lors de la migration/i)).toBeTruthy()
  })

  it("n'affiche pas le badge quand needsCostReview est absent", () => {
    render(
      <TooltipProvider>
        <VendorCard
          vendor={vendor}
          weddingDate="2026-06-06T00:00:00.000Z"
          costForThisWedding={{ estimatedCost: 1000 }}
          onEdit={noop}
          onDelete={noop}
          onMarkConfirmed={noop}
        />
      </TooltipProvider>,
    )
    expect(screen.queryByText('Coût à vérifier')).toBeNull()
  })

  it("n'affiche pas le badge quand aucun coût n'est renseigné pour ce mariage", () => {
    render(
      <TooltipProvider>
        <VendorCard
          vendor={vendor}
          weddingDate="2026-06-06T00:00:00.000Z"
          onEdit={noop}
          onDelete={noop}
          onMarkConfirmed={noop}
        />
      </TooltipProvider>,
    )
    expect(screen.queryByText('Coût à vérifier')).toBeNull()
  })
})
