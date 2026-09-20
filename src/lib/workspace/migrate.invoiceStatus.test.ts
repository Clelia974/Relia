import { CURRENT_SCHEMA_VERSION } from '@/schemas/workspace'
import { describe, expect, it } from 'vitest'
import { migrateWorkspace } from '@/lib/workspace/migrate'
import { createEmptyWorkspace } from '@/lib/workspace/factories'

/**
 * Migration v9 -> v10 (Phase 2b) : ajoute Invoice.status et
 * Invoice.finalizedAt. Purement additif — une facture existante (créée
 * avant ce champ) est relue comme 'brouillon', jamais verrouillée
 * rétroactivement.
 */
describe('migration v9 -> v10 (statut de facture)', () => {
  function buildV9Workspace() {
    const base = createEmptyWorkspace()
    return { ...base, schemaVersion: 9 }
  }

  function baseInvoice(overrides: Record<string, unknown> = {}) {
    return {
      id: 'inv1',
      weddingId: 'w1',
      invoiceNumber: 'FACT-1',
      date: '2026-06-06T00:00:00.000Z',
      clientName: 'Test',
      lineItems: [],
      subtotal: 0,
      vatMode: 'franchise_en_base',
      taxAmount: 0,
      total: 0,
      isIndicativePreview: true,
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
      ...overrides,
    }
  }

  it('fait passer schemaVersion à 10', () => {
    const v9 = buildV9Workspace()
    const result = migrateWorkspace(v9)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.workspace.schemaVersion).toBe(CURRENT_SCHEMA_VERSION)
  })

  it('une facture existante sans status est relue comme "brouillon", jamais verrouillée', () => {
    const v9 = buildV9Workspace()
    const withInvoice = {
      ...v9,
      weddings: [
        {
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
        },
      ],
      invoices: [baseInvoice()],
    }

    const result = migrateWorkspace(withInvoice)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.workspace.invoices).toHaveLength(1)
    expect(result.workspace.invoices[0].status).toBe('brouillon')
    expect(result.workspace.invoices[0].finalizedAt).toBeUndefined()
  })

  it('finalizedAt reste facultatif et accepte une facture déjà marquée "finalisee"', () => {
    const v9 = buildV9Workspace()
    const withInvoice = {
      ...v9,
      weddings: [
        {
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
        },
      ],
      invoices: [baseInvoice({ status: 'finalisee', finalizedAt: '2026-06-07T00:00:00.000Z' })],
    }

    const result = migrateWorkspace(withInvoice)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.workspace.invoices[0].status).toBe('finalisee')
    expect(result.workspace.invoices[0].finalizedAt).toBe('2026-06-07T00:00:00.000Z')
  })
})
