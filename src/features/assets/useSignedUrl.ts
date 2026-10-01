import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ASSETS_BUCKET, SIGNED_URL_TTL_SECONDS } from '@/features/assets/assetStorage'

interface CachedUrl {
  url: string
  /** Horodatage (ms) à partir duquel on redemande un lien, 5 min avant l'expiration réelle. */
  refreshAt: number
}

/**
 * Cache module des liens signés : un moodboard de 40 images ne refait pas 40
 * appels à chaque rendu ni à chaque changement de page. Les demandes
 * simultanées pour le même fichier partagent une seule requête.
 */
const cache = new Map<string, CachedUrl>()
const inflight = new Map<string, Promise<string | null>>()

/** Réservé aux tests. */
export function clearSignedUrlCache() {
  cache.clear()
  inflight.clear()
}

export async function getSignedUrl(storagePath: string, now = Date.now()): Promise<string | null> {
  const cached = cache.get(storagePath)
  if (cached && cached.refreshAt > now) return cached.url
  const pending = inflight.get(storagePath)
  if (pending) return pending

  const request = (async () => {
    const { data, error } = await supabase.storage.from(ASSETS_BUCKET).createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS)
    inflight.delete(storagePath)
    if (error || !data?.signedUrl) return null
    cache.set(storagePath, { url: data.signedUrl, refreshAt: now + (SIGNED_URL_TTL_SECONDS - 5 * 60) * 1000 })
    return data.signedUrl
  })()
  inflight.set(storagePath, request)
  return request
}

/** Lien d'affichage d'une image privée ; `null` tant qu'il charge ou si le fichier est introuvable (hors ligne, supprimé…). */
export function useSignedUrl(storagePath: string | undefined): { url: string | null; failed: boolean } {
  const [state, setState] = useState<{ path?: string; url: string | null; failed: boolean }>({ url: null, failed: false })

  useEffect(() => {
    if (!storagePath) return
    let cancelled = false
    getSignedUrl(storagePath).then((url) => {
      if (!cancelled) setState({ path: storagePath, url, failed: url === null })
    })
    return () => {
      cancelled = true
    }
  }, [storagePath])

  // Un changement de chemin ne doit jamais afficher brièvement l'ancienne image.
  if (!storagePath || state.path !== storagePath) return { url: null, failed: false }
  return { url: state.url, failed: state.failed }
}
