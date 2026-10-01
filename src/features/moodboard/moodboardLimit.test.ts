import { describe, expect, it } from 'vitest'
import {
  canCreateMoodboard,
  countWeddingImages,
  GRATUIT_IMAGES_PER_WEDDING,
  remainingImageSlots,
} from '@/features/moodboard/moodboardLimit'
import type { Moodboard, MoodboardItem } from '@/types/entities'

const item = (kind: MoodboardItem['kind'], id: string): MoodboardItem => ({ id, kind, x: 0, y: 0, w: 10, h: 10, rotation: 0, z: 0 })
const board = (id: string, weddingId: string, items: MoodboardItem[]): Moodboard => ({
  id,
  weddingId,
  title: id,
  items,
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
})

describe('moodboardLimit', () => {
  it('Gratuit : un seul moodboard par mariage', () => {
    expect(canCreateMoodboard('expired', 0)).toBe(true)
    expect(canCreateMoodboard('expired', 1)).toBe(false)
    expect(canCreateMoodboard('cancelled', 1)).toBe(false)
  })

  it('essai, grâce, Solo actif ou statut inconnu : illimité', () => {
    for (const status of ['trial', 'grace', 'active', undefined] as const) {
      expect(canCreateMoodboard(status, 5)).toBe(true)
      expect(remainingImageSlots(status, 100)).toBe(Infinity)
    }
  })

  it('ne compte que les images du mariage, tous moodboards confondus', () => {
    const boards = [
      board('a', 'w1', [item('image', '1'), item('texte', '2'), item('image', '3')]),
      board('b', 'w1', [item('image', '4')]),
      board('c', 'w2', [item('image', '5')]),
    ]
    expect(countWeddingImages(boards, 'w1')).toBe(3)
  })

  it('places restantes en Gratuit, jamais négatives', () => {
    expect(remainingImageSlots('expired', 10)).toBe(GRATUIT_IMAGES_PER_WEDDING - 10)
    expect(remainingImageSlots('expired', 40)).toBe(0)
  })
})
