import { supabase } from '@/lib/supabase'
import { ACTIVE_LEAD_STATUSES, LeadSchema, type Lead, type LeadStatusSchema } from '@/schemas/lead'
import type { z } from 'zod'

/** RLS restreint déjà aux lignes de l'utilisatrice connectée (leads_owner_select) — pas de filtre user_id explicite nécessaire ici. */
export async function fetchActiveLeads(): Promise<Lead[]> {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .in('status', ACTIVE_LEAD_STATUSES)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((row) => LeadSchema.parse(row))
}

/** Une demande précise (fiche client pour construire un devis) — RLS restreint déjà au propriétaire. */
export async function fetchLead(leadId: string): Promise<Lead | null> {
  const { data, error } = await supabase.from('leads').select('*').eq('id', leadId).maybeSingle()
  if (error) throw error
  return data ? LeadSchema.parse(data) : null
}

export async function markLeadStatus(leadId: string, status: z.infer<typeof LeadStatusSchema>): Promise<void> {
  const { error } = await supabase.from('leads').update({ status }).eq('id', leadId)
  if (error) throw error
}

/** `head: true` : ne récupère que le total (`count`), jamais les lignes elles-mêmes — juste pour le badge de navigation. Uniquement "nouveau" (jamais encore ouvertes) — pas les demandes déjà en négociation. */
export async function countNewLeads(): Promise<number> {
  const { count, error } = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'nouveau')
  if (error) throw error
  return count ?? 0
}
