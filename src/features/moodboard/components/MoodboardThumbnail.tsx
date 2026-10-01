import { Images } from 'lucide-react'
import { MoodboardItemView } from '@/features/moodboard/components/MoodboardItemView'
import { boundsOf } from '@/features/moodboard/geometry'
import type { Moodboard } from '@/types/entities'

/** Repère interne de la vignette (ratio 3:2) — tout est ensuite exprimé en % pour suivre la largeur réelle de la carte. */
const W = 360
const H = 240
const PAD = 20

/** Aperçu réduit d'un moodboard : tous les éléments, recadrés pour tenir dans la vignette. */
export function MoodboardThumbnail({ board }: { board: Moodboard }) {
  if (board.items.length === 0) {
    return (
      <div className="flex aspect-[3/2] w-full items-center justify-center bg-accent/50 text-muted-foreground">
        <Images className="size-8" aria-hidden="true" />
      </div>
    )
  }
  const b = boundsOf(board.items)
  const scale = Math.min((W - PAD * 2) / b.w, (H - PAD * 2) / b.h, 1)
  const offsetX = (W - b.w * scale) / 2 - b.x * scale
  const offsetY = (H - b.h * scale) / 2 - b.y * scale
  const sorted = [...board.items].sort((a, c) => a.z - c.z)
  const pct = (v: number, of: number) => `${(v / of) * 100}%`

  return (
    <div className="relative aspect-[3/2] w-full overflow-hidden bg-[#F3F5F8]" aria-hidden="true">
      {sorted.map((item) => (
        <div
          key={item.id}
          className="absolute"
          style={{
            left: pct(offsetX + item.x * scale, W),
            top: pct(offsetY + item.y * scale, H),
            width: pct(item.w * scale, W),
            height: pct(item.h * scale, H),
            transform: `rotate(${item.rotation}deg)`,
          }}
        >
          <MoodboardItemView item={item} scale={scale * 0.8} />
        </div>
      ))}
    </div>
  )
}
