import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
/** Clé publique ("publishable", nouveau format Supabase — remplace l'ancienne clé anon JWT) : volontairement exposée côté client, jamais la clé service_role. */
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Variables Supabase manquantes (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) — renseignez .env.local.',
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
