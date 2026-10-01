import { useRef, useState } from 'react'
import { ImageOff, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { deleteImageAssets, uploadImageAsset } from '@/features/assets/assetStorage'
import { useSignedUrl } from '@/features/assets/useSignedUrl'
import { useAuth } from '@/hooks/useAuth'
import { useWorkspaceStore } from '@/store/workspaceStore'
import type { ClosingSession } from '@/types/entities'

const MAX_IMAGES = 5
/** Taille du fichier d'origine acceptée — il est ensuite réduit dans le navigateur avant l'envoi (cf. imageResize.ts). */
const MAX_SOURCE_SIZE = 25 * 1024 * 1024

type PortfolioImage = ClosingSession['portfolioImages'][number]

/** Vignette : image du stockage privé (lien signé) ou, pour les anciennes images, base64. */
function PortfolioThumb({ image }: { image: PortfolioImage }) {
  const { url, failed } = useSignedUrl(image.storagePath)
  const src = image.storagePath ? url : image.dataUrl
  if (failed) {
    return (
      <div className="flex h-40 w-full items-center justify-center bg-muted text-muted-foreground">
        <ImageOff className="size-5" aria-label="Image indisponible (hors ligne ?)" />
      </div>
    )
  }
  if (!src) return <div className="h-40 w-full animate-pulse bg-muted" aria-hidden="true" />
  return <img src={src} alt={image.caption ?? ''} className="h-40 w-full object-cover" />
}

interface ClosingPortfolioProps {
  weddingId: string
  closing: ClosingSession
}

/** Portfolio avant/après — images dans le bucket privé "inspirations", jamais en base64 dans le localStorage. */
export function ClosingPortfolio({ weddingId, closing }: ClosingPortfolioProps) {
  const { user } = useAuth()
  const addPortfolioImage = useWorkspaceStore((s) => s.addPortfolioImage)
  const removePortfolioImage = useWorkspaceStore((s) => s.removePortfolioImage)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [caption, setCaption] = useState('')

  const images = closing.portfolioImages
  const canAddMore = images.length < MAX_IMAGES
  const [isUploading, setIsUploading] = useState(false)

  const handleFileChosen = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !user) return
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez choisir un fichier image.')
      return
    }
    if (file.size > MAX_SOURCE_SIZE) {
      toast.error('Cette image est trop lourde (25 Mo maximum).')
      return
    }
    setIsUploading(true)
    try {
      const asset = await uploadImageAsset(user.id, weddingId, file)
      addPortfolioImage(weddingId, asset.storagePath, caption.trim() || undefined)
      setCaption('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'L’image n’a pas pu être envoyée.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemove = (image: PortfolioImage) => {
    removePortfolioImage(weddingId, image.id)
    if (image.storagePath) void deleteImageAssets([image.storagePath])
  }

  return (
    <div className="flex flex-col gap-4">
      {canAddMore ? (
        <div className="flex flex-col gap-2 rounded-lg border border-dashed border-border p-4">
          <p className="text-sm font-medium text-foreground">Ajouter une image ({images.length}/{MAX_IMAGES})</p>
          <Input placeholder="Légende (facultatif)" value={caption} onChange={(e) => setCaption(e.target.value)} />
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChosen} className="hidden" />
          <Button type="button" variant="outline" loading={isUploading} onClick={() => fileInputRef.current?.click()} className="w-fit">
            Choisir une image
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Limite de {MAX_IMAGES} images atteinte.</p>
      )}

      {images.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-6 py-8 text-center text-sm text-muted-foreground">
          Aucune image pour l'instant.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((img) => (
            <div key={img.id} className="flex flex-col gap-2 overflow-hidden rounded-lg border border-border bg-card">
              <PortfolioThumb image={img} />
              <div className="flex items-center justify-between gap-2 px-3 pb-3">
                <p className="truncate text-sm text-foreground">{img.caption || '—'}</p>
                <Button type="button" size="sm" variant="ghost" onClick={() => handleRemove(img)} aria-label="Supprimer l'image">
                  <Trash2 className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
