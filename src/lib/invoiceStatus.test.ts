import { describe, expect, it } from 'vitest'
import { INVOICE_STATUS_OPTIONS, isInvoiceEditable, isInvoiceStatusLocked } from '@/lib/invoiceStatus'

describe('invoiceStatus (Phase 2b)', () => {
  it('brouillon est modifiable, finalisee ne l\'est jamais', () => {
    expect(isInvoiceEditable('brouillon')).toBe(true)
    expect(isInvoiceEditable('finalisee')).toBe(false)
  })

  it('finalisee est verrouillée pour toujours, brouillon ne l\'est jamais', () => {
    expect(isInvoiceStatusLocked('finalisee')).toBe(true)
    expect(isInvoiceStatusLocked('brouillon')).toBe(false)
  })

  it('INVOICE_STATUS_OPTIONS contient exactement brouillon et finalisee', () => {
    expect(INVOICE_STATUS_OPTIONS).toEqual(['brouillon', 'finalisee'])
  })
})
