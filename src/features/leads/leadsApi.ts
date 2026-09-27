import { supabase } from '@/lib/supabase'
import { LeadSchema, type Lead } from '@/schemas/lead'

/** RLS restreint déjà aux lignes de l'utilisatrice connectée (leads_owner_select) — pas de filtre user_id explicite nécessaire ici. */
export async function fetchNewLeads(): Promise<Lead[]> {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('status', 'nouveau')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((row) => LeadSchema.parse(row))
}

export async function markLeadStatus(leadId: string, status: 'importe' | 'ignore'): Promise<void> {
  const { error } = await supabase.from('leads').update({ status }).eq('id', leadId)
  if (error) throw error
}
