import { generateId } from '@/lib/id'
import { supabase } from '@/lib/supabase'
import { resizeImageFile } from '@/features/assets/imageResize'

/**
 * Bucket Supabase PRIVÉ des images (moodboards, portfolio de clôture) — cf.
 * supabase/sql/014_inspirations_bucket.sql. Jamais d'image en base64 dans le
 * localStorage : il est limité à ~5 Mo pour tout l'espace de travail.
 */
export const ASSETS_BUCKET = 'inspirations'

/** Durée de validité d'un lien d'affichage — renouvelé automatiquement avant expiration (cf. useSignedUrl). */
export const SIGNED_URL_TTL_SECONDS = 60 * 60

/** <user id>/<mariage id>/<image id>.<ext> — le 1er dossier DOIT être l'user id (policy RLS du bucket). */
export function buildAssetPath(userId: string, weddingId: string, assetId: string, type: string): string {
  const ext = type === 'image/png' ? 'png' : 'jpg'
  return `${userId}/${weddingId}/${assetId}.${ext}`
}

export interface UploadedAsset {
  id: string
  storagePath: string
  width: number
  height: number
}

/** Réduit puis envoie une image dans le dossier de l'utilisatrice. */
export async function uploadImageAsset(userId: string, weddingId: string, file: File): Promise<UploadedAsset> {
  if (!file.type.startsWith('image/')) throw new Error('Ce fichier n’est pas une image.')
  const resized = await resizeImageFile(file)
  const id = generateId()
  const storagePath = buildAssetPath(userId, weddingId, id, resized.type)
  const { error } = await supabase.storage.from(ASSETS_BUCKET).upload(storagePath, resized.blob, { contentType: resized.type })
  if (error) throw new Error('L’image n’a pas pu être envoyée. Vérifie ta connexion et réessaie.')
  return { id, storagePath, width: resized.width, height: resized.height }
}

/**
 * Supprime des fichiers du stockage — best effort : un échec réseau ne doit
 * jamais bloquer la suppression côté app (le fichier orphelin reste privé,
 * dans le dossier de l'utilisatrice).
 */
export async function deleteImageAssets(storagePaths: string[]): Promise<void> {
  if (storagePaths.length === 0) return
  try {
    await supabase.storage.from(ASSETS_BUCKET).remove(storagePaths)
  } catch {
    // volontairement silencieux, cf. ci-dessus
  }
}
