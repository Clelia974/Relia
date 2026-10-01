import { contourSegments, initials, isTable, SEAT_OFFSET, SEAT_RADIUS, seatPositions, segmentCurve } from '@/features/floorplan/floorPlanGeometry'
import { guestsByTable } from '@/features/floorplan/floorPlanOps'
import { DASHED_KINDS, ELEMENT_FILL, PLAN_COLORS } from '@/features/floorplan/floorPlanStyle'
import { readableTextOn } from '@/features/moodboard/colors'
import { boundsOf } from '@/features/moodboard/geometry'
import type { FloorElement, Guest, SeatAssignment } from '@/types/entities'

/**
 * Export du plan de salle : redessiné sur un canvas (même rendu que l'écran,
 * sans librairie) → PNG, ou PDF via l'impression du navigateur. La liste
 * « par table » s'imprime à part (escort cards, équipe du jour J).
 */

const PADDING = 48 + SEAT_OFFSET + SEAT_RADIUS
const PIXEL_RATIO = 2
const MAX_EDGE = 6000
const SANS = "'Public Sans', system-ui, sans-serif"
const SERIF = "'Source Serif 4', Georgia, serif"

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)
}

function drawElement(ctx: CanvasRenderingContext2D, el: FloorElement, occupants: (Guest | undefined)[]) {
  const { w, h } = el
  const fill = el.color ?? ELEMENT_FILL[el.kind]
  if (el.kind === 'contour') {
    const points = el.points ?? []
    if (points.length < 2) return
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    for (const [a, b] of contourSegments(points, el.closed ?? false)) {
      if (a.bulge) {
        const { control } = segmentCurve(a, b, a.bulge)
        ctx.quadraticCurveTo(control.x, control.y, b.x, b.y)
      } else {
        ctx.lineTo(b.x, b.y)
      }
    }
    if (el.closed) {
      ctx.closePath()
      ctx.fillStyle = fill
      ctx.fill()
    }
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    ctx.strokeStyle = PLAN_COLORS.wall
    ctx.lineWidth = PLAN_COLORS.wallWidth
    ctx.stroke()
    if (el.label) {
      ctx.fillStyle = PLAN_COLORS.stroke
      ctx.font = `italic 14px ${SERIF}`
      ctx.textAlign = 'start'
      ctx.textBaseline = 'alphabetic'
      ctx.fillText(el.label, 12, 24)
    }
    return
  }
  if (el.kind === 'texte') {
    ctx.fillStyle = PLAN_COLORS.text
    ctx.font = `18px ${SERIF}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(el.label || 'Texte', w / 2, h / 2, w)
    return
  }
  ctx.beginPath()
  if (el.kind === 'table_ronde') ctx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2)
  else ctx.roundRect(0, 0, w, h, el.kind === 'piste' ? 4 : 8)
  if (fill !== 'transparent') {
    ctx.fillStyle = fill
    ctx.fill()
  }
  ctx.setLineDash(DASHED_KINDS.has(el.kind) ? [6, 4] : [])
  ctx.strokeStyle = PLAN_COLORS.stroke
  ctx.lineWidth = 1.5
  ctx.stroke()
  ctx.setLineDash([])

  const textColor = fill === 'transparent' ? PLAN_COLORS.text : readableTextOn(fill)
  ctx.fillStyle = textColor
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `500 14px ${SANS}`
  const table = isTable(el)
  ctx.fillText(el.label ?? '', w / 2, table ? h / 2 - 7 : h / 2, w - 12)
  if (table) {
    ctx.globalAlpha = 0.7
    ctx.font = `11px ${SANS}`
    ctx.fillText(`${occupants.filter(Boolean).length}/${el.seats ?? 0}`, w / 2, h / 2 + 9)
    ctx.globalAlpha = 1
  }

  seatPositions(el).forEach((p, seat) => {
    const guest = occupants[seat]
    ctx.beginPath()
    ctx.arc(p.x, p.y, SEAT_RADIUS, 0, Math.PI * 2)
    ctx.fillStyle = guest ? PLAN_COLORS.seatFilled : PLAN_COLORS.seatEmpty
    ctx.fill()
    ctx.strokeStyle = guest ? PLAN_COLORS.seatFilled : PLAN_COLORS.stroke
    ctx.stroke()
    if (guest) {
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate((-el.rotation * Math.PI) / 180)
      ctx.fillStyle = PLAN_COLORS.seatFilledText
      ctx.font = `600 9px ${SANS}`
      ctx.fillText(initials(guest.name), 0, 0.5)
      ctx.restore()
    }
  })
}

export async function renderFloorPlan(elements: FloorElement[], assignments: SeatAssignment[], guests: Guest[]): Promise<HTMLCanvasElement> {
  await document.fonts?.ready
  const bounds = boundsOf(elements)
  const width = bounds.w + PADDING * 2
  const height = bounds.h + PADDING * 2
  const ratio = Math.min(PIXEL_RATIO, MAX_EDGE / Math.max(width, height))
  const byId = new Map(guests.map((g) => [g.id, g]))

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(width * ratio)
  canvas.height = Math.round(height * ratio)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Export impossible dans ce navigateur.')
  ctx.scale(ratio, ratio)
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, width, height)

  for (const el of [...elements].sort((a, b) => a.z - b.z)) {
    const occupants: (Guest | undefined)[] = []
    for (const a of assignments) if (a.elementId === el.id) occupants[a.seat] = byId.get(a.guestId)
    ctx.save()
    ctx.translate(el.x - bounds.x + PADDING + el.w / 2, el.y - bounds.y + PADDING + el.h / 2)
    ctx.rotate((el.rotation * Math.PI) / 180)
    ctx.translate(-el.w / 2, -el.h / 2)
    drawElement(ctx, el, occupants)
    ctx.restore()
  }
  return canvas
}

/** Imprime une page HTML autonome dans une iframe cachée (→ « Enregistrer au format PDF »). */
async function printHtml(title: string, body: string, landscape: boolean, waitForImage = false): Promise<void> {
  const iframe = document.createElement('iframe')
  iframe.setAttribute('aria-hidden', 'true')
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;'
  document.body.appendChild(iframe)
  const doc = iframe.contentDocument
  if (!doc) {
    iframe.remove()
    throw new Error('Impression impossible dans ce navigateur.')
  }
  doc.open()
  doc.write(
    `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>` +
      `@page{size:A4 ${landscape ? 'landscape' : 'portrait'};margin:12mm}` +
      `body{margin:0;font-family:${SANS};color:#2C2C2C}` +
      `h1{font-family:${SERIF};font-weight:600;font-size:22px;margin:0 0 4px}` +
      `.sub{color:#6B7280;font-size:12px;margin:0 0 16px}` +
      `.grid{columns:3;column-gap:24px}.table{break-inside:avoid;margin:0 0 16px}` +
      `h2{font-size:14px;margin:0 0 4px;border-bottom:1px solid #D7DCE3;padding-bottom:3px}` +
      `ol{margin:0;padding-left:18px;font-size:12px;line-height:1.6}.empty{color:#9CA3AF;font-size:12px}` +
      `.plan{display:flex;align-items:center;justify-content:center;height:100vh}.plan img{max-width:100%;max-height:100%}` +
      `</style></head><body>${body}</body></html>`,
  )
  doc.close()
  if (waitForImage) {
    const img = doc.querySelector('img')
    if (img && !img.complete) await new Promise<void>((resolve) => (img.onload = () => resolve()))
  }
  iframe.contentWindow?.focus()
  iframe.contentWindow?.print()
  setTimeout(() => iframe.remove(), 60_000)
}

export async function downloadFloorPlanPng(elements: FloorElement[], assignments: SeatAssignment[], guests: Guest[], fileName: string) {
  const canvas = await renderFloorPlan(elements, assignments, guests)
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('Export impossible.')
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${fileName}.png`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

export async function printFloorPlan(elements: FloorElement[], assignments: SeatAssignment[], guests: Guest[], title: string) {
  const canvas = await renderFloorPlan(elements, assignments, guests)
  await printHtml(title, `<div class="plan"><img alt="" src="${canvas.toDataURL('image/png')}"></div>`, canvas.width >= canvas.height, true)
}

/** HTML de la liste « qui est assis où », table par table, puis les invités sans place. */
export function seatingListHtml(title: string, elements: FloorElement[], assignments: SeatAssignment[], guests: Guest[]): string {
  const tables = guestsByTable(elements, assignments, guests)
  const placedIds = new Set(assignments.map((a) => a.guestId))
  const unplaced = guests.filter((g) => !placedIds.has(g.id)).sort((a, b) => a.name.localeCompare(b.name, 'fr'))
  const blocks = tables.map(
    ({ table, guests: seated }) =>
      `<div class="table"><h2>${escapeHtml(table.label ?? 'Table')} <span class="empty">(${seated.length}/${table.seats ?? 0})</span></h2>` +
      (seated.length
        ? `<ol>${seated.map((g) => `<li>${escapeHtml(g.name)}${g.notes ? ` <span class="empty">— ${escapeHtml(g.notes)}</span>` : ''}</li>`).join('')}</ol>`
        : '<p class="empty">Personne pour l’instant</p>') +
      '</div>',
  )
  if (unplaced.length) {
    blocks.push(`<div class="table"><h2>Sans place (${unplaced.length})</h2><ol>${unplaced.map((g) => `<li>${escapeHtml(g.name)}</li>`).join('')}</ol></div>`)
  }
  return `<h1>${escapeHtml(title)}</h1><p class="sub">Plan de table — ${assignments.length} invité${assignments.length > 1 ? 's' : ''} placé${assignments.length > 1 ? 's' : ''}</p><div class="grid">${blocks.join('')}</div>`
}

export async function printSeatingList(title: string, elements: FloorElement[], assignments: SeatAssignment[], guests: Guest[]) {
  await printHtml(title, seatingListHtml(title, elements, assignments, guests), false)
}
