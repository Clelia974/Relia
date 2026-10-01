/** Côté le plus long d'une image envoyée — largement assez pour un moodboard plein écran, sans gaspiller de stockage. */
export const MAX_IMAGE_EDGE = 2000

/** Dimensions réduites proportionnellement pour tenir dans un carré `max × max` — jamais agrandies. */
export function fitWithin(width: number, height: number, max = MAX_IMAGE_EDGE): { width: number; height: number } {
  if (width <= max && height <= max) return { width, height }
  const ratio = width >= height ? max / width : max / height
  return { width: Math.round(width * ratio), height: Math.round(height * ratio) }
}

export interface ResizedImage {
  blob: Blob
  width: number
  height: number
  /** Type réellement produit — PNG conservé (transparence possible : fleurs détourées, matières…), sinon JPEG. */
  type: 'image/jpeg' | 'image/png'
}

/**
 * Réduit une image dans le navigateur avant l'envoi : une photo de téléphone
 * (souvent 4 000 px, 5 Mo) devient ~300 Ko sans perte visible à l'écran.
 * Aucune librairie : createImageBitmap + canvas, disponibles partout.
 */
export async function resizeImageFile(file: File, max = MAX_IMAGE_EDGE, quality = 0.85): Promise<ResizedImage> {
  const bitmap = await createImageBitmap(file)
  try {
    const { width, height } = fitWithin(bitmap.width, bitmap.height, max)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Impossible de préparer l’image dans ce navigateur.')
    ctx.drawImage(bitmap, 0, 0, width, height)
    const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Impossible de préparer l’image.'))), type, quality),
    )
    return { blob, width, height, type }
  } finally {
    bitmap.close()
  }
}
