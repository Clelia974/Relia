import type { PersistStorage, StorageValue } from 'zustand/middleware'

/**
 * Couche de résilience autour de localStorage pour le store d'espace de
 * travail (Phase 0 — sécurisation pré-bêta). Objectifs :
 *  - ne jamais laisser une exception de lecture/écriture se propager
 *    (localStorage indisponible, quota dépassé, JSON corrompu) ;
 *  - ne jamais perdre silencieusement la dernière donnée persistée : un
 *    contenu illisible est sauvegardé sous une clé de secours distincte
 *    AVANT d'être traité comme "absent" par le store.
 *
 * Ce module ne connaît rien du modèle métier (Workspace) : il manipule des
 * chaînes et des objets opaques, la validation/migration reste entièrement
 * dans src/lib/workspace/migrate.ts.
 */

const RECOVERY_KEY_PREFIX = 'relia-workspace-recovery-'

/** Callbacks fournis par le store pour réagir aux incidents de stockage sans coupler ce module à zustand. */
export interface SafeStorageCallbacks {
  /** Le contenu persisté existait mais n'était pas du JSON valide. `raw` est la chaîne d'origine, déjà sauvegardée sous une clé de secours. */
  onReadCorrupted: (raw: string) => void
  /** localStorage n'a pas pu être lu du tout (accès bloqué par le navigateur). */
  onReadUnavailable: () => void
  /** Une écriture a échoué (quota dépassé, accès bloqué, etc.). */
  onWriteError: (message: string) => void
  /** Une écriture a réussi — permet d'effacer un message d'erreur affiché précédemment. */
  onWriteSuccess: () => void
}

function isQuotaExceededError(error: unknown): boolean {
  if (!(error instanceof DOMException)) return false
  return (
    error.name === 'QuotaExceededError' ||
    error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    error.code === 22 ||
    error.code === 1014
  )
}

/** Sauvegarde best-effort d'un contenu illisible sous une clé horodatée distincte, pour ne jamais perdre la donnée d'origine. Échoue silencieusement si le stockage est lui-même hors service : ce n'est qu'un filet, jamais un point de blocage. */
export function backupRawWorkspace(raw: string): void {
  try {
    window.localStorage.setItem(`${RECOVERY_KEY_PREFIX}${Date.now()}`, raw)
  } catch {
    // Rien de plus à faire : le stockage est indisponible ou plein, la
    // sauvegarde de secours reste au moins visible via l'export manuel
    // proposé à l'utilisatrice (corruptedBackupRaw en mémoire).
  }
}

/**
 * Implémente PersistStorage à la main (plutôt que createJSONStorage) pour
 * pouvoir distinguer "aucune donnée persistée" (première visite) de "donnée
 * présente mais illisible" (corruption) — createJSONStorage ne fait pas
 * cette distinction et laisserait zustand basculer silencieusement sur un
 * espace vide sans jamais le signaler à l'appelant.
 */
export function createSafeWorkspaceStorage(callbacks: SafeStorageCallbacks): PersistStorage<unknown> {
  return {
    getItem: (name) => {
      let raw: string | null
      try {
        raw = window.localStorage.getItem(name)
      } catch {
        callbacks.onReadUnavailable()
        return null
      }
      if (raw === null) return null

      try {
        return JSON.parse(raw) as StorageValue<unknown>
      } catch {
        backupRawWorkspace(raw)
        callbacks.onReadCorrupted(raw)
        return null
      }
    },
    setItem: (name, value) => {
      try {
        window.localStorage.setItem(name, JSON.stringify(value))
        callbacks.onWriteSuccess()
      } catch (error) {
        callbacks.onWriteError(
          isQuotaExceededError(error)
            ? "Vos modifications n'ont pas pu être sauvegardées (espace de stockage insuffisant)."
            : "Vos modifications n'ont pas pu être sauvegardées.",
        )
      }
    },
    removeItem: (name) => {
      try {
        window.localStorage.removeItem(name)
      } catch {
        // Suppression best-effort : sans conséquence si elle échoue.
      }
    },
  }
}
