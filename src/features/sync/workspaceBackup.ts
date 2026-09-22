import { migrateWorkspace } from '@/lib/workspace/migrate'
import { supabase } from '@/lib/supabase'
import type { Workspace } from '@/types/entities'

interface FetchWorkspaceBackupResult {
  found: boolean
  workspace: Workspace | null
}

/**
 * Lit la sauvegarde cloud de l'utilisateur — `found: false` signale
 * l'absence normale de sauvegarde (jamais synchronisé depuis un autre
 * appareil), jamais confondue avec une erreur. Les données lues sont
 * validées/migrées via `migrateWorkspace` — même garde-fou que l'import
 * de fichier JSON dans /parametres, jamais de confiance aveugle même
 * envers nos propres données stockées.
 */
export async function fetchWorkspaceBackup(userId: string): Promise<FetchWorkspaceBackupResult> {
  const { data, error } = await supabase.from('workspace_backups').select('data').eq('user_id', userId).maybeSingle()
  if (error) throw error
  if (!data) return { found: false, workspace: null }

  const result = migrateWorkspace(data.data)
  if (!result.ok) throw new Error(`Sauvegarde cloud illisible : ${result.reason}`)
  return { found: true, workspace: result.workspace }
}

/**
 * Remplace la sauvegarde cloud de l'utilisateur par l'espace de travail
 * local actuel — `user_id` est la clé primaire de `workspace_backups`,
 * l'upsert cible donc naturellement la bonne ligne sans préciser
 * `onConflict`.
 */
export async function pushWorkspaceBackup(userId: string, workspace: Workspace): Promise<void> {
  const { error } = await supabase
    .from('workspace_backups')
    .upsert({ user_id: userId, data: workspace, synced_at: new Date().toISOString() })
  if (error) throw error
}
