import type { FloorElement, FloorElementKind } from '@/types/entities'
import type { Point } from '@/features/moodboard/geometry'

/** Rayon d'une pastille de place, et sa distance au bord de la table (px « monde »). */
export const SEAT_RADIUS = 11
export const SEAT_OFFSET = 15

export const TABLE_KINDS: ReadonlySet<FloorElementKind> = new Set(['table_ronde', 'table_rect', 'table_honneur'])

export function isTable(el: Pick<FloorElement, 'kind'>): boolean {
  return TABLE_KINDS.has(el.kind)
}

export const ELEMENT_LABELS: Record<FloorElementKind, string> = {
  table_ronde: 'Table ronde',
  table_rect: 'Table rectangulaire',
  table_honneur: "Table d'honneur",
  piste: 'Piste de danse',
  scene: 'Scène / DJ',
  bar: 'Bar',
  buffet: 'Buffet',
  zone: 'Zone libre',
  texte: 'Texte',
  contour: 'Murs de la salle',
}

/** Taille, nombre de places et nom par défaut d'un nouvel élément. */
const DEFAULTS: Record<FloorElementKind, { w: number; h: number; seats?: number; label?: string }> = {
  table_ronde: { w: 120, h: 120, seats: 8 },
  table_rect: { w: 220, h: 80, seats: 8 },
  table_honneur: { w: 320, h: 70, seats: 6, label: "Table d'honneur" },
  piste: { w: 240, h: 200, label: 'Piste de danse' },
  scene: { w: 200, h: 90, label: 'Scène / DJ' },
  bar: { w: 180, h: 60, label: 'Bar' },
  buffet: { w: 240, h: 60, label: 'Buffet' },
  zone: { w: 220, h: 150, label: 'Zone' },
  texte: { w: 200, h: 40, label: 'Texte' },
  // Jamais créé par « Ajouter » : tracé point par point (cf. normalizeContour).
  contour: { w: 1, h: 1 },
}

/** Prochain numéro libre pour « Table N » (ignore les tables renommées librement). */
export function nextTableNumber(elements: FloorElement[]): number {
  const used = elements.map((e) => /^Table (\d+)$/.exec(e.label ?? '')?.[1]).filter(Boolean).map(Number)
  return used.length ? Math.max(...used) + 1 : 1
}

export function defaultElement(kind: FloorElementKind, elements: FloorElement[]): Pick<FloorElement, 'kind' | 'w' | 'h' | 'seats' | 'label'> {
  const d = DEFAULTS[kind]
  const label = d.label ?? (kind === 'table_ronde' || kind === 'table_rect' ? `Table ${nextTableNumber(elements)}` : undefined)
  return { kind, w: d.w, h: d.h, ...(d.seats ? { seats: d.seats } : {}), ...(label ? { label } : {}) }
}

/** Répartit `n` points sur un segment de longueur `length`, centrés dans des intervalles égaux. */
function spread(n: number, length: number): number[] {
  return Array.from({ length: n }, (_, i) => ((i + 0.5) * length) / n)
}

/**
 * Centre de chaque place, dans le repère de la table (origine en haut à
 * gauche, AVANT rotation — la table pivote avec ses places).
 * - ronde : en cercle, la place 0 en haut, dans le sens des aiguilles d'une montre ;
 * - rectangulaire : moitié en haut, moitié en bas ;
 * - d'honneur : toutes du même côté (en haut), face à la salle.
 */
export function seatPositions(el: Pick<FloorElement, 'kind' | 'w' | 'h' | 'seats'>): Point[] {
  const n = el.seats ?? 0
  if (n <= 0 || !TABLE_KINDS.has(el.kind)) return []
  if (el.kind === 'table_ronde') {
    const rx = el.w / 2 + SEAT_OFFSET
    const ry = el.h / 2 + SEAT_OFFSET
    return Array.from({ length: n }, (_, i) => {
      const a = (2 * Math.PI * i) / n - Math.PI / 2
      return { x: el.w / 2 + rx * Math.cos(a), y: el.h / 2 + ry * Math.sin(a) }
    })
  }
  if (el.kind === 'table_honneur') {
    return spread(n, el.w).map((x) => ({ x, y: -SEAT_OFFSET }))
  }
  const top = Math.ceil(n / 2)
  return [...spread(top, el.w).map((x) => ({ x, y: -SEAT_OFFSET })), ...spread(n - top, el.w).map((x) => ({ x, y: el.h + SEAT_OFFSET }))]
}

/** Initiales d'un invité pour sa pastille : « Camille Martin » → « CM », « Mamie » → « MA ». */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

// ——— Murs / contour de la salle ———

/** Angle d'un tracé de murs ; `bulge` arrondit le mur qui part de cet angle (flèche de l'arc, signée, 0 = droit). */
export type ContourPoint = Point & { bulge?: number }

/** Distance (px écran) sous laquelle un clic sur le premier point ferme le tracé. */
export const CLOSE_DISTANCE_PX = 12

/** Murs du tracé : [début, fin, index de l'angle de départ] — avec le mur de fermeture si le tracé est fermé. */
export function contourSegments(points: ContourPoint[], closed: boolean): [ContourPoint, ContourPoint, number][] {
  const count = closed ? points.length : points.length - 1
  return Array.from({ length: Math.max(0, count) }, (_, i) => [points[i], points[(i + 1) % points.length], i])
}

/**
 * Géométrie d'un mur arrondi, tracé en courbe quadratique : `apex` = milieu
 * de l'arc (là où se trouve la poignée), `control` = point de contrôle
 * (deux fois plus loin du milieu de la corde que l'apex).
 */
export function segmentCurve(a: Point, b: Point, bulge = 0) {
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
  const len = Math.hypot(b.x - a.x, b.y - a.y)
  const normal = len === 0 ? { x: 0, y: 0 } : { x: -(b.y - a.y) / len, y: (b.x - a.x) / len }
  return {
    mid,
    normal,
    apex: { x: mid.x + normal.x * bulge, y: mid.y + normal.y * bulge },
    control: { x: mid.x + normal.x * 2 * bulge, y: mid.y + normal.y * 2 * bulge },
  }
}

/** Flèche d'un mur pour que son arc passe par `pointer` (projection sur la perpendiculaire du mur). */
export function bulgeTowards(a: Point, b: Point, pointer: Point): number {
  const { mid, normal } = segmentCurve(a, b)
  return (pointer.x - mid.x) * normal.x + (pointer.y - mid.y) * normal.y
}

/** Tracé SVG (attribut `d`) des murs, droits ou arrondis. */
export function contourPathD(points: ContourPoint[], closed: boolean): string {
  if (points.length === 0) return ''
  const parts = [`M ${points[0].x} ${points[0].y}`]
  for (const [a, b] of contourSegments(points, closed)) {
    if (a.bulge) {
      const { control } = segmentCurve(a, b, a.bulge)
      parts.push(`Q ${control.x} ${control.y} ${b.x} ${b.y}`)
    } else {
      parts.push(`L ${b.x} ${b.y}`)
    }
  }
  if (closed) parts.push('Z')
  return parts.join(' ')
}

const CURVE_STEPS = 16

/** Points d'un mur (arrondi ou non), du début à la fin incluse — pour les distances et la boîte englobante. */
export function sampleSegment(a: ContourPoint, b: ContourPoint): Point[] {
  if (!a.bulge) return [a, b]
  const { control: c } = segmentCurve(a, b, a.bulge)
  return Array.from({ length: CURVE_STEPS + 1 }, (_, k) => {
    const t = k / CURVE_STEPS
    const u = 1 - t
    return { x: u * u * a.x + 2 * u * t * c.x + t * t * b.x, y: u * u * a.y + 2 * u * t * c.y + t * t * b.y }
  })
}

/**
 * Recale la boîte d'un contour sur son tracé (arcs compris) : angles en
 * coordonnées « monde » → boîte englobante + angles relatifs à son coin haut-gauche.
 */
export function normalizeContour(worldPoints: ContourPoint[], closed = false): { x: number; y: number; w: number; h: number; points: ContourPoint[] } {
  const samples = [...worldPoints, ...contourSegments(worldPoints, closed).flatMap(([a, b]) => sampleSegment(a, b))]
  const minX = Math.min(...samples.map((p) => p.x))
  const minY = Math.min(...samples.map((p) => p.y))
  const maxX = Math.max(...samples.map((p) => p.x))
  const maxY = Math.max(...samples.map((p) => p.y))
  return {
    x: minX,
    y: minY,
    w: Math.max(1, maxX - minX),
    h: Math.max(1, maxY - minY),
    points: worldPoints.map((p) => ({ ...p, x: p.x - minX, y: p.y - minY })),
  }
}

/** Angles d'un contour en coordonnées « monde » (les contours ne pivotent pas : on redessine les murs directement). */
export function contourWorldPoints(el: Pick<FloorElement, 'x' | 'y' | 'points'>): ContourPoint[] {
  return (el.points ?? []).map((p) => ({ ...p, x: el.x + p.x, y: el.y + p.y }))
}

/** Maj pendant le tracé : le mur suit l'angle multiple de 45° le plus proche (murs droits, angles nets). */
export function constrainAngle(from: Point, to: Point): Point {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const length = Math.hypot(dx, dy)
  if (length === 0) return to
  const step = Math.PI / 4
  const angle = Math.round(Math.atan2(dy, dx) / step) * step
  return { x: from.x + length * Math.cos(angle), y: from.y + length * Math.sin(angle) }
}

export function distanceToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len2 = dx * dx + dy * dy
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2))
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy))
}

function distanceToWall(p: Point, a: ContourPoint, b: ContourPoint): number {
  const samples = sampleSegment(a, b)
  let best = Infinity
  for (let k = 0; k < samples.length - 1; k++) best = Math.min(best, distanceToSegment(p, samples[k], samples[k + 1]))
  return best
}

/** Distance d'un point au tracé (mur le plus proche, arcs compris). */
export function distanceToContour(points: ContourPoint[], p: Point, closed: boolean): number {
  return Math.min(Infinity, ...contourSegments(points, closed).map(([a, b]) => distanceToWall(p, a, b)))
}

/** Index où insérer un nouvel angle cliqué près du tracé : juste après le début du mur le plus proche. */
export function insertionIndex(points: ContourPoint[], p: Point, closed: boolean): number {
  let best = 1
  let bestDistance = Infinity
  for (const [a, b, i] of contourSegments(points, closed)) {
    const d = distanceToWall(p, a, b)
    if (d < bestDistance) {
      bestDistance = d
      best = i + 1
    }
  }
  return best
}

/**
 * Ajoute un angle sur un mur : un mur arrondi coupé en son milieu donne
 * deux arcs d'environ un quart de sa flèche chacun (approximation fidèle à l'œil).
 */
export function insertContourPoint(points: ContourPoint[], at: Point, closed: boolean): ContourPoint[] {
  const index = insertionIndex(points, at, closed)
  const before = points[index - 1]
  const quarter = before.bulge ? before.bulge / 4 : undefined
  const left: ContourPoint = { ...before, ...(quarter ? { bulge: quarter } : {}) }
  const inserted: ContourPoint = { x: at.x, y: at.y, ...(quarter ? { bulge: quarter } : {}) }
  return [...points.slice(0, index - 1), left, inserted, ...points.slice(index)]
}

/** Contour redimensionné par sa boîte : les angles et les arcs suivent proportionnellement. */
export function scalePoints(points: ContourPoint[], from: { w: number; h: number }, to: { w: number; h: number }): ContourPoint[] {
  const kx = to.w / from.w
  const ky = to.h / from.h
  return points.map((p) => ({ ...p, x: p.x * kx, y: p.y * ky, ...(p.bulge ? { bulge: (p.bulge * (kx + ky)) / 2 } : {}) }))
}
