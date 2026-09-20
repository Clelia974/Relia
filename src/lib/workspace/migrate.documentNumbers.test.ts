import { describe, expect, it } from 'vitest'
import { createEmptyWorkspace } from '@/lib/workspace/factories'
import { migrateWorkspace } from '@/lib/workspace/migrate'

/** Migration v11 -> v12 : numérotation automatique des devis et des factures. */
describe('migration v11 -> v12 (numéros de devis et de facture)', () => {
  const wedding = {
    id: 'w1',
    coupleName: 'Test',
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

  const proposal = (id: string, createdAt: string) => ({
    id,
    weddingId: 'w1',
    template: 'gold',
    title: `Devis ${id}`,
    clientName: '',
    lineItems: [],
    subtotal: 0,
    vatMode: 'franchise_en_base',
    taxAmount: 0,
    total: 0,
    depositAmount: 0,
    balanceAmount: 0,
    status: 'brouillon',
    createdAt,
    updatedAt: createdAt,
  })

  const invoice = (id: string, invoiceNumber: string, date: string) => ({
    id,
    weddingId: 'w1',
    invoiceNumber,
    date,
    clientName: '',
    lineItems: [],
    subtotal: 0,
    vatMode: 'franchise_en_base',
    taxAmount: 0,
    total: 0,
    isIndicativePreview: true,
    status: 'brouillon',
    createdAt: date,
    updatedAt: date,
  })

  function v11(proposals: unknown[], invoices: unknown[]) {
    return { ...createEmptyWorkspace(), schemaVersion: 11, weddings: [wedding], proposals, invoices, documentCounters: undefined }
  }

  it('numérote les devis existants dans l\'ordre de création, par année, sans changer l\'ordre du tableau', () => {
    const result = migrateWorkspace(
      v11(
        [proposal('b', '2026-03-01T00:00:00.000Z'), proposal('a', '2026-01-01T00:00:00.000Z'), proposal('c', '2025-12-31T00:00:00.000Z')],
        [],
      ),
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.workspace.schemaVersion).toBe(12)
    expect(result.workspace.proposals.map((p) => [p.id, p.proposalNumber])).toEqual([
      ['b', 'DEV-2026-0002'],
      ['a', 'DEV-2026-0001'],
      ['c', 'DEV-2025-0001'],
    ])
  })

  it('ne renumérote jamais une facture existante', () => {
    const result = migrateWorkspace(v11([], [invoice('i1', 'FACT-20260101-1', '2026-01-01T00:00:00.000Z'), invoice('i2', 'MON-NUMERO', '2026-02-01T00:00:00.000Z')]))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.workspace.invoices.map((i) => i.invoiceNumber)).toEqual(['FACT-20260101-1', 'MON-NUMERO'])
  })

  it('initialise les compteurs pour que la suite continue après les documents existants', () => {
    const result = migrateWorkspace(
      v11([proposal('a', '2026-01-01T00:00:00.000Z'), proposal('b', '2026-02-01T00:00:00.000Z')], [invoice('i1', 'X', '2026-01-01T00:00:00.000Z')]),
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.workspace.documentCounters).toEqual({ 'devis:2026': 2, 'facture:2026': 1 })
  })

  it('un espace sans devis ni facture reçoit des compteurs vides', () => {
    const result = migrateWorkspace(v11([], []))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.workspace.documentCounters).toEqual({})
  })
})
