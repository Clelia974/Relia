import type { Moodboard, MoodboardItem, WeddingDesign, Workspace } from '@/types/entities'

/**
 * Opérations pures sur les moodboards et l'onglet Design (Workspace →
 * Workspace) — le store ne fait que les appeler, ce qui les garde testables
 * sans React ni localStorage.
 */

export function createMoodboard(ws: Workspace, weddingId: string, title: string, id: string, now: string): Workspace {
  const board: Moodboard = { id, weddingId, title, items: [], createdAt: now, updatedAt: now }
  return { ...ws, moodboards: [...ws.moodboards, board] }
}

export function renameMoodboard(ws: Workspace, id: string, title: string, now: string): Workspace {
  return { ...ws, moodboards: ws.moodboards.map((b) => (b.id === id ? { ...b, title, updatedAt: now } : b)) }
}

/**
 * Copie un moodboard (nouveaux identifiants d'éléments). Les images ne sont
 * PAS recopiées dans le stockage : la copie référence les mêmes fichiers —
 * d'où `orphanImagePaths` avant toute suppression de fichier.
 */
export function duplicateMoodboard(ws: Workspace, id: string, newId: string, newItemId: () => string, now: string): Workspace {
  const source = ws.moodboards.find((b) => b.id === id)
  if (!source) return ws
  const copy: Moodboard = {
    ...source,
    id: newId,
    title: `${source.title} (copie)`,
    items: source.items.map((item) => ({ ...item, id: newItemId() })),
    createdAt: now,
    updatedAt: now,
  }
  return { ...ws, moodboards: [...ws.moodboards, copy] }
}

export function deleteMoodboard(ws: Workspace, id: string): Workspace {
  return { ...ws, moodboards: ws.moodboards.filter((b) => b.id !== id) }
}

/** Remplace tous les éléments d'un moodboard d'un coup — appelé à la fin d'un geste (relâchement), jamais à chaque mouvement de souris. */
export function setMoodboardItems(ws: Workspace, id: string, items: MoodboardItem[], now: string): Workspace {
  return { ...ws, moodboards: ws.moodboards.map((b) => (b.id === id ? { ...b, items, updatedAt: now } : b)) }
}

const EMPTY_DESIGN: WeddingDesign = { styleKeywords: [], palette: [], materials: [] }

export function updateWeddingDesign(ws: Workspace, weddingId: string, patch: Partial<WeddingDesign>, now: string): Workspace {
  return {
    ...ws,
    weddings: ws.weddings.map((w) => (w.id === weddingId ? { ...w, design: { ...EMPTY_DESIGN, ...w.design, ...patch }, updatedAt: now } : w)),
  }
}

/** Tous les fichiers image encore utilisés quelque part (moodboards + portfolios de clôture). */
export function referencedImagePaths(ws: Workspace): Set<string> {
  const paths = new Set<string>()
  for (const board of ws.moodboards) for (const item of board.items) if (item.storagePath) paths.add(item.storagePath)
  for (const closing of ws.closingSessions) for (const img of closing.portfolioImages) if (img.storagePath) paths.add(img.storagePath)
  return paths
}

/**
 * Fichiers présents dans `before` mais plus référencés dans `after` — ceux
 * qu'on peut supprimer du stockage sans jamais casser une copie de moodboard
 * qui partage encore la même image.
 */
export function orphanImagePaths(before: Workspace, after: Workspace): string[] {
  const still = referencedImagePaths(after)
  return [...referencedImagePaths(before)].filter((p) => !still.has(p))
}
