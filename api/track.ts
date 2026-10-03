import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { requireEnv } from './_lib/requireEnv.js'
import { checkRateLimit, getClientIp } from './_lib/rateLimit.js'

const supabaseAdmin = createClient(requireEnv('VITE_SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'))

/** Liste blanche : tout autre nom est ignoré, pour que personne ne puisse remplir la base avec n'importe quoi. */
const ALLOWED_EVENTS = new Set([
  'pageview',
  'CTA Click',
  'Demo Click',
  'Signup Submit',
  'Signup Success',
  'Checkout Start',
  'Payment Success',
  'Feature View',
  'Section View',
  'Time on Page',
  'Share Click',
  'FAQ Open',
])

const MAX_PROPS = 5

/**
 * Chemin sans paramètres ni identifiants : `/mariages/3f2a…/plan-salle` devient `/mariages/:id/plan-salle`.
 * Ainsi aucun identifiant d'une cliente ou d'un mariage n'est jamais enregistré.
 */
export function normalizePath(raw: unknown): string | null {
  if (typeof raw !== 'string' || !raw.startsWith('/')) return null
  const path = raw.split(/[?#]/)[0].slice(0, 120)
  const normalized = path
    .split('/')
    .map((segment) => (/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(segment) || /^[0-9a-z_-]{16,}$/i.test(segment) || /^\d+$/.test(segment) ? ':id' : segment))
    .join('/')
  return normalized || '/'
}

function cleanProps(raw: unknown): Record<string, string | number | boolean> {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return {}
  const out: Record<string, string | number | boolean> = {}
  for (const [key, value] of Object.entries(raw).slice(0, MAX_PROPS)) {
    if (!/^[a-z_]{1,30}$/.test(key)) continue
    if (typeof value === 'string') out[key] = value.slice(0, 60)
    else if (typeof value === 'number' && Number.isFinite(value)) out[key] = Math.round(value)
    else if (typeof value === 'boolean') out[key] = value
  }
  return out
}

/**
 * Mesure d'audience anonyme : enregistre un évènement (page vue, clic, section affichée, durée sur la page).
 * Ne stocke ni adresse IP, ni user-agent, ni identifiant de session, ni compte : seulement le nom de
 * l'évènement, le chemin nettoyé et quelques propriétés simples. L'IP ne sert qu'au limiteur de débit, jamais
 * à la table analytics_events. Réponse toujours 204, même si l'évènement est ignoré : l'appelant n'a rien à gérer.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Méthode non autorisée.' })
    return
  }

  const allowed = await checkRateLimit(supabaseAdmin, `track:${getClientIp(req)}`, { maxRequests: 120, windowSeconds: 60 })
  if (!allowed) {
    res.status(429).json({ error: 'Trop de requêtes.' })
    return
  }

  // navigator.sendBeacon envoie du texte brut : le corps arrive donc en chaîne, pas en objet.
  let body: unknown = req.body
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      res.status(204).end()
      return
    }
  }
  const { name, path, props } = (body ?? {}) as { name?: unknown; path?: unknown; props?: unknown }
  const cleanPath = normalizePath(path)
  if (typeof name !== 'string' || !ALLOWED_EVENTS.has(name) || !cleanPath) {
    res.status(204).end()
    return
  }

  const { error } = await supabaseAdmin.from('analytics_events').insert({ name, path: cleanPath, props: cleanProps(props) })
  if (error) console.error('Erreur enregistrement évènement :', error.message)
  res.status(204).end()
}
