import { describe, expect, it } from 'vitest'
import { currency, currencyAbsolute } from '@/lib/currency'

describe('currency', () => {
  it('formats EUR with no decimals, fr-FR style', () => {
    expect(currency.format(1234)).toBe('1 234 €')
  })

  it('keeps the sign for negative amounts', () => {
    expect(currency.format(-500)).toBe('-500 €')
  })
})

describe('currencyAbsolute', () => {
  it('formats EUR with no decimals and no sign', () => {
    expect(currencyAbsolute.format(1234)).toBe('1 234 €')
  })

  it('never shows a minus sign for negative amounts', () => {
    expect(currencyAbsolute.format(-500)).toBe('500 €')
  })
})
