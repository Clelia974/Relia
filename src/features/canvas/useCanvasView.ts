import { type RefObject, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { type Box, fitView, type Point, zoomAt } from '@/features/moodboard/geometry'

export type View = { x: number; y: number; scale: number }

/** Largeur du panneau de réglages superposé à droite des éditeurs (w-72). */
export const INSPECTOR_WIDTH = 288
const PANEL_MARGIN = 24

/**
 * Vue d'un éditeur visuel (moodboard, plan de salle) : déplacement et zoom.
 * Molette = se déplacer ; pincer au trackpad ou ⌘/Ctrl + molette = zoomer
 * autour du curseur. `viewRef` sert aux gestes (toujours la vue à jour, sans
 * attendre un rendu).
 */
export function useCanvasView(viewportRef: RefObject<HTMLDivElement | null>) {
  const [view, setView] = useState<View>({ x: 0, y: 0, scale: 1 })
  const viewRef = useRef(view)
  useLayoutEffect(() => {
    viewRef.current = view
  })

  const viewportSize = useCallback(() => {
    const rect = viewportRef.current?.getBoundingClientRect()
    return { w: rect?.width ?? 800, h: rect?.height ?? 600 }
  }, [viewportRef])

  // Écouteur non passif : sans lui, le navigateur zoomerait toute la page.
  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      if (e.ctrlKey || e.metaKey) {
        const rect = el.getBoundingClientRect()
        setView((v) => zoomAt(v, { x: e.clientX - rect.left, y: e.clientY - rect.top }, v.scale * Math.exp(-e.deltaY * 0.01)))
      } else {
        setView((v) => ({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY }))
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [viewportRef])

  const toWorld = useCallback(
    (clientX: number, clientY: number): Point => {
      const rect = viewportRef.current?.getBoundingClientRect()
      const v = viewRef.current
      return { x: (clientX - (rect?.left ?? 0) - v.x) / v.scale, y: (clientY - (rect?.top ?? 0) - v.y) / v.scale }
    },
    [viewportRef],
  )

  const centerWorld = useCallback((): Point => {
    const { w, h } = viewportSize()
    const v = viewRef.current
    return { x: (w / 2 - v.x) / v.scale, y: (h / 2 - v.y) / v.scale }
  }, [viewportSize])

  const zoomBy = useCallback(
    (factor: number) => {
      const { w, h } = viewportSize()
      setView((v) => zoomAt(v, { x: w / 2, y: h / 2 }, v.scale * factor))
    },
    [viewportSize],
  )

  /** Cadre tout le contenu ; sans contenu, place l'origine un peu en haut à gauche du centre. */
  const fitTo = useCallback(
    (content: Box | null) => {
      const size = viewportSize()
      setView(content ? fitView(content, size) : { x: size.w / 2 - 300, y: size.h / 2 - 200, scale: 1 })
    },
    [viewportSize],
  )

  /**
   * Fait glisser la vue juste assez pour qu'un élément ne soit pas caché
   * sous le panneau de réglages (superposé à droite, `panelWidth` px écran).
   * Sans effet si l'élément est déjà visible.
   */
  const revealBesidePanel = useCallback(
    (content: Box, panelWidth: number) => {
      const { w } = viewportSize()
      const v = viewRef.current
      const left = v.x + content.x * v.scale
      const right = v.x + (content.x + content.w) * v.scale
      const limit = w - panelWidth - PANEL_MARGIN
      if (right <= limit) return
      // Élément plus large que la place libre (les murs de toute la salle) : le décaler n'aiderait pas.
      if (right - left > limit - PANEL_MARGIN) return
      // Jamais au point de faire sortir l'élément par la gauche.
      const shift = Math.min(right - limit, Math.max(0, left - PANEL_MARGIN))
      if (shift > 0) setView((prev) => ({ ...prev, x: prev.x - shift }))
    },
    [viewportSize],
  )

  return { view, setView, viewRef, toWorld, centerWorld, zoomBy, fitTo, revealBesidePanel }
}
