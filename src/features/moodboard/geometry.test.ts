import { describe, expect, it } from 'vitest'
import { boundsOf, fitView, MIN_SIZE, normalizeAngle, resizeFromCorner, rotationTowards, zoomAt } from '@/features/moodboard/geometry'

const close = (a: number, b: number) => expect(a).toBeCloseTo(b, 6)

describe('resizeFromCorner', () => {
  it('sans rotation : tirer le coin bas-droit agrandit, le coin haut-gauche ne bouge pas', () => {
    const r = resizeFromCorner({ x: 0, y: 0, w: 100, h: 50, rotation: 0 }, 'se', { x: 150, y: 80 }, false)
    expect(r).toEqual({ x: 0, y: 0, w: 150, h: 80 })
  })

  it('tirer le coin haut-gauche déplace l’origine, le coin bas-droit reste fixe', () => {
    const r = resizeFromCorner({ x: 0, y: 0, w: 100, h: 100, rotation: 0 }, 'nw', { x: -50, y: 20 }, false)
    expect(r).toEqual({ x: -50, y: 20, w: 150, h: 80 })
  })

  it('garde les proportions d’une image', () => {
    const r = resizeFromCorner({ x: 0, y: 0, w: 200, h: 100, rotation: 0 }, 'se', { x: 400, y: 120 }, true)
    expect(r.w / r.h).toBeCloseTo(2)
    expect(r.w).toBe(400)
  })

  it('ne descend jamais sous la taille minimale (élément toujours attrapable)', () => {
    const r = resizeFromCorner({ x: 0, y: 0, w: 100, h: 100, rotation: 0 }, 'se', { x: -500, y: -500 }, false)
    expect(r.w).toBe(MIN_SIZE)
    expect(r.h).toBe(MIN_SIZE)
  })

  it('élément pivoté de 90° : le coin opposé reste au même endroit à l’écran', () => {
    const start = { x: 0, y: 0, w: 100, h: 50, rotation: 90 }
    // Coin « nw » local d'une boîte tournée de 90° autour de (50,25) : se trouve à l'écran en (75, -25).
    const r = resizeFromCorner(start, 'se', { x: 0, y: 100 }, false)
    // Le coin opposé (nw) doit toujours être en (75, -25).
    const c = { x: r.x + r.w / 2, y: r.y + r.h / 2 }
    const nw = { x: c.x + (r.h / 2) * 1, y: c.y - r.w / 2 } // rotation 90° de (-w/2,-h/2) = (h/2, -w/2)
    close(nw.x, 75)
    close(nw.y, -25)
  })
})

describe('rotation', () => {
  it('poignée vers la droite = 90°, avec crans de 15° si demandé', () => {
    expect(rotationTowards({ x: 0, y: 0, w: 100, h: 100 }, { x: 200, y: 50 }, false)).toBeCloseTo(90)
    expect(rotationTowards({ x: 0, y: 0, w: 100, h: 100 }, { x: 200, y: 60 }, true)).toBe(90)
  })
  it('normalise les angles entre -180 et 180', () => {
    expect(normalizeAngle(270)).toBe(-90)
    expect(normalizeAngle(-190)).toBe(170)
  })
})

describe('vue', () => {
  it('englobe les éléments pivotés', () => {
    const b = boundsOf([{ x: 0, y: 0, w: 100, h: 100, rotation: 45 }])
    close(b.w, Math.SQRT2 * 100)
  })
  it('zoomer garde le point visé sous le curseur', () => {
    const v = zoomAt({ x: 0, y: 0, scale: 1 }, { x: 100, y: 100 }, 2)
    expect(v).toEqual({ scale: 2, x: -100, y: -100 })
  })
  it('cadre le contenu au centre de la zone', () => {
    const v = fitView({ x: 0, y: 0, w: 100, h: 100 }, { w: 600, h: 400 }, 0)
    expect(v.scale).toBe(1.5)
    expect(v.x).toBe(225)
  })
})
