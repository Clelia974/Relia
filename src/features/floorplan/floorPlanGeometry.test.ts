import { describe, expect, it } from 'vitest'
import {
  bulgeTowards,
  constrainAngle,
  contourPathD,
  insertContourPoint,
  defaultElement,
  distanceToContour,
  initials,
  insertionIndex,
  nextTableNumber,
  normalizeContour,
  scalePoints,
  SEAT_OFFSET,
  seatPositions,
} from '@/features/floorplan/floorPlanGeometry'
import type { FloorElement } from '@/types/entities'

const el = (p: Partial<FloorElement>): FloorElement => ({ id: 'e', kind: 'table_ronde', x: 0, y: 0, w: 100, h: 100, rotation: 0, z: 0, ...p })

describe('floorPlanGeometry', () => {
  it('table ronde : places en cercle, la première en haut', () => {
    const seats = seatPositions(el({ seats: 4 }))
    expect(seats).toHaveLength(4)
    expect(seats[0].x).toBeCloseTo(50)
    expect(seats[0].y).toBeCloseTo(-SEAT_OFFSET)
    expect(seats[1].x).toBeCloseTo(100 + SEAT_OFFSET) // à droite, sens des aiguilles d'une montre
  })

  it('table rectangulaire : moitié en haut, moitié en bas', () => {
    const seats = seatPositions(el({ kind: 'table_rect', w: 200, h: 80, seats: 5 }))
    expect(seats.filter((s) => s.y < 0)).toHaveLength(3)
    expect(seats.filter((s) => s.y > 80)).toHaveLength(2)
  })

  it("table d'honneur : toutes les places du même côté", () => {
    const seats = seatPositions(el({ kind: 'table_honneur', w: 300, h: 70, seats: 6 }))
    expect(seats.every((s) => s.y < 0)).toBe(true)
  })

  it('pas de places hors des tables', () => {
    expect(seatPositions(el({ kind: 'piste', seats: 4 }))).toEqual([])
  })

  it('numérote les nouvelles tables à la suite', () => {
    const elements = [el({ id: 'a', label: 'Table 1' }), el({ id: 'b', label: 'Table 4' }), el({ id: 'c', label: 'Les Oliviers' })]
    expect(nextTableNumber(elements)).toBe(5)
    expect(defaultElement('table_ronde', elements).label).toBe('Table 5')
    expect(defaultElement('piste', elements).seats).toBeUndefined()
  })

  it('initiales', () => {
    expect(initials('Camille Martin')).toBe('CM')
    expect(initials('Jean Pierre de La Tour')).toBe('JT')
    expect(initials('mamie')).toBe('MA')
  })
})

describe('murs de la salle', () => {
  it('recale la boîte sur les angles (points relatifs au coin haut-gauche)', () => {
    expect(normalizeContour([{ x: 100, y: 50 }, { x: 300, y: 50 }, { x: 300, y: 250 }])).toEqual({
      x: 100,
      y: 50,
      w: 200,
      h: 200,
      points: [{ x: 0, y: 0 }, { x: 200, y: 0 }, { x: 200, y: 200 }],
    })
  })

  it('Maj : le mur suit un angle multiple de 45°, longueur conservée', () => {
    const p = constrainAngle({ x: 0, y: 0 }, { x: 100, y: 8 })
    expect(p.x).toBeCloseTo(Math.hypot(100, 8))
    expect(p.y).toBeCloseTo(0)
    const d = constrainAngle({ x: 0, y: 0 }, { x: 50, y: 46 })
    expect(d.x).toBeCloseTo(d.y)
  })

  it('un angle ajouté se place sur le mur le plus proche, y compris le mur de fermeture', () => {
    const square = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }]
    expect(insertionIndex(square, { x: 50, y: 2 }, true)).toBe(1)
    expect(insertionIndex(square, { x: 1, y: 50 }, true)).toBe(4)
    expect(distanceToContour(square, { x: 50, y: 50 }, true)).toBe(50)
    // Ligne ouverte : pas de mur de fermeture à gauche, le plus proche est donc loin.
    expect(distanceToContour(square, { x: -5, y: 50 }, true)).toBeCloseTo(5)
    expect(distanceToContour(square, { x: -5, y: 50 }, false)).toBeGreaterThan(45)
  })

  it('agrandir la boîte agrandit la salle proportionnellement', () => {
    expect(scalePoints([{ x: 10, y: 20 }], { w: 100, h: 100 }, { w: 200, h: 50 })).toEqual([{ x: 20, y: 10 }])
  })
})

describe('murs arrondis', () => {
  const a = { x: 0, y: 0 }
  const b = { x: 100, y: 0 }

  it('la flèche suit le pointeur perpendiculairement au mur', () => {
    expect(bulgeTowards(a, b, { x: 30, y: 40 })).toBeCloseTo(40)
    expect(bulgeTowards(a, b, { x: 70, y: -25 })).toBeCloseTo(-25)
  })

  it('tracé SVG : courbe pour un mur arrondi, droite sinon', () => {
    expect(contourPathD([{ ...a, bulge: 20 }, b], false)).toBe('M 0 0 Q 50 40 100 0')
    expect(contourPathD([a, b, { x: 100, y: 100 }], true)).toBe('M 0 0 L 100 0 L 100 100 L 0 0 Z')
  })

  it("la boîte englobe l'arc, pas seulement les angles", () => {
    const box = normalizeContour([{ ...a, bulge: 30 }, b])
    expect(box.h).toBeCloseTo(30)
  })

  it('un point près de l’arc est près du mur', () => {
    expect(distanceToContour([{ ...a, bulge: 30 }, b], { x: 50, y: 30 }, false)).toBeLessThan(1)
  })

  it('ajouter un angle sur un mur arrondi garde deux arcs plus petits', () => {
    const points = insertContourPoint([{ ...a, bulge: 40 }, b], { x: 50, y: 40 }, false)
    expect(points).toEqual([{ ...a, bulge: 10 }, { x: 50, y: 40, bulge: 10 }, b])
  })
})
