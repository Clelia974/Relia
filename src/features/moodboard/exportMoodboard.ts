import { getSignedUrl } from '@/features/assets/useSignedUrl'
import { DEFAULT_NOTE_COLOR, readableTextOn } from '@/features/moodboard/colors'
import { boundsOf } from '@/features/moodboard/geometry'
import type { MoodboardItem } from '@/types/entities'

/**
 * Export d'un moodboard en image : on redessine chaque élément sur un canvas
 * (même rendu que MoodboardItemView), plutôt que de « photographier » le DOM —
 * aucune librairie, et les images privées sont chargées via leur lien signé
 * (le stockage Supabase autorise le CORS, donc le canvas reste exportable).
 */

const PADDING = 48
/** Netteté de l'export : 2 px réels par px du moodboard (lisible imprimé en A4). */
const PIXEL_RATIO = 2
/** Côté le plus long maximum du fichier produit — les navigateurs refusent les canvas géants. */
const MAX_EDGE = 6000
const HEADING_FONT = "'Source Serif 4', Georgia, serif"
const MONO_FONT = 'ui-monospace, SFMono-Regular, Menlo, monospace'
const BACKGROUND = '#FFFFFF'

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

function roundedRect(ctx: CanvasRenderingContext2D, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.roundRect(0, 0, w, h, Math.min(r, w / 2, h / 2))
}

function withShadow(ctx: CanvasRenderingContext2D, draw: () => void) {
  ctx.save()
  ctx.shadowColor = 'rgba(31, 45, 61, 0.22)'
  ctx.shadowBlur = 24
  ctx.shadowOffsetY = 8
  draw()
  ctx.restore()
}

/** Découpe un texte en lignes qui tiennent dans `maxWidth` (retours à la ligne manuels respectés). */
export function wrapText(measure: (s: string) => number, text: string, maxWidth: number): string[] {
  const lines: string[] = []
  for (const paragraph of text.split('\n')) {
    let line = ''
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word
      if (line && measure(candidate) > maxWidth) {
        lines.push(line)
        line = word
      } else {
        line = candidate
      }
    }
    lines.push(line)
  }
  return lines
}

function drawItem(ctx: CanvasRenderingContext2D, item: MoodboardItem, image: HTMLImageElement | null | undefined) {
  const { w, h } = item
  switch (item.kind) {
    case 'image': {
      withShadow(ctx, () => {
        roundedRect(ctx, w, h, 6)
        ctx.fillStyle = '#EEF0F3'
        ctx.fill()
      })
      if (image) {
        // object-fit: cover
        const scale = Math.max(w / image.naturalWidth, h / image.naturalHeight)
        const sw = w / scale
        const sh = h / scale
        ctx.save()
        roundedRect(ctx, w, h, 6)
        ctx.clip()
        ctx.drawImage(image, (image.naturalWidth - sw) / 2, (image.naturalHeight - sh) / 2, sw, sh, 0, 0, w, h)
        ctx.restore()
      }
      return
    }
    case 'couleur': {
      const color = item.color ?? '#A9B08F'
      const labelH = 22
      withShadow(ctx, () => {
        roundedRect(ctx, w, h, 10)
        ctx.fillStyle = '#FFFFFF'
        ctx.fill()
      })
      ctx.save()
      roundedRect(ctx, w, h, 10)
      ctx.clip()
      ctx.fillStyle = color
      ctx.fillRect(0, 0, w, Math.max(0, h - labelH))
      ctx.restore()
      ctx.fillStyle = 'rgba(44, 44, 44, 0.7)'
      ctx.font = `11px ${MONO_FONT}`
      ctx.textBaseline = 'middle'
      ctx.fillText(item.text || color, 8, h - labelH / 2, w - 16)
      return
    }
    case 'matiere': {
      const color = item.color ?? DEFAULT_NOTE_COLOR
      withShadow(ctx, () => {
        roundedRect(ctx, w, h, Math.min(w, h) / 2)
        ctx.fillStyle = color
        ctx.fill()
      })
      ctx.fillStyle = readableTextOn(color)
      ctx.font = `italic 15px ${HEADING_FONT}`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'bottom'
      ctx.fillText(item.text || 'Matière', w / 2, h - h * 0.12, w * 0.76)
      ctx.textAlign = 'start'
      return
    }
    case 'texte':
    default: {
      if (item.color) {
        withShadow(ctx, () => {
          roundedRect(ctx, w, h, 6)
          ctx.fillStyle = item.color as string
          ctx.fill()
        })
      }
      const pad = w * 0.06
      const fontSize = 20
      const lineHeight = fontSize * 1.375
      ctx.fillStyle = item.color ? readableTextOn(item.color) : '#2C2C2C'
      ctx.font = `${fontSize}px ${HEADING_FONT}`
      ctx.textBaseline = 'top'
      const lines = wrapText((s) => ctx.measureText(s).width, item.text || 'Texte', w - pad * 2)
      const top = Math.max(pad, (h - lines.length * lineHeight) / 2)
      lines.forEach((line, i) => ctx.fillText(line, pad, top + i * lineHeight))
      return
    }
  }
}

/** Dessine tout le moodboard (recadré sur son contenu) et renvoie le canvas. */
export async function renderMoodboard(items: MoodboardItem[]): Promise<HTMLCanvasElement> {
  await document.fonts?.ready
  const bounds = boundsOf(items)
  const width = bounds.w + PADDING * 2
  const height = bounds.h + PADDING * 2
  const ratio = Math.min(PIXEL_RATIO, MAX_EDGE / Math.max(width, height))

  const images = new Map<string, HTMLImageElement | null>()
  await Promise.all(
    items
      .filter((i) => i.kind === 'image' && i.storagePath)
      .map(async (i) => {
        const url = await getSignedUrl(i.storagePath as string)
        images.set(i.id, url ? await loadImage(url) : null)
      }),
  )

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(width * ratio)
  canvas.height = Math.round(height * ratio)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Export impossible dans ce navigateur.')
  ctx.scale(ratio, ratio)
  ctx.fillStyle = BACKGROUND
  ctx.fillRect(0, 0, width, height)

  for (const item of [...items].sort((a, b) => a.z - b.z)) {
    ctx.save()
    ctx.translate(item.x - bounds.x + PADDING + item.w / 2, item.y - bounds.y + PADDING + item.h / 2)
    ctx.rotate((item.rotation * Math.PI) / 180)
    ctx.translate(-item.w / 2, -item.h / 2)
    drawItem(ctx, item, images.get(item.id))
    ctx.restore()
  }
  return canvas
}

/** Nom de fichier sans accents ni caractères spéciaux : « Camille & Antoine — Cérémonie » → « camille-antoine-ceremonie ». */
export function exportFileName(...parts: string[]): string {
  return (
    parts
      .join(' ')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'moodboard'
  )
}

export async function downloadMoodboardPng(items: MoodboardItem[], fileName: string): Promise<void> {
  const canvas = await renderMoodboard(items)
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('Export impossible.')
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${fileName}.png`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

/**
 * PDF : on passe par l'impression du navigateur (« Enregistrer au format
 * PDF »), dans une iframe cachée qui ne contient que l'image — même
 * principe que les autres documents imprimables de l'app, sans librairie PDF.
 */
export async function printMoodboard(items: MoodboardItem[], title: string): Promise<void> {
  const canvas = await renderMoodboard(items)
  const landscape = canvas.width >= canvas.height
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
    `<!doctype html><html><head><meta charset="utf-8"><title></title><style>` +
      `@page{size:A4 ${landscape ? 'landscape' : 'portrait'};margin:12mm}` +
      `html,body{margin:0;height:100%}body{display:flex;align-items:center;justify-content:center}` +
      `img{max-width:100%;max-height:100%;object-fit:contain}</style></head>` +
      `<body><img alt=""></body></html>`,
  )
  doc.close()
  doc.title = title
  const img = doc.querySelector('img') as HTMLImageElement
  await new Promise<void>((resolve) => {
    img.onload = () => resolve()
    img.src = canvas.toDataURL('image/png')
  })
  iframe.contentWindow?.focus()
  iframe.contentWindow?.print()
  setTimeout(() => iframe.remove(), 60_000)
}
