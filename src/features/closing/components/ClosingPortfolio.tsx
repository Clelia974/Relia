import { useRef, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { readFileAsDataUrl } from '@/lib/readFileAsDataUrl'
import { useWorkspaceStore } from '@/store/workspaceStore'
import type { ClosingSession } from '@/types/entities'

const MAX_IMAGES = 5
const MAX_IMAGE_SIZE = 500 * 1024

interface ClosingPortfolioProps {
  weddingId: string
  closing: ClosingSession
}

/** Portfolio avant/après — data URL en LocalStorage uniquement, jamais de dépendance cloud (cf. Phase 5, hors périmètre volontaire). */
export function ClosingPortfolio({ weddingId, closing }: ClosingPortfolioProps) {
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
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez choisir un fichier image.')
      return
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error('Cette image doit faire moins de 500 Ko.')
      return
    }
    setIsUploading(true)
    try {
      const dataUrl = await readFileAsDataUrl(file)
      addPortfolioImage(weddingId, dataUrl, caption.trim() || undefined)
      setCaption('')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {canAddMore ? (
        <div className="flex flex-col gap-2 rounded-lg border border-dashed border-border p-4">
          <p className="text-sm font-medium text-foreground">Ajouter une image ({images.length}/{MAX_IMAGES})</p>
          <Input
            placeholder="Légende (facultatif)"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChosen} className="hidden" />
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
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((img) => (
            <div key={img.id} className="flex flex-col gap-2 overflow-hidden rounded-lg border border-border bg-card">
              <img src={img.dataUrl} alt={img.caption ?? ''} className="h-40 w-full object-cover" />
              <div className="flex items-center justify-between gap-2 px-3 pb-3">
                <p className="truncate text-sm text-foreground">{img.caption || '—'}</p>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => removePortfolioImage(weddingId, img.id)}
                  aria-label="Supprimer l'image"
                >
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
