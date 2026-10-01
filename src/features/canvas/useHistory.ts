import { useCallback, useRef, useState } from 'react'

const HISTORY_LIMIT = 100
/** Deux modifications du même réglage à moins d'1 s d'intervalle (glisser dans le sélecteur de couleur, flèches) ne font qu'une étape d'annulation. */
const COALESCE_MS = 1000

/**
 * État d'un éditeur visuel (moodboard, plan de salle) + annuler/rétablir. `preview` = mise à jour
 * visuelle pendant un geste (rien n'est enregistré) ; `commit` = fin du geste,
 * une étape d'historique et un seul enregistrement via `persist`.
 */
export function useHistory<T>(initial: T, persist: (value: T) => void) {
  const [value, setValue] = useState(initial)
  const valueRef = useRef(initial)
  /** Dernier état enregistré — point de retour d'une annulation, même si un aperçu de geste est en cours. */
  const committedRef = useRef(initial)
  const past = useRef<T[]>([])
  const future = useRef<T[]>([])
  const lastCoalesce = useRef<{ key: string; at: number } | null>(null)
  const [counts, setCounts] = useState({ undo: 0, redo: 0 })
  const sync = useCallback(() => setCounts({ undo: past.current.length, redo: future.current.length }), [])

  const apply = useCallback(
    (next: T) => {
      valueRef.current = next
      committedRef.current = next
      setValue(next)
      persist(next)
    },
    [persist],
  )

  const preview = useCallback((next: T) => {
    valueRef.current = next
    setValue(next)
  }, [])

  const commit = useCallback(
    (next: T, coalesceKey?: string) => {
      // Geste sans effet (clic sans déplacer, champ quitté sans modification) : aucune étape d'annulation.
      if (JSON.stringify(next) === JSON.stringify(committedRef.current)) {
        preview(next)
        return
      }
      const now = Date.now()
      const last = lastCoalesce.current
      const merge = coalesceKey !== undefined && last?.key === coalesceKey && now - last.at < COALESCE_MS
      if (!merge) {
        past.current = [...past.current, committedRef.current].slice(-HISTORY_LIMIT)
      }
      future.current = []
      lastCoalesce.current = coalesceKey ? { key: coalesceKey, at: now } : null
      apply(next)
      sync()
    },
    [apply, preview, sync],
  )

  const undo = useCallback(() => {
    const previous = past.current.at(-1)
    if (!previous) return
    past.current = past.current.slice(0, -1)
    future.current = [committedRef.current, ...future.current]
    lastCoalesce.current = null
    apply(previous)
    sync()
  }, [apply, sync])

  const redo = useCallback(() => {
    const next = future.current[0]
    if (!next) return
    future.current = future.current.slice(1)
    past.current = [...past.current, committedRef.current]
    lastCoalesce.current = null
    apply(next)
    sync()
  }, [apply, sync])

  return {
    value,
    valueRef,
    preview,
    commit,
    undo,
    redo,
    canUndo: counts.undo > 0,
    canRedo: counts.redo > 0,
  }
}
