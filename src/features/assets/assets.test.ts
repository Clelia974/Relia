import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createSignedUrl } = vi.hoisted(() => ({ createSignedUrl: vi.fn() }))
vi.mock('@/lib/supabase', () => ({
  supabase: { storage: { from: () => ({ createSignedUrl }) } },
}))

import { buildAssetPath } from '@/features/assets/assetStorage'
import { fitWithin } from '@/features/assets/imageResize'
import { clearSignedUrlCache, getSignedUrl } from '@/features/assets/useSignedUrl'

describe('fitWithin', () => {
  it('ne touche pas une image déjà assez petite', () => {
    expect(fitWithin(1200, 800, 2000)).toEqual({ width: 1200, height: 800 })
  })
  it('réduit une photo paysage en gardant ses proportions', () => {
    expect(fitWithin(4000, 3000, 2000)).toEqual({ width: 2000, height: 1500 })
  })
  it('réduit une photo portrait sur son côté le plus long', () => {
    expect(fitWithin(3024, 4032, 2000)).toEqual({ width: 1500, height: 2000 })
  })
})

describe('buildAssetPath', () => {
  it('commence toujours par le dossier de l’utilisatrice (exigé par la policy du bucket)', () => {
    expect(buildAssetPath('u1', 'w1', 'a1', 'image/jpeg')).toBe('u1/w1/a1.jpg')
    expect(buildAssetPath('u1', 'w1', 'a1', 'image/png')).toBe('u1/w1/a1.png')
  })
})

describe('getSignedUrl', () => {
  beforeEach(() => {
    clearSignedUrlCache()
    createSignedUrl.mockReset()
  })

  it('met en cache le lien : un deuxième affichage ne refait pas d’appel', async () => {
    createSignedUrl.mockResolvedValue({ data: { signedUrl: 'https://x/a.jpg?token=1' }, error: null })
    expect(await getSignedUrl('u1/w1/a.jpg', 0)).toBe('https://x/a.jpg?token=1')
    expect(await getSignedUrl('u1/w1/a.jpg', 1000)).toBe('https://x/a.jpg?token=1')
    expect(createSignedUrl).toHaveBeenCalledTimes(1)
  })

  it('redemande un lien avant son expiration', async () => {
    createSignedUrl.mockResolvedValueOnce({ data: { signedUrl: 'old' }, error: null }).mockResolvedValueOnce({ data: { signedUrl: 'new' }, error: null })
    await getSignedUrl('u1/w1/a.jpg', 0)
    expect(await getSignedUrl('u1/w1/a.jpg', 56 * 60 * 1000)).toBe('new')
  })

  it('renvoie null (sans planter) si le fichier est introuvable', async () => {
    createSignedUrl.mockResolvedValue({ data: null, error: new Error('not found') })
    expect(await getSignedUrl('u1/w1/absent.jpg')).toBeNull()
  })
})
