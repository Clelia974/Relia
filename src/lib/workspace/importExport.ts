import { format } from 'date-fns'
import { migrateWorkspace, type MigrationResult } from '@/lib/workspace/migrate'
import type { Workspace } from '@/types/entities'

export function exportWorkspaceToFile(workspace: Workspace): void {
  const filename = `relia-backup-${format(new Date(), 'yyyy-MM-dd')}.json`
  const blob = new Blob([JSON.stringify(workspace, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/** Exporte tel quel un contenu localStorage illisible (JSON invalide ou rejeté par le schéma) — jamais retravaillé, pour permettre une récupération manuelle a posteriori. */
export function exportRawBackupToFile(raw: string): void {
  const filename = `relia-sauvegarde-recuperation-${format(new Date(), 'yyyy-MM-dd-HHmm')}.json`
  const blob = new Blob([raw], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export async function parseWorkspaceFile(file: File): Promise<MigrationResult> {
  let text: string
  try {
    text = await file.text()
  } catch {
    return { ok: false, reason: 'Impossible de lire le fichier.' }
  }

  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { ok: false, reason: "Ce n'est pas un fichier JSON valide." }
  }

  return migrateWorkspace(raw)
}
