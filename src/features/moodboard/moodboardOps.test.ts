import { describe, expect, it } from 'vitest'
import { createEmptyWorkspace } from '@/lib/workspace/factories'
import {
  createMoodboard,
  deleteMoodboard,
  duplicateMoodboard,
  orphanImagePaths,
  renameMoodboard,
  setMoodboardItems,
  updateWeddingDesign,
} from '@/features/moodboard/moodboardOps'
import type { MoodboardItem, Workspace } from '@/types/entities'

const T = '2026-10-01T00:00:00.000Z'
const T2 = '2026-10-02T00:00:00.000Z'

function workspaceWithWedding(): Workspace {
  const ws = createEmptyWorkspace()
  return {
    ...ws,
    weddings: [
      {
        id: 'w1',
        coupleName: 'Camille & Antoine',
        date: T,
        venue: '',
        soldAmount: 0,
        clientBudget: 0,
        status: 'signe',
        archived: false,
        vendorIds: [],
        createdAt: T,
        updatedAt: T,
      },
    ],
  }
}

const image = (id: string, path: string): MoodboardItem => ({ id, kind: 'image', x: 0, y: 0, w: 100, h: 100, rotation: 0, z: 0, storagePath: path })

describe('moodboards', () => {
  it('crée, renomme et supprime un moodboard', () => {
    let ws = createMoodboard(workspaceWithWedding(), 'w1', 'Cérémonie', 'm1', T)
    expect(ws.moodboards).toHaveLength(1)
    ws = renameMoodboard(ws, 'm1', 'Réception', T2)
    expect(ws.moodboards[0]).toMatchObject({ title: 'Réception', updatedAt: T2 })
    ws = deleteMoodboard(ws, 'm1')
    expect(ws.moodboards).toEqual([])
  })

  it('duplique avec de nouveaux identifiants d’éléments, et « (copie) » dans le titre', () => {
    let ws = createMoodboard(workspaceWithWedding(), 'w1', 'Cérémonie', 'm1', T)
    ws = setMoodboardItems(ws, 'm1', [image('i1', 'u/w1/a.jpg')], T)
    let n = 0
    ws = duplicateMoodboard(ws, 'm1', 'm2', () => `copy-${++n}`, T2)
    const copy = ws.moodboards.find((b) => b.id === 'm2')!
    expect(copy.title).toBe('Cérémonie (copie)')
    expect(copy.items[0].id).toBe('copy-1')
    expect(copy.items[0].storagePath).toBe('u/w1/a.jpg')
  })

  it('ne considère une image orpheline que si plus aucun moodboard ne l’utilise', () => {
    let ws = createMoodboard(workspaceWithWedding(), 'w1', 'A', 'm1', T)
    ws = setMoodboardItems(ws, 'm1', [image('i1', 'u/w1/a.jpg'), image('i2', 'u/w1/b.jpg')], T)
    ws = duplicateMoodboard(ws, 'm1', 'm2', () => 'x', T)
    const afterDeletingOriginal = deleteMoodboard(ws, 'm1')
    // La copie utilise encore les deux images : rien à supprimer du stockage.
    expect(orphanImagePaths(ws, afterDeletingOriginal)).toEqual([])
    const afterDeletingBoth = deleteMoodboard(afterDeletingOriginal, 'm2')
    expect(orphanImagePaths(afterDeletingOriginal, afterDeletingBoth).sort()).toEqual(['u/w1/a.jpg', 'u/w1/b.jpg'])
  })
})

describe('onglet Design', () => {
  it('crée le profil Design au premier changement, puis le complète sans écraser le reste', () => {
    let ws = updateWeddingDesign(workspaceWithWedding(), 'w1', { styleKeywords: ['bohème'] }, T)
    expect(ws.weddings[0].design).toEqual({ styleKeywords: ['bohème'], palette: [], materials: [] })
    ws = updateWeddingDesign(ws, 'w1', { palette: [{ hex: '#520C0C' }] }, T2)
    expect(ws.weddings[0].design?.styleKeywords).toEqual(['bohème'])
    expect(ws.weddings[0].design?.palette).toEqual([{ hex: '#520C0C' }])
  })
})
