import type { FloorElementKind } from '@/types/entities'

/**
 * Couleurs du plan, partagées par l'éditeur (HTML) et l'export (canvas)
 * pour que le PNG/PDF ressemble exactement à l'écran.
 */
export const PLAN_COLORS = {
  stroke: '#8A94A6',
  text: '#2C2C2C',
  seatEmpty: '#FFFFFF',
  /** Place occupée — vert sauge, comme la référence Wedli. */
  seatFilled: '#7F8C68',
  seatFilledText: '#FFFFFF',
  /** Trait des murs. */
  wall: '#3A4250',
  /** Épaisseur du trait des murs (px « monde »). */
  wallWidth: 6,
} as const

export const ELEMENT_FILL: Record<FloorElementKind, string> = {
  table_ronde: '#FFFFFF',
  table_rect: '#FFFFFF',
  table_honneur: '#FFFFFF',
  piste: '#F1ECE4',
  scene: '#3A4250',
  bar: '#E6EAF0',
  buffet: '#E6EAF0',
  zone: 'transparent',
  texte: 'transparent',
  /** Intérieur de la salle, juste un peu plus clair que le fond de l'éditeur. */
  contour: '#FFFFFF',
}

/** Éléments dessinés en pointillés (contour seul). */
export const DASHED_KINDS: ReadonlySet<FloorElementKind> = new Set(['zone'])
