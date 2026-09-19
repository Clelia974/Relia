import { describe, expect, it } from 'vitest'
import { formatShortDate } from '@/lib/dateFormat'

describe('formatShortDate', () => {
  it('formats a Date instance as "d MMM yyyy" in French', () => {
    expect(formatShortDate(new Date(2027, 5, 12))).toBe('12 juin 2027')
  })

  it('formats an ISO string the same way as the equivalent Date instance', () => {
    const date = new Date(2027, 0, 3)
    expect(formatShortDate(date.toISOString())).toBe(formatShortDate(date))
  })
})
