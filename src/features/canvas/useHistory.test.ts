import { describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useHistory } from '@/features/canvas/useHistory'
import type { MoodboardItem } from '@/types/entities'

const item = (x: number): MoodboardItem => ({ id: 'a', kind: 'texte', x, y: 0, w: 100, h: 50, rotation: 0, z: 1 })

describe('useHistory', () => {
  it('aperçu sans enregistrement, puis une seule étape par geste', () => {
    const persist = vi.fn()
    const { result } = renderHook(() => useHistory([item(0)], persist))
    act(() => result.current.preview([item(5)]))
    act(() => result.current.preview([item(10)]))
    expect(persist).not.toHaveBeenCalled()
    act(() => result.current.commit([item(10)]))
    expect(persist).toHaveBeenCalledTimes(1)

    act(() => result.current.undo())
    expect(result.current.value[0].x).toBe(0)
    expect(result.current.canRedo).toBe(true)
    act(() => result.current.redo())
    expect(result.current.value[0].x).toBe(10)
  })

  it('un geste sans effet ne crée pas d’étape d’annulation', () => {
    const { result } = renderHook(() => useHistory([item(0)], vi.fn()))
    act(() => result.current.commit([item(0)]))
    expect(result.current.canUndo).toBe(false)
  })

  it('regroupe les modifications rapprochées du même réglage', () => {
    const { result } = renderHook(() => useHistory([item(0)], vi.fn()))
    act(() => result.current.commit([item(1)], 'nudge:a'))
    act(() => result.current.commit([item(2)], 'nudge:a'))
    act(() => result.current.undo())
    expect(result.current.value[0].x).toBe(0)
    expect(result.current.canUndo).toBe(false)
  })
})
