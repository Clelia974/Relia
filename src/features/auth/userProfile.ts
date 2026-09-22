import { supabase } from '@/lib/supabase'

export type SubscriptionStatus = 'trial' | 'active' | 'cancelled'

/** Reflète exactement public.users (cf. supabase/sql/001_create_users_table.sql) — jamais de colonne ici sans son équivalent SQL, et vice-versa. */
export interface UserProfile {
  id: string
  email: string
  trialEndDate: string
  subscriptionStatus: SubscriptionStatus
  createdAt: string
  updatedAt: string
}

interface UserProfileRow {
  id: string
  email: string
  trial_end_date: string
  subscription_status: SubscriptionStatus
  created_at: string
  updated_at: string
}

function fromRow(row: UserProfileRow): UserProfile {
  return {
    id: row.id,
    email: row.email,
    trialEndDate: row.trial_end_date,
    subscriptionStatus: row.subscription_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * Lit le profil (trial/abonnement) de l'utilisateur connecté. La ligne est
 * censée exister — créée automatiquement par le trigger
 * `on_auth_user_created` à l'inscription (cf. le SQL), jamais par le
 * client : aucune policy INSERT n'existe côté `authenticated`, une
 * tentative d'écriture ici échouerait contre RLS. `null` signale une
 * absence anormale (trigger n'a pas tourné, compte antérieur à la
 * migration) plutôt qu'un état à corriger silencieusement.
 */
export async function fetchOwnUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase.from('users').select('*').eq('id', userId).maybeSingle()
  if (error) throw error
  return data ? fromRow(data as UserProfileRow) : null
}
