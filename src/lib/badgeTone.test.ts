import { describe, expect, it } from 'vitest'
import { toneClass } from '@/lib/badgeTone'

describe('toneClass', () => {
  it('maps each semantic tone to its exact Tailwind classes', () => {
    expect(toneClass('muted')).toBe('bg-muted text-muted-foreground')
    expect(toneClass('success')).toBe('bg-success-bg text-success')
    expect(toneClass('warning')).toBe('bg-warning-bg text-warning')
    expect(toneClass('risk')).toBe('bg-risk-bg text-risk')
  })
})
