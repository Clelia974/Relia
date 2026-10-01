import { useState } from 'react'
import { Copy, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
import { Link, useOutletContext } from 'react-router-dom'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { deleteImageAssets } from '@/features/assets/assetStorage'
import { MoodboardThumbnail } from '@/features/moodboard/components/MoodboardThumbnail'
import { PaletteEditor } from '@/features/moodboard/components/PaletteEditor'
import { TagListEditor } from '@/features/moodboard/components/TagListEditor'
import {
  canCreateMoodboard,
  countWeddingImages,
  GRATUIT_IMAGES_PER_WEDDING,
  GRATUIT_MOODBOARDS_PER_WEDDING,
  isMoodboardUnlimited,
} from '@/features/moodboard/moodboardLimit'
import { useSubscriptionCheck } from '@/features/payment/useSubscriptionCheck'
import { useWorkspaceStore } from '@/store/workspaceStore'
import type { WeddingOutletContext } from '@/pages/mariages/WeddingLayout'
import type { Moodboard, WeddingDesign } from '@/types/entities'

const EMPTY_DESIGN: WeddingDesign = { styleKeywords: [], palette: [], materials: [] }

type TitleDialogState = { mode: 'create' } | { mode: 'rename'; board: Moodboard } | null

function MoodboardTitleDialog({ state, onClose, onSubmit }: { state: TitleDialogState; onClose: () => void; onSubmit: (title: string) => void }) {
  const [title, setTitle] = useState(state?.mode === 'rename' ? state.board.title : '')
  const isCreate = state?.mode === 'create'
  return (
    <Dialog open={state !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isCreate ? 'Nouveau moodboard' : 'Renommer le moodboard'}</DialogTitle>
          <DialogDescription>Par exemple « Cérémonie », « Réception » ou « Version pluie ».</DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (title.trim()) onSubmit(title.trim())
          }}
        >
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nom du moodboard" aria-label="Nom du moodboard" autoFocus />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={!title.trim()}>
              {isCreate ? 'Créer' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function WeddingDesignTab() {
  const { wedding } = useOutletContext<WeddingOutletContext>()
  const allBoards = useWorkspaceStore((s) => s.workspace.moodboards)
  const updateWeddingDesign = useWorkspaceStore((s) => s.updateWeddingDesign)
  const createMoodboard = useWorkspaceStore((s) => s.createMoodboard)
  const renameMoodboard = useWorkspaceStore((s) => s.renameMoodboard)
  const duplicateMoodboard = useWorkspaceStore((s) => s.duplicateMoodboard)
  const deleteMoodboard = useWorkspaceStore((s) => s.deleteMoodboard)
  const { status } = useSubscriptionCheck()

  const design = wedding.design ?? EMPTY_DESIGN
  const boards = allBoards.filter((b) => b.weddingId === wedding.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  const canCreate = canCreateMoodboard(status, boards.length)
  const unlimited = isMoodboardUnlimited(status)
  const imageCount = countWeddingImages(allBoards, wedding.id)

  const [ambiance, setAmbiance] = useState(design.ambiance ?? '')
  const [titleDialog, setTitleDialog] = useState<TitleDialogState>(null)
  const [pendingDelete, setPendingDelete] = useState<Moodboard | null>(null)

  const saveAmbiance = () => {
    const value = ambiance.trim()
    if (value !== (design.ambiance ?? '')) updateWeddingDesign(wedding.id, { ambiance: value || undefined })
  }

  const handleTitleSubmit = (title: string) => {
    if (titleDialog?.mode === 'rename') {
      renameMoodboard(titleDialog.board.id, title)
      toast.success('Moodboard renommé.')
    } else {
      createMoodboard(wedding.id, title)
      toast.success('Moodboard créé.')
    }
    setTitleDialog(null)
  }

  const handleDuplicate = (board: Moodboard) => {
    if (!canCreate) {
      toast.error(`La version Gratuite est limitée à ${GRATUIT_MOODBOARDS_PER_WEDDING} moodboard par mariage.`)
      return
    }
    if (duplicateMoodboard(board.id)) toast.success('Moodboard dupliqué.')
  }

  const confirmDelete = () => {
    if (!pendingDelete) return
    void deleteImageAssets(deleteMoodboard(pendingDelete.id))
    setPendingDelete(null)
    toast.success('Moodboard supprimé.')
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground">Design</h1>
        <p className="mt-1 text-sm text-muted-foreground">La direction artistique du mariage et ses moodboards.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Direction artistique</CardTitle>
          <CardDescription>Tout est facultatif — notez ce qui vous aide à garder le cap.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-foreground">Style</h2>
            <TagListEditor
              label="Style"
              placeholder="ex. bohème, champêtre chic…"
              values={design.styleKeywords}
              onChange={(styleKeywords) => updateWeddingDesign(wedding.id, { styleKeywords })}
            />
          </section>
          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-foreground">Palette</h2>
            <PaletteEditor palette={design.palette} onChange={(palette) => updateWeddingDesign(wedding.id, { palette })} />
          </section>
          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-foreground">Matières</h2>
            <TagListEditor
              label="Matières"
              placeholder="ex. lin, eucalyptus, laiton…"
              values={design.materials}
              onChange={(materials) => updateWeddingDesign(wedding.id, { materials })}
            />
          </section>
          <section className="flex flex-col gap-2">
            <label htmlFor="design-ambiance" className="text-sm font-medium text-foreground">
              Ambiance
            </label>
            <Textarea
              id="design-ambiance"
              value={ambiance}
              onChange={(e) => setAmbiance(e.target.value)}
              onBlur={saveAmbiance}
              rows={3}
              placeholder="ex. Dîner sous les oliviers, lumière de fin de journée, beaucoup de bougies."
            />
          </section>
        </CardContent>
      </Card>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-heading text-xl font-semibold text-foreground">Moodboards</h2>
            {!unlimited && (
              <p className="mt-1 text-sm text-muted-foreground">
                Version Gratuite : {GRATUIT_MOODBOARDS_PER_WEDDING} moodboard et {GRATUIT_IMAGES_PER_WEDDING} images par mariage ({imageCount}/
                {GRATUIT_IMAGES_PER_WEDDING} utilisées).{' '}
                <Link to="/paiement" className="font-medium text-foreground underline underline-offset-4">
                  Passer à Solo
                </Link>
              </p>
            )}
          </div>
          <Button onClick={() => setTitleDialog({ mode: 'create' })} disabled={!canCreate}>
            <Plus className="size-4" aria-hidden="true" />
            Nouveau moodboard
          </Button>
        </div>

        {boards.length === 0 ? (
          <button
            type="button"
            onClick={() => setTitleDialog({ mode: 'create' })}
            className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border px-6 py-14 text-center transition-colors hover:border-foreground/30"
          >
            <span className="font-heading text-lg text-foreground">Créez votre premier moodboard</span>
            <span className="max-w-md text-sm text-muted-foreground">
              Posez librement vos photos d'inspiration, couleurs, matières et notes — puis exportez-le pour le partager avec les mariés.
            </span>
          </button>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {boards.map((board) => (
              <li key={board.id} className="group relative overflow-hidden rounded-lg border border-border bg-card shadow-(--shadow-card)">
                <Link to={`moodboards/${board.id}`} className="block" aria-label={`Ouvrir le moodboard ${board.title}`}>
                  <MoodboardThumbnail board={board} />
                </Link>
                <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-3">
                  <Link to={`moodboards/${board.id}`} className="min-w-0">
                    <p className="truncate font-medium text-foreground">{board.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {board.items.length === 0 ? 'Vide' : `${board.items.length} élément${board.items.length > 1 ? 's' : ''}`}
                    </p>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label={`Actions pour ${board.title}`}>
                        <MoreHorizontal className="size-4" aria-hidden="true" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => setTitleDialog({ mode: 'rename', board })}>
                        <Pencil className="size-4" aria-hidden="true" />
                        Renommer
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => handleDuplicate(board)}>
                        <Copy className="size-4" aria-hidden="true" />
                        Dupliquer
                      </DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onSelect={() => setPendingDelete(board)}>
                        <Trash2 className="size-4" aria-hidden="true" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <MoodboardTitleDialog
        key={titleDialog ? (titleDialog.mode === 'rename' ? titleDialog.board.id : 'new') : 'closed'}
        state={titleDialog}
        onClose={() => setTitleDialog(null)}
        onSubmit={handleTitleSubmit}
      />

      <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer « {pendingDelete?.title} » ?</AlertDialogTitle>
            <AlertDialogDescription>Le moodboard et ses images seront définitivement supprimés. Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
