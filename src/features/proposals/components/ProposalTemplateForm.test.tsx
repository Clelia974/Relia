import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { ProposalTemplateForm } from '@/features/proposals/components/ProposalTemplateForm'
import type { ProposalTemplate } from '@/types/entities'

afterEach(cleanup)

const template = (overrides: Partial<ProposalTemplate> = {}): ProposalTemplate => ({
  tier: 'gold',
  label: 'Gold',
  showOnDocuments: true,
  lines: [{ id: 'l1', description: 'Décoration', category: 'Décoration', quantity: 1, unitPrice: 500, included: true, optional: false }],
  ...overrides,
})

function setup(t: ProposalTemplate) {
  const onSubmit = vi.fn()
  render(<ProposalTemplateForm template={t} onSubmit={onSubmit} onCancel={vi.fn()} />)
  return onSubmit
}

describe('ProposalTemplateForm — nom de la formule', () => {
  it("propose de renommer la formule et l'affiche par défaut sur les devis", () => {
    setup(template())
    expect((screen.getByLabelText('Nom de la formule') as HTMLInputElement).value).toBe('Gold')
    expect(screen.getByRole('checkbox', { name: /Afficher le nom de la formule sur les devis/ }).getAttribute('aria-checked')).toBe('true')
  })

  it('enregistre le nouveau nom saisi', () => {
    const onSubmit = setup(template())
    fireEvent.change(screen.getByLabelText('Nom de la formule'), { target: { value: 'Signature' } })
    fireEvent.submit(screen.getByLabelText('Nom de la formule').closest('form')!)
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ label: 'Signature', showOnDocuments: true }))
  })

  it('permet de masquer le nom sur les devis', () => {
    const onSubmit = setup(template())
    fireEvent.click(screen.getByRole('checkbox', { name: /Afficher le nom de la formule sur les devis/ }))
    fireEvent.submit(screen.getByLabelText('Nom de la formule').closest('form')!)
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ showOnDocuments: false }))
  })

  it('un ancien réglage sans la propriété est traité comme "affiché"', () => {
    const legacy = { ...template(), showOnDocuments: undefined } as unknown as ProposalTemplate
    setup(legacy)
    expect(screen.getByRole('checkbox', { name: /Afficher le nom de la formule sur les devis/ }).getAttribute('aria-checked')).toBe('true')
  })
})
