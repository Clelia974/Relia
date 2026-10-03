import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { requireEnv } from '../_lib/requireEnv.js'
import { checkRateLimit, getClientIp } from '../_lib/rateLimit.js'
import { computeEventKpis, computeUserKpis, type EventRow, type UserRow } from '../_lib/kpis.js'

const supabaseAdmin = createClient(requireEnv('VITE_SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'))

/** Adresses autorisées à ouvrir le tableau de bord. `ADMIN_EMAILS` (liste séparée par des virgules) remplace cette valeur par défaut. */
const DEFAULT_ADMIN_EMAILS = 'cleliadrouman@gmail.com'
const adminEmails = () =>
  (process.env.ADMIN_EMAILS ?? DEFAULT_ADMIN_EMAILS)
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)

const RETENTION_MONTHS = 13
const PAGE = 1000
const MAX_ROWS = 50_000

/** Vérifie le jeton de session ET que l'adresse est celle d'une administratrice — jamais un champ envoyé par le client. */
async function getVerifiedAdmin(req: VercelRequest): Promise<{ status: 401 | 403 | 200 }> {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return { status: 401 }
  const { data, error } = await supabaseAdmin.auth.getUser(header.slice('Bearer '.length))
  if (error || !data.user?.email) return { status: 401 }
  return { status: adminEmails().includes(data.user.email.toLowerCase()) ? 200 : 403 }
}

async function fetchEvents(sinceIso: string): Promise<EventRow[]> {
  const rows: EventRow[] = []
  for (let from = 0; from < MAX_ROWS; from += PAGE) {
    const { data, error } = await supabaseAdmin
      .from('analytics_events')
      .select('name, path, props, created_at')
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: false })
      .range(from, from + PAGE - 1)
    if (error) throw error
    rows.push(...(data as EventRow[]))
    if (!data || data.length < PAGE) break
  }
  return rows
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Méthode non autorisée.' })
    return
  }

  const allowed = await checkRateLimit(supabaseAdmin, `admin-kpis:${getClientIp(req)}`, { maxRequests: 30, windowSeconds: 60 })
  if (!allowed) {
    res.status(429).json({ error: 'Trop de requêtes — réessayez dans une minute.' })
    return
  }

  const { status } = await getVerifiedAdmin(req)
  if (status === 401) {
    res.status(401).json({ error: 'Session invalide ou expirée.' })
    return
  }
  if (status === 403) {
    res.status(403).json({ error: 'Accès réservé.' })
    return
  }

  // Vérification légère (sert à afficher le lien « Tableau de bord » dans le menu) : aucune requête de données.
  if (req.query?.check === '1') {
    res.status(200).json({ admin: true })
    return
  }

  try {
    const now = new Date()

    // Conservation limitée à 13 mois : purge à chaque ouverture du tableau de bord.
    const cutoff = new Date(now)
    cutoff.setMonth(cutoff.getMonth() - RETENTION_MONTHS)
    const { error: purgeError } = await supabaseAdmin.from('analytics_events').delete().lt('created_at', cutoff.toISOString())
    if (purgeError) console.error('Erreur purge des évènements :', purgeError.message)

    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('email, subscription_status, created_at, trial_end_date, subscribed_at, cancelled_at, billing_interval, is_launch_offer')
      .limit(MAX_ROWS)
    if (usersError) throw usersError

    const { data: counter } = await supabaseAdmin.from('launch_offer_counter').select('redeemed_count').eq('id', 1).maybeSingle()
    const events = await fetchEvents(new Date(now.getTime() - 30 * 86_400_000).toISOString())

    res.setHeader('Cache-Control', 'private, no-store')
    res.status(200).json({
      generatedAt: now.toISOString(),
      users: computeUserKpis((users ?? []) as UserRow[], now, counter?.redeemed_count ?? 0),
      events: computeEventKpis(events),
    })
  } catch (err) {
    // Les erreurs Supabase sont des objets simples (pas des Error) : on lit leur message pour le journal.
    const detail = err instanceof Error ? err.message : typeof err === 'object' && err !== null && 'message' in err ? String((err as { message: unknown }).message) : 'inconnue'
    console.error('Erreur calcul des indicateurs :', detail)
    // Détail renvoyé seulement ici : la personne a déjà été vérifiée comme administratrice.
    res.status(500).json({ error: 'Erreur interne.', detail })
  }
}
