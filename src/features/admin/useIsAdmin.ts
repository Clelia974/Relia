import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

/** Mémorisé pour la session : une seule vérification serveur, pas une par écran. */
let cached: boolean | null = null

/**
 * Vrai seulement si le serveur reconnaît l'adresse de la personne connectée comme administratrice
 * (api/admin/kpis.ts?check=1). Sert uniquement à AFFICHER le lien « Tableau de bord » : la vraie protection
 * est côté serveur, une cliente qui ouvre /admin à la main reçoit « Accès réservé ».
 */
export function useIsAdmin(): boolean {
  const [isAdmin, setIsAdmin] = useState(cached ?? false)

  useEffect(() => {
    if (cached !== null) return
    let cancelled = false
    ;(async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session) return
        const response = await fetch('/api/admin/kpis?check=1', { headers: { Authorization: `Bearer ${session.access_token}` } })
        cached = response.ok
        if (!cancelled) setIsAdmin(response.ok)
      } catch {
        // Réseau indisponible : le lien reste simplement caché.
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return isAdmin
}
