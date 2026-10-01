import { ArrowLeft, Monitor } from 'lucide-react'
import { Link, useOutletContext, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { MoodboardEditor } from '@/features/moodboard/components/MoodboardEditor'
import { MoodboardThumbnail } from '@/features/moodboard/components/MoodboardThumbnail'
import { countWeddingImages, remainingImageSlots } from '@/features/moodboard/moodboardLimit'
import { useSubscriptionCheck } from '@/features/payment/useSubscriptionCheck'
import { useIsDesktop } from '@/hooks/useIsDesktop'
import { useWorkspaceStore } from '@/store/workspaceStore'
import type { WeddingOutletContext } from '@/pages/mariages/WeddingLayout'

export function MoodboardEditorPage() {
  const { wedding } = useOutletContext<WeddingOutletContext>()
  const { moodboardId } = useParams<{ moodboardId: string }>()
  const board = useWorkspaceStore((s) => s.workspace.moodboards.find((b) => b.id === moodboardId && b.weddingId === wedding.id))
  const allBoards = useWorkspaceStore((s) => s.workspace.moodboards)
  const allEquipment = useWorkspaceStore((s) => s.workspace.equipmentItems)
  const { status } = useSubscriptionCheck()
  const isDesktop = useIsDesktop()

  if (!board) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed border-border px-6 py-16">
        <h2 className="font-heading text-xl font-semibold text-foreground">Moodboard introuvable</h2>
        <p className="text-sm text-muted-foreground">Il a peut-être été supprimé.</p>
        <Button asChild variant="outline">
          <Link to={`/mariages/${wedding.id}/design`}>Retour au Design</Link>
        </Button>
      </div>
    )
  }

  if (!isDesktop) {
    return (
      <div className="flex flex-col gap-4">
        <Button asChild variant="ghost" size="sm" className="w-fit">
          <Link to={`/mariages/${wedding.id}/design`}>
            <ArrowLeft className="size-4" aria-hidden="true" />
            Design
          </Link>
        </Button>
        <h2 className="font-heading text-xl font-semibold text-foreground">{board.title}</h2>
        <div className="overflow-hidden rounded-lg border border-border">
          <MoodboardThumbnail board={board} />
        </div>
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Monitor className="size-4 shrink-0" aria-hidden="true" />
          Ouvrez SilkyPlace sur ordinateur pour modifier ce moodboard.
        </p>
      </div>
    )
  }

  return (
    <MoodboardEditor
      key={board.id}
      wedding={wedding}
      board={board}
      equipment={allEquipment.filter((e) => e.weddingId === wedding.id)}
      imageSlotsLeft={remainingImageSlots(status, countWeddingImages(allBoards, wedding.id))}
    />
  )
}
