import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, Download, ImagePlus, Maximize, Minus, Palette, Plus, Redo2, Shapes, Type, Undo2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { deleteImageAssets, uploadImageAsset } from '@/features/assets/assetStorage'
import { MoodboardInspector } from '@/features/moodboard/components/MoodboardInspector'
import { MoodboardItemView } from '@/features/moodboard/components/MoodboardItemView'
import { downloadMoodboardPng, exportFileName, printMoodboard } from '@/features/moodboard/exportMoodboard'
import { isTyping } from '@/features/canvas/isTyping'
import { SelectionFrame } from '@/features/canvas/SelectionFrame'
import { INSPECTOR_WIDTH, useCanvasView, type View } from '@/features/canvas/useCanvasView'
import { useHistory } from '@/features/canvas/useHistory'
import { boundsOf, type CornerHandle, type Point, resizeFromCorner, rotationTowards } from '@/features/moodboard/geometry'
import { referencedImagePaths } from '@/features/moodboard/moodboardOps'
import { useAuth } from '@/hooks/useAuth'
import { generateId } from '@/lib/id'
import { useWorkspaceStore } from '@/store/workspaceStore'
import type { EquipmentItem, Moodboard, MoodboardItem, Wedding } from '@/types/entities'

/** Taille du fichier d'origine acceptée — réduit ensuite dans le navigateur (cf. imageResize.ts). */
const MAX_SOURCE_SIZE = 25 * 1024 * 1024
const NEW_IMAGE_WIDTH = 280
const GRID_GAP = 24
type Gesture =
  | { type: 'pan'; pointerId: number; startScreen: Point; startView: View }
  | { type: 'move'; pointerId: number; id: string; startWorld: Point; startItems: MoodboardItem[]; moved: boolean }
  | { type: 'resize'; pointerId: number; id: string; handle: CornerHandle; startItem: MoodboardItem }
  | { type: 'rotate'; pointerId: number; id: string; startItem: MoodboardItem }

interface MoodboardEditorProps {
  wedding: Wedding
  board: Moodboard
  equipment: EquipmentItem[]
  /** Places d'images restantes pour ce mariage, recalculées à chaque enregistrement (Infinity hors version Gratuite). */
  imageSlotsLeft: number
}

/**
 * Éditeur libre (desktop) : on pose, déplace, redimensionne et fait pivoter
 * images, textes, couleurs et matières. Rien n'est enregistré pendant un
 * geste — un seul enregistrement au relâchement (le store réécrit tout
 * l'espace de travail à chaque modification).
 */
export function MoodboardEditor({ wedding, board, equipment, imageSlotsLeft }: MoodboardEditorProps) {
  const { user } = useAuth()
  const setMoodboardItems = useWorkspaceStore((s) => s.setMoodboardItems)
  const persist = useCallback((items: MoodboardItem[]) => void setMoodboardItems(board.id, items), [board.id, setMoodboardItems])
  const { value: items, valueRef: itemsRef, preview, commit, undo, redo, canUndo, canRedo } = useHistory(board.items, persist)

  const viewportRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textRef = useRef<HTMLTextAreaElement>(null)
  const gesture = useRef<Gesture | null>(null)
  const { view, setView, viewRef, toWorld, centerWorld: viewportCenterWorld, zoomBy, fitTo, revealBesidePanel } = useCanvasView(viewportRef)
  /** Pendant un déplacement/redimensionnement/rotation, le panneau de réglages se retire pour ne rien masquer. */
  const [isGesturing, setIsGesturing] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(0)
  const [isDragOver, setIsDragOver] = useState(false)
  const [exporting, setExporting] = useState(false)

  /** Toutes les images vues pendant la session : celles qui ne sont plus utilisées nulle part sont supprimées en quittant (jamais avant, sinon « Annuler » ramènerait une image cassée). */
  const sessionPaths = useRef(new Set(board.items.flatMap((i) => (i.storagePath ? [i.storagePath] : []))))
  useEffect(() => {
    const paths = sessionPaths.current
    const latest = itemsRef
    return () => {
      // Un texte en cours de frappe (pas encore « quitté ») ne doit pas être perdu en changeant de page.
      persist(latest.current)
      const still = referencedImagePaths(useWorkspaceStore.getState().workspace)
      void deleteImageAssets([...paths].filter((p) => !still.has(p)))
    }
  }, [itemsRef, persist])

  const palette = wedding.design?.palette ?? []
  const materials = wedding.design?.materials ?? []
  const selected = items.find((i) => i.id === selectedId) ?? null
  const sorted = [...items].sort((a, b) => a.z - b.z)

  // ——— Vue ———

  const fit = useCallback(() => {
    const current = itemsRef.current
    fitTo(current.length ? boundsOf(current) : null)
  }, [itemsRef, fitTo])

  useEffect(() => {
    fit()
  }, [fit])

  // ——— Modifications ———

  const nextZ = () => itemsRef.current.reduce((m, i) => Math.max(m, i.z), 0) + 1

  const addItem = (partial: Omit<MoodboardItem, 'id' | 'z' | 'rotation'> & { rotation?: number }, select = true) => {
    const item: MoodboardItem = { id: generateId(), z: nextZ(), rotation: 0, ...partial }
    commit([...itemsRef.current, item])
    if (select) setSelectedId(item.id)
    return item
  }

  const addAtCenter = (kind: MoodboardItem['kind'], w: number, h: number, extra: Partial<MoodboardItem> = {}) => {
    const c = viewportCenterWorld()
    // Léger décalage à chaque ajout, pour ne pas empiler les éléments exactement au même endroit.
    const jitter = (itemsRef.current.length % 6) * 40
    addItem({ kind, x: c.x - w / 2 + jitter, y: c.y - h / 2 + jitter, w, h, ...extra })
  }

  const patchItem = (id: string, patch: Partial<MoodboardItem>, options: { commit: boolean; coalesceKey?: string }) => {
    const next = itemsRef.current.map((i) => (i.id === id ? { ...i, ...patch } : i))
    if (options.commit) commit(next, options.coalesceKey)
    else preview(next)
  }

  const deleteSelected = () => {
    if (!selectedId) return
    commit(itemsRef.current.filter((i) => i.id !== selectedId))
    setSelectedId(null)
  }

  const duplicateSelected = () => {
    const source = itemsRef.current.find((i) => i.id === selectedId)
    if (!source) return
    if (source.kind === 'image' && imageSlotsLeft <= 0) {
      toast.error('Limite d’images de la version Gratuite atteinte pour ce mariage.')
      return
    }
    const { id: _id, z: _z, ...rest } = source
    addItem({ ...rest, x: source.x + 24, y: source.y + 24 })
  }

  const reorderSelected = (front: boolean) => {
    if (!selectedId) return
    const zs = itemsRef.current.map((i) => i.z)
    const z = front ? Math.max(...zs) + 1 : Math.min(...zs) - 1
    patchItem(selectedId, { z }, { commit: true })
  }

  // ——— Images ———

  const uploadFiles = async (files: File[], at?: Point) => {
    if (!user) return
    const images = files.filter((f) => f.type.startsWith('image/'))
    if (images.length === 0) {
      toast.error('Choisissez des fichiers image (JPG, PNG ou WebP).')
      return
    }
    const slots = imageSlotsLeft
    if (slots <= 0) {
      toast.error('Limite d’images de la version Gratuite atteinte pour ce mariage. Passez à Solo pour en ajouter davantage.')
      return
    }
    const accepted = images.slice(0, slots).filter((f) => {
      if (f.size <= MAX_SOURCE_SIZE) return true
      toast.error(`« ${f.name} » est trop lourde (25 Mo maximum).`)
      return false
    })
    if (images.length > slots) toast.warning(`Seules ${slots} image${slots > 1 ? 's' : ''} ont été ajoutées (limite de la version Gratuite).`)

    const origin = at ?? viewportCenterWorld()
    setUploading((n) => n + accepted.length)
    await Promise.all(
      accepted.map(async (file, index) => {
        try {
          const asset = await uploadImageAsset(user.id, wedding.id, file)
          sessionPaths.current.add(asset.storagePath)
          const w = NEW_IMAGE_WIDTH
          const h = Math.round((NEW_IMAGE_WIDTH * asset.height) / asset.width)
          // Plusieurs images d'un coup : posées en grille (3 par ligne) autour du point de dépôt, jamais empilées.
          const cols = Math.min(3, accepted.length)
          const col = index % cols
          const row = Math.floor(index / cols)
          const x = origin.x - (cols * (w + GRID_GAP)) / 2 + col * (w + GRID_GAP) + GRID_GAP / 2
          const y = origin.y - NEW_IMAGE_WIDTH / 2 + row * (NEW_IMAGE_WIDTH * 1.5 + GRID_GAP)
          addItem({ kind: 'image', x, y, w, h, storagePath: asset.storagePath }, accepted.length === 1)
        } catch (error) {
          toast.error(error instanceof Error ? error.message : 'L’image n’a pas pu être envoyée.')
        } finally {
          setUploading((n) => n - 1)
        }
      }),
    )
  }

  // Coller une image (capture d'écran, image copiée depuis Pinterest…).
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      if (isTyping(e.target)) return
      const files = [...(e.clipboardData?.files ?? [])].filter((f) => f.type.startsWith('image/'))
      if (files.length) {
        e.preventDefault()
        void uploadFiles(files)
      }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  })

  // ——— Clavier ———

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
      } else if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        redo()
      } else if (mod && e.key.toLowerCase() === 'd') {
        e.preventDefault()
        duplicateSelected()
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        e.preventDefault()
        deleteSelected()
      } else if (e.key === 'Escape') {
        setSelectedId(null)
      } else if (selectedId && e.key.startsWith('Arrow')) {
        e.preventDefault()
        const step = e.shiftKey ? 10 : 1
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0
        const item = itemsRef.current.find((i) => i.id === selectedId)
        if (item) patchItem(selectedId, { x: item.x + dx, y: item.y + dy }, { commit: true, coalesceKey: `nudge:${selectedId}` })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // ——— Gestes à la souris / au stylet ———

  const startGesture = (e: React.PointerEvent, g: Gesture) => {
    if (e.button !== 0) return
    e.stopPropagation()
    viewportRef.current?.setPointerCapture(e.pointerId)
    gesture.current = g
    if (g.type !== 'pan') setIsGesturing(true)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const g = gesture.current
    if (!g || g.pointerId !== e.pointerId) return
    if (g.type === 'pan') {
      setView({ ...g.startView, x: g.startView.x + e.clientX - g.startScreen.x, y: g.startView.y + e.clientY - g.startScreen.y })
      return
    }
    const world = toWorld(e.clientX, e.clientY)
    if (g.type === 'move') {
      const dx = world.x - g.startWorld.x
      const dy = world.y - g.startWorld.y
      if (!g.moved && Math.hypot(dx, dy) * viewRef.current.scale < 3) return
      g.moved = true
      preview(g.startItems.map((i) => (i.id === g.id ? { ...i, x: i.x + dx, y: i.y + dy } : i)))
    } else if (g.type === 'resize') {
      // Images : proportions gardées par défaut (Maj pour les libérer) ; le reste : l'inverse.
      const keepRatio = g.startItem.kind === 'image' ? !e.shiftKey : e.shiftKey
      const box = resizeFromCorner(g.startItem, g.handle, world, keepRatio)
      preview(itemsRef.current.map((i) => (i.id === g.id ? { ...i, ...box } : i)))
    } else {
      const rotation = rotationTowards(g.startItem, world, e.shiftKey)
      preview(itemsRef.current.map((i) => (i.id === g.id ? { ...i, rotation } : i)))
    }
  }

  const onPointerUp = (e: React.PointerEvent) => {
    const g = gesture.current
    if (!g || g.pointerId !== e.pointerId) return
    gesture.current = null
    if (g.type === 'pan') return
    setIsGesturing(false)
    commit(itemsRef.current)
    // Le panneau de réglages réapparaît : l'élément ne doit pas finir caché dessous.
    const item = itemsRef.current.find((i) => i.id === g.id)
    if (item) revealBesidePanel(boundsOf([item]), INSPECTOR_WIDTH)
  }

  // ——— Glisser-déposer de fichiers ———

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = [...e.dataTransfer.files]
    if (files.length) void uploadFiles(files, toWorld(e.clientX, e.clientY))
  }

  // ——— Export ———

  const runExport = async (format: 'png' | 'pdf') => {
    if (items.length === 0) {
      toast.error('Le moodboard est vide.')
      return
    }
    setExporting(true)
    try {
      if (format === 'png') await downloadMoodboardPng(items, exportFileName(wedding.coupleName, board.title))
      else await printMoodboard(items, `${wedding.coupleName} — ${board.title}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Export impossible.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex h-[calc(100dvh-13rem)] min-h-[560px] flex-col overflow-hidden rounded-lg border border-border bg-card">
      {/* Barre d'outils */}
      <div className="flex items-center gap-0.5 overflow-x-auto border-b border-border px-2 py-1.5">
        <Button asChild variant="ghost" size="sm">
          <Link to={`/mariages/${wedding.id}/design`}>
            <ArrowLeft className="size-4" aria-hidden="true" />
            Design
          </Link>
        </Button>
        <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
        <p className="mr-2 max-w-48 shrink-0 truncate font-heading text-base font-semibold text-foreground">{board.title}</p>

        <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} loading={uploading > 0} aria-label="Images" title="Ajouter des images">
          <ImagePlus className="size-4" aria-hidden="true" />
          <span className="hidden xl:inline">Images</span>
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = [...(e.target.files ?? [])]
            e.target.value = ''
            void uploadFiles(files)
          }}
        />
        <Button variant="ghost" size="sm" onClick={() => addAtCenter('texte', 240, 96, { text: 'Votre texte' })} aria-label="Texte" title="Ajouter un texte">
          <Type className="size-4" aria-hidden="true" />
          <span className="hidden xl:inline">Texte</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" aria-label="Couleur" title="Ajouter une couleur">
              <Palette className="size-4" aria-hidden="true" />
              <span className="hidden xl:inline">Couleur</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-52">
            {palette.length > 0 && <DropdownMenuLabel>Palette du mariage</DropdownMenuLabel>}
            {palette.map((s) => (
              <DropdownMenuItem key={s.hex} onSelect={() => addAtCenter('couleur', 120, 150, { color: s.hex, text: s.label })}>
                <span className="size-4 rounded-full border border-border" style={{ backgroundColor: s.hex }} aria-hidden="true" />
                {s.label ?? s.hex}
              </DropdownMenuItem>
            ))}
            {palette.length > 0 && <DropdownMenuSeparator />}
            <DropdownMenuItem onSelect={() => addAtCenter('couleur', 120, 150, { color: '#A9B08F' })}>Nouvelle couleur</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" aria-label="Matière" title="Ajouter une matière">
              <Shapes className="size-4" aria-hidden="true" />
              <span className="hidden xl:inline">Matière</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-52">
            {materials.length > 0 && <DropdownMenuLabel>Matières du mariage</DropdownMenuLabel>}
            {materials.map((m) => (
              <DropdownMenuItem key={m} onSelect={() => addAtCenter('matiere', 150, 150, { text: m })}>
                {m}
              </DropdownMenuItem>
            ))}
            {materials.length > 0 && <DropdownMenuSeparator />}
            <DropdownMenuItem onSelect={() => addAtCenter('matiere', 150, 150)}>Nouvelle matière</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={undo} disabled={!canUndo} aria-label="Annuler" title="Annuler (⌘Z)">
            <Undo2 className="size-4" aria-hidden="true" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={redo} disabled={!canRedo} aria-label="Rétablir" title="Rétablir (⌘⇧Z)">
            <Redo2 className="size-4" aria-hidden="true" />
          </Button>
          <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
          <Button variant="ghost" size="icon-sm" onClick={() => zoomBy(1 / 1.2)} aria-label="Dézoomer">
            <Minus className="size-4" aria-hidden="true" />
          </Button>
          <span className="w-12 text-center text-xs tabular-nums text-muted-foreground">{Math.round(view.scale * 100)} %</span>
          <Button variant="ghost" size="icon-sm" onClick={() => zoomBy(1.2)} aria-label="Zoomer">
            <Plus className="size-4" aria-hidden="true" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={fit} aria-label="Tout afficher" title="Tout afficher">
            <Maximize className="size-4" aria-hidden="true" />
          </Button>
          <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" loading={exporting}>
                <Download className="size-4" aria-hidden="true" />
                Exporter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => void runExport('png')}>Image PNG (à partager)</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => void runExport('pdf')}>PDF (imprimer / envoyer)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1">
        {/* Zone de travail */}
        <div
          ref={viewportRef}
          className="relative flex-1 touch-none select-none overflow-hidden bg-[#F3F5F8] data-[drag=true]:bg-accent/60"
          data-drag={isDragOver}
          style={{
            backgroundImage: 'radial-gradient(rgb(31 45 61 / 0.09) 1px, transparent 1px)',
            backgroundSize: `${24 * view.scale}px ${24 * view.scale}px`,
            backgroundPosition: `${view.x}px ${view.y}px`,
          }}
          onPointerDown={(e) => {
            setSelectedId(null)
            startGesture(e, { type: 'pan', pointerId: e.pointerId, startScreen: { x: e.clientX, y: e.clientY }, startView: view })
          }}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragOver(true)
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={onDrop}
        >
          <div className="absolute left-0 top-0 origin-top-left" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}>
            {sorted.map((item) => (
              <div
                key={item.id}
                className="absolute cursor-move"
                style={{ left: item.x, top: item.y, width: item.w, height: item.h, transform: `rotate(${item.rotation}deg)` }}
                onPointerDown={(e) => {
                  setSelectedId(item.id)
                  startGesture(e, {
                    type: 'move',
                    pointerId: e.pointerId,
                    id: item.id,
                    startWorld: toWorld(e.clientX, e.clientY),
                    startItems: itemsRef.current,
                    moved: false,
                  })
                }}
                onDoubleClick={() => textRef.current?.focus()}
              >
                <MoodboardItemView item={item} />
              </div>
            ))}

            {/* Cadre de sélection + poignées (taille constante à l'écran, quel que soit le zoom) */}
            {selected && (
              <SelectionFrame
                box={selected}
                scale={view.scale}
                onRotateStart={(e) => startGesture(e, { type: 'rotate', pointerId: e.pointerId, id: selected.id, startItem: selected })}
                onResizeStart={(handle, e) =>
                  startGesture(e, { type: 'resize', pointerId: e.pointerId, id: selected.id, handle, startItem: selected })
                }
              />
            )}
          </div>

          {items.length === 0 && uploading === 0 && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
              <p className="font-heading text-xl text-foreground">Glissez vos images ici</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                ou utilisez la barre d'outils pour ajouter images, textes, couleurs et matières. Vous pouvez aussi coller une image (⌘V).
              </p>
            </div>
          )}
        </div>

        {selected && !isGesturing && (
          <MoodboardInspector
            key={selected.id}
            ref={textRef}
            item={selected}
            palette={palette}
            equipment={equipment}
            onChange={(patch, options) => patchItem(selected.id, patch, options)}
            onBringToFront={() => reorderSelected(true)}
            onSendToBack={() => reorderSelected(false)}
            onDuplicate={duplicateSelected}
            onDelete={deleteSelected}
            onClose={() => setSelectedId(null)}
          />
        )}
      </div>
    </div>
  )
}
