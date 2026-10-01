import { ImageOff } from 'lucide-react'
import { useSignedUrl } from '@/features/assets/useSignedUrl'
import { DEFAULT_NOTE_COLOR, readableTextOn } from '@/features/moodboard/colors'
import { cn } from '@/lib/utils'
import type { MoodboardItem } from '@/types/entities'

function ImageContent({ storagePath }: { storagePath?: string }) {
  const { url, failed } = useSignedUrl(storagePath)
  if (failed || !storagePath) {
    return (
      <div className="flex size-full items-center justify-center bg-muted text-muted-foreground">
        <ImageOff className="size-6" aria-label="Image indisponible" />
      </div>
    )
  }
  if (!url) return <div className="size-full animate-pulse bg-muted" aria-hidden="true" />
  return <img src={url} alt="" draggable={false} className="pointer-events-none size-full select-none object-cover" />
}

/**
 * Contenu d'un élément, qui remplit toute sa boîte (la position/taille/
 * rotation sont gérées par le conteneur : éditeur ou vignette). `scale` permet
 * à la vignette de réduire aussi la taille du texte.
 */
export function MoodboardItemView({ item, scale = 1 }: { item: MoodboardItem; scale?: number }) {
  switch (item.kind) {
    case 'image':
      return (
        <div className="size-full overflow-hidden rounded-[6px] bg-muted shadow-[0_8px_24px_-12px_rgb(31_45_61/0.35)]">
          <ImageContent storagePath={item.storagePath} />
        </div>
      )
    case 'couleur': {
      const color = item.color ?? '#A9B08F'
      return (
        <div className="flex size-full flex-col overflow-hidden rounded-[10px] bg-white shadow-[0_8px_24px_-12px_rgb(31_45_61/0.35)]">
          <div className="flex-1" style={{ backgroundColor: color }} />
          <p className="truncate px-2 py-1 font-mono text-foreground/70" style={{ fontSize: 11 * scale }}>
            {item.text || color}
          </p>
        </div>
      )
    }
    case 'matiere': {
      const color = item.color ?? DEFAULT_NOTE_COLOR
      return (
        <div
          className="flex size-full items-end overflow-hidden rounded-full p-[12%] shadow-[0_8px_24px_-12px_rgb(31_45_61/0.35)]"
          style={{
            backgroundColor: color,
            // Grain discret, pour évoquer une matière plutôt qu'un aplat.
            backgroundImage: 'radial-gradient(rgb(255 255 255 / 0.18) 1px, transparent 1px)',
            backgroundSize: `${6 * scale}px ${6 * scale}px`,
          }}
        >
          <p className="w-full text-center font-heading italic leading-tight" style={{ color: readableTextOn(color), fontSize: 15 * scale }}>
            {item.text || 'Matière'}
          </p>
        </div>
      )
    }
    case 'texte':
    default: {
      const color = item.color
      return (
        <div
          className={cn('flex size-full items-center overflow-hidden rounded-[6px] p-[6%]', color && 'shadow-[0_8px_24px_-12px_rgb(31_45_61/0.35)]')}
          style={color ? { backgroundColor: color } : undefined}
        >
          <p
            className="w-full whitespace-pre-wrap break-words font-heading leading-snug"
            style={{ color: color ? readableTextOn(color) : '#2C2C2C', fontSize: 20 * scale }}
          >
            {item.text || 'Texte'}
          </p>
        </div>
      )
    }
  }
}
