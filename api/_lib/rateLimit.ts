import type { VercelRequest } from '@vercel/node'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Adresse IP du client, telle que transmise par le proxy Vercel — jamais
 * `req.socket.remoteAddress`, qui vaudrait l'IP interne de Vercel, pas
 * celle de la personne qui appelle.
 */
export function getClientIp(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for']
  const first = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0]
  return first?.trim() || 'unknown'
}

/**
 * Fail-open : si Supabase est indisponible, la requête passe plutôt que
 * d'être bloquée — une panne du limiteur ne doit jamais devenir une panne
 * du service lui-même. Le vrai rempart contre l'abus reste la vérification
 * d'identité (getVerifiedUser) et la liste blanche des prix, pas ce
 * compteur — voir api/_lib/README de sécurité si besoin de contexte.
 */
export async function checkRateLimit(
  supabaseAdmin: SupabaseClient,
  key: string,
  { maxRequests, windowSeconds }: { maxRequests: number; windowSeconds: number },
): Promise<boolean> {
  const { data, error } = await supabaseAdmin.rpc('check_rate_limit', {
    p_key: key,
    p_max_requests: maxRequests,
    p_window_seconds: windowSeconds,
  })
  if (error) {
    console.error('Erreur vérification rate limit :', error.message)
    return true
  }
  return data === true
}
