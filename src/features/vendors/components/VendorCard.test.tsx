import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { VendorCard } from '@/features/vendors/components/VendorCard'
import type { VendorAssignment } from '@/features/vendors/assignments'
import type { Vendor, VendorWeddingLink } from '@/types/entities'

afterEach(cleanup)

const vendor: Vendor = {
  id: 'v1',
  name: 'Fleuriste Test',
  category: 'Fleuriste',
  weddingIds: ['w1', 'w2'],
}

const noop = vi.fn()

function renderCard(link: Partial<VendorWeddingLink> = {}) {
  const assignment: VendorAssignment = {
    vendor,
    link: { id: 'l1', vendorId: 'v1', weddingId: 'w1', status: 'a_contacter', ...link },
  }
  render(
    <TooltipProvider>
      <VendorCard
        assignment={assignment}
        weddingDate="2026-06-06T00:00:00.000Z"
        onViewProfile={noop}
        onEditAssignment={noop}
        onDelete={noop}
        onMarkConfirmed={noop}
      />
    </TooltipProvider>,
  )
}

describe('VendorCard — badge "Coût à vérifier"', () => {
  it('5. affiche le badge quand le lien a needsCostReview à true', () => {
    renderCard({ estimatedCost: 1000, needsCostReview: true })
    expect(screen.getByText('Coût à vérifier')).toBeTruthy()
    expect(screen.getByText(/repris automatiquement lors de la migration/i)).toBeTruthy()
  })

  it("n'affiche pas le badge quand needsCostReview est absent", () => {
    renderCard({ estimatedCost: 1000 })
    expect(screen.queryByText('Coût à vérifier')).toBeNull()
  })

  it("n'affiche pas le badge quand aucun coût n'est renseigné pour ce mariage", () => {
    renderCard()
    expect(screen.queryByText('Coût à vérifier')).toBeNull()
  })
})

describe('VendorCard — données propres à l\'affectation', () => {
  it('affiche le statut, l\'horaire et les notes de CE mariage', () => {
    renderCard({ status: 'confirme', arrivalTime: '14:30', notes: 'Accès par la cour' })
    expect(screen.getByText('Confirmé')).toBeTruthy()
    expect(screen.getByText('14:30')).toBeTruthy()
    expect(screen.getByText('Accès par la cour')).toBeTruthy()
  })
})
