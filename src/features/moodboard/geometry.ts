/**
 * Géométrie de l'éditeur visuel (moodboard aujourd'hui, plan de salle
 * ensuite) — fonctions pures, testées sans DOM. Coordonnées « monde » en
 * pixels, rotation en degrés autour du centre de la boîte.
 */

export interface Point {
  x: number
  y: number
}

export interface Box {
  x: number
  y: number
  w: number
  h: number
}

export interface RotatedBox extends Box {
  rotation: number
}

export type CornerHandle = 'nw' | 'ne' | 'sw' | 'se'

/** Taille minimale d'un élément, pour qu'il reste toujours attrapable. */
export const MIN_SIZE = 24

const rad = (deg: number) => (deg * Math.PI) / 180

export function rotatePoint(p: Point, deg: number): Point {
  const a = rad(deg)
  const cos = Math.cos(a)
  const sin = Math.sin(a)
  return { x: p.x * cos - p.y * sin, y: p.x * sin + p.y * cos }
}

export function centerOf(box: Box): Point {
  return { x: box.x + box.w / 2, y: box.y + box.h / 2 }
}

/** Les 4 coins réels (rotation comprise) d'une boîte. */
export function cornersOf(box: RotatedBox): Point[] {
  const c = centerOf(box)
  return [
    { x: -box.w / 2, y: -box.h / 2 },
    { x: box.w / 2, y: -box.h / 2 },
    { x: box.w / 2, y: box.h / 2 },
    { x: -box.w / 2, y: box.h / 2 },
  ].map((p) => {
    const r = rotatePoint(p, box.rotation)
    return { x: c.x + r.x, y: c.y + r.y }
  })
}

/** Rectangle englobant (droit) d'un ensemble d'éléments, rotations comprises. */
export function boundsOf(boxes: (Box & { rotation?: number })[]): Box {
  if (boxes.length === 0) return { x: 0, y: 0, w: 1, h: 1 }
  const pts = boxes.flatMap((b) => cornersOf({ ...b, rotation: b.rotation ?? 0 }))
  const minX = Math.min(...pts.map((p) => p.x))
  const minY = Math.min(...pts.map((p) => p.y))
  const maxX = Math.max(...pts.map((p) => p.x))
  const maxY = Math.max(...pts.map((p) => p.y))
  return { x: minX, y: minY, w: Math.max(1, maxX - minX), h: Math.max(1, maxY - minY) }
}

const HANDLE_SIGNS: Record<CornerHandle, Point> = { nw: { x: -1, y: -1 }, ne: { x: 1, y: -1 }, sw: { x: -1, y: 1 }, se: { x: 1, y: 1 } }

/**
 * Redimensionne une boîte (même pivotée) en tirant un coin vers `pointer`
 * (coordonnées monde) : le coin opposé reste fixe à l'écran.
 * `keepRatio` conserve les proportions (images).
 */
export function resizeFromCorner(start: RotatedBox, handle: CornerHandle, pointer: Point, keepRatio: boolean): Box {
  const s = HANDLE_SIGNS[handle]
  const c = centerOf(start)
  const anchorLocal = { x: (-s.x * start.w) / 2, y: (-s.y * start.h) / 2 }
  const anchorRot = rotatePoint(anchorLocal, start.rotation)
  const anchor = { x: c.x + anchorRot.x, y: c.y + anchorRot.y }

  const diag = rotatePoint({ x: pointer.x - anchor.x, y: pointer.y - anchor.y }, -start.rotation)
  let w = Math.max(MIN_SIZE, s.x * diag.x)
  let h = Math.max(MIN_SIZE, s.y * diag.y)
  if (keepRatio) {
    const k = Math.max(w / start.w, h / start.h)
    w = Math.max(MIN_SIZE, start.w * k)
    h = Math.max(MIN_SIZE, start.h * k)
  }

  const half = rotatePoint({ x: (s.x * w) / 2, y: (s.y * h) / 2 }, start.rotation)
  const nc = { x: anchor.x + half.x, y: anchor.y + half.y }
  return { x: nc.x - w / 2, y: nc.y - h / 2, w, h }
}

/** Angle (degrés, 0 = poignée vers le haut) pour que la poignée de rotation suive le pointeur ; `snap` = crans de 15°. */
export function rotationTowards(box: Box, pointer: Point, snap: boolean): number {
  const c = centerOf(box)
  let deg = (Math.atan2(pointer.y - c.y, pointer.x - c.x) * 180) / Math.PI + 90
  if (snap) deg = Math.round(deg / 15) * 15
  return normalizeAngle(deg)
}

export function normalizeAngle(deg: number): number {
  const d = ((deg % 360) + 360) % 360
  return d > 180 ? d - 360 : d
}

export function snapTo(value: number, grid: number): number {
  return Math.round(value / grid) * grid
}

/** Zoom autour d'un point écran : ce point reste sous le curseur. */
export function zoomAt(view: { x: number; y: number; scale: number }, screen: Point, nextScale: number) {
  const scale = clamp(nextScale, MIN_ZOOM, MAX_ZOOM)
  const world = { x: (screen.x - view.x) / view.scale, y: (screen.y - view.y) / view.scale }
  return { scale, x: screen.x - world.x * scale, y: screen.y - world.y * scale }
}

export const MIN_ZOOM = 0.1
export const MAX_ZOOM = 4

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}

/** Cadre la vue sur des éléments, avec une marge, dans une zone d'affichage donnée. */
export function fitView(content: Box, viewport: { w: number; h: number }, margin = 48) {
  const scale = clamp(Math.min((viewport.w - margin * 2) / content.w, (viewport.h - margin * 2) / content.h), MIN_ZOOM, 1.5)
  return { scale, x: (viewport.w - content.w * scale) / 2 - content.x * scale, y: (viewport.h - content.h * scale) / 2 - content.y * scale }
}
