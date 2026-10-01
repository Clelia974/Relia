import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Download, LayoutGrid, Maximize, Minus, PenLine, Plus, Redo2, Undo2, Users } from 'lucide-react'
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
import { isTyping } from '@/features/canvas/isTyping'
import { SelectionFrame } from '@/features/canvas/SelectionFrame'
import { INSPECTOR_WIDTH, useCanvasView, type View } from '@/features/canvas/useCanvasView'
import { useHistory } from '@/features/canvas/useHistory'
import { FloorElementInspector } from '@/features/floorplan/components/FloorElementInspector'
import { FloorElementView } from '@/features/floorplan/components/FloorElementView'
import { GuestPanel } from '@/features/floorplan/components/GuestPanel'
import { SeatDots } from '@/features/floorplan/components/SeatDots'
import { downloadFloorPlanPng, printFloorPlan, printSeatingList } from '@/features/floorplan/exportFloorPlan'
import {
  bulgeTowards,
  CLOSE_DISTANCE_PX,
  constrainAngle,
  contourSegments,
  contourWorldPoints,
  type ContourPoint,
  defaultElement,
  distanceToContour,
  ELEMENT_LABELS,
  insertContourPoint,
  isTable,
  normalizeContour,
  scalePoints,
  SEAT_OFFSET,
  SEAT_RADIUS,
  segmentCurve,
} from '@/features/floorplan/floorPlanGeometry'
import { PLAN_COLORS } from '@/features/floorplan/floorPlanStyle'
import { assignSeat, type FloorPlanContent, sanitizeAssignments, seatingStats, unassignGuest } from '@/features/floorplan/floorPlanOps'
import { exportFileName } from '@/features/moodboard/exportMoodboard'
import { boundsOf, type CornerHandle, type Point, resizeFromCorner, rotationTowards } from '@/features/moodboard/geometry'
import { generateId } from '@/lib/id'
import { cn } from '@/lib/utils'
import { useWorkspaceStore } from '@/store/workspaceStore'
import type { FloorElement, FloorElementKind, FloorPlan, Guest, Wedding } from '@/types/entities'

export type FloorPlanMode = 'disposition' | 'placement'

type Gesture =
  | { type: 'pan'; pointerId: number; startScreen: Point; startView: View }
  | { type: 'move'; pointerId: number; id: string; startWorld: Point; startElements: FloorElement[]; moved: boolean }
  | { type: 'resize'; pointerId: number; id: string; handle: CornerHandle; start: FloorElement }
  | { type: 'rotate'; pointerId: number; id: string; start: FloorElement }
  /** Déplacement d'un angle des murs. */
  | { type: 'vertex'; pointerId: number; id: string; index: number; start: FloorElement }
  /** Arrondi d'un mur, par sa poignée en losange (index = angle de départ du mur). */
  | { type: 'bulge'; pointerId: number; id: string; index: number; start: FloorElement }

/** Taille (px écran) des poignées d'angle des murs. */
const VERTEX_PX = 10

const ADD_GROUPS: { label: string; kinds: FloorElementKind[] }[] = [
  { label: 'Tables', kinds: ['table_ronde', 'table_rect', 'table_honneur'] },
  { label: 'Espaces', kinds: ['piste', 'scene', 'bar', 'buffet', 'zone'] },
  { label: 'Annotation', kinds: ['texte'] },
]

interface FloorPlanEditorProps {
  wedding: Wedding
  plan: FloorPlan
  guests: Guest[]
  mode: FloorPlanMode
  onModeChange: (mode: FloorPlanMode) => void
  /** Sélecteur de version, affiché en tête de la barre d'outils. */
  versionPicker: React.ReactNode
}

/**
 * Plan de salle + plan de table dans un seul éditeur (desktop) :
 * - Disposition : on pose librement tables et espaces (formes 2D, pas un plan d'architecte) ;
 * - Placement : on assoit les invités sur les places, par glisser-déposer ou clic.
 * Formes et placement partagent le même historique (⌘Z annule les deux).
 */
export function FloorPlanEditor({ wedding, plan, guests, mode, onModeChange, versionPicker }: FloorPlanEditorProps) {
  const setFloorPlanContent = useWorkspaceStore((s) => s.setFloorPlanContent)
  const persist = useCallback((content: FloorPlanContent) => setFloorPlanContent(plan.id, content), [plan.id, setFloorPlanContent])
  const { value, valueRef, preview, commit, undo, redo, canUndo, canRedo } = useHistory<FloorPlanContent>(
    { elements: plan.elements, assignments: plan.assignments },
    persist,
  )

  const viewportRef = useRef<HTMLDivElement>(null)
  const gesture = useRef<Gesture | null>(null)
  const { view, setView, viewRef, toWorld, centerWorld, zoomBy, fitTo, revealBesidePanel } = useCanvasView(viewportRef)
  /** Pendant un déplacement/redimensionnement/rotation, le panneau de réglages se retire pour ne rien masquer. */
  const [isGesturing, setIsGesturing] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  /** Élément dont on a fermé le panneau (×) : il reste sélectionné, ses poignées restent accessibles. */
  const [panelClosedFor, setPanelClosedFor] = useState<string | null>(null)
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  /** Tracé des murs en cours (angles en coordonnées « monde »), ou null hors tracé. */
  const [drawing, setDrawing] = useState<Point[] | null>(null)
  /** Position du pointeur pendant le tracé, pour prévisualiser le mur suivant. */
  const [drawCursor, setDrawCursor] = useState<Point | null>(null)

  // Un champ du panneau encore en cours de saisie ne doit pas être perdu en changeant de page.
  useEffect(() => {
    const latest = valueRef
    return () => persist(latest.current)
  }, [valueRef, persist])

  const { elements } = value
  const guestById = useMemo(() => new Map(guests.map((g) => [g.id, g])), [guests])
  // Un invité supprimé pendant la session (puis « Annuler ») ne doit jamais s'afficher.
  const assignments = useMemo(() => value.assignments.filter((a) => guestById.has(a.guestId)), [value.assignments, guestById])
  const stats = seatingStats(elements, assignments, guests.length)
  const selected = mode === 'disposition' ? (elements.find((e) => e.id === selectedId) ?? null) : null
  const sorted = [...elements].sort((a, b) => a.z - b.z)
  const palette = wedding.design?.palette ?? []

  const occupantsOf = (elementId: string) => {
    const seats: (Guest | undefined)[] = []
    for (const a of assignments) if (a.elementId === elementId) seats[a.seat] = guestById.get(a.guestId)
    return seats
  }

  const fit = useCallback(() => {
    const current = valueRef.current.elements
    fitTo(current.length ? boundsOf(current) : null)
  }, [valueRef, fitTo])

  useEffect(() => {
    fit()
  }, [fit])

  // ——— Modifications ———

  const commitElements = (next: FloorElement[], coalesceKey?: string) => {
    const assignmentsNext = sanitizeAssignments(next, valueRef.current.assignments)
    commit({ elements: next, assignments: assignmentsNext }, coalesceKey)
  }

  const nextZ = () => valueRef.current.elements.reduce((m, e) => Math.max(m, e.z), 0) + 1

  const addElement = (kind: FloorElementKind) => {
    const base = defaultElement(kind, valueRef.current.elements)
    const c = centerWorld()
    const jitter = (valueRef.current.elements.length % 6) * 40
    const el: FloorElement = { id: generateId(), x: c.x - base.w / 2 + jitter, y: c.y - base.h / 2 + jitter, rotation: 0, z: nextZ(), ...base }
    commitElements([...valueRef.current.elements, el])
    if (mode !== 'disposition') onModeChange('disposition')
    setSelectedId(el.id)
  }

  const patchElement = (id: string, patch: Partial<FloorElement>, options: { commit: boolean; coalesceKey?: string }) => {
    const next = valueRef.current.elements.map((e) => (e.id === id ? { ...e, ...patch } : e))
    if (options.commit) commitElements(next, options.coalesceKey)
    else preview({ ...valueRef.current, elements: next })
  }

  const deleteSelected = () => {
    if (!selectedId) return
    commitElements(valueRef.current.elements.filter((e) => e.id !== selectedId))
    setSelectedId(null)
  }

  const duplicateSelected = () => {
    const source = valueRef.current.elements.find((e) => e.id === selectedId)
    if (!source) return
    // Une table dupliquée prend le numéro suivant (Table 3 → Table 4), les autres gardent leur nom.
    const numbered = /^Table \d+$/.test(source.label ?? '')
    const label = numbered ? defaultElement(source.kind, valueRef.current.elements).label : source.label
    // Posée juste à droite, avec assez d'espace pour que les places des deux tables ne se touchent pas.
    const gap = isTable(source) ? 2 * (SEAT_OFFSET + SEAT_RADIUS) + 24 : 32
    const copy: FloorElement = { ...source, id: generateId(), x: source.x + source.w + gap, z: nextZ(), label }
    commitElements([...valueRef.current.elements, copy])
    setSelectedId(copy.id)
  }

  const reorderSelected = (front: boolean) => {
    if (!selectedId) return
    const zs = valueRef.current.elements.map((e) => e.z)
    patchElement(selectedId, { z: front ? Math.max(...zs) + 1 : Math.min(...zs) - 1 }, { commit: true })
  }

  // ——— Murs de la salle ———

  const startDrawing = () => {
    if (mode !== 'disposition') onModeChange('disposition')
    setSelectedId(null)
    setDrawing([])
    setDrawCursor(null)
  }

  const cancelDrawing = () => {
    setDrawing(null)
    setDrawCursor(null)
  }

  /** Termine le tracé : fermé = forme de la salle (intérieur clair), sinon simple ligne de murs. */
  const finishDrawing = (points: Point[], closed: boolean) => {
    cancelDrawing()
    if (points.length < 2 || (closed && points.length < 3)) return
    const zs = valueRef.current.elements.map((e) => e.z)
    const el: FloorElement = {
      id: generateId(),
      kind: 'contour',
      rotation: 0,
      // Toujours derrière les tables, la piste… posées dedans.
      z: (zs.length ? Math.min(...zs) : 0) - 1,
      closed,
      ...(closed ? { label: 'Salle' } : {}),
      ...normalizeContour(points, closed),
    }
    commitElements([...valueRef.current.elements, el])
    setSelectedId(el.id)
  }

  /** Point posé au clic : Maj = mur droit ou à 45° par rapport à l'angle précédent. */
  const drawPointAt = (e: React.PointerEvent | React.MouseEvent, points: Point[]): Point => {
    const world = toWorld(e.clientX, e.clientY)
    const last = points[points.length - 1]
    return e.shiftKey && last ? constrainAngle(last, world) : world
  }

  const handleDrawClick = (e: React.PointerEvent) => {
    if (!drawing || e.button !== 0) return
    const first = drawing[0]
    const world = toWorld(e.clientX, e.clientY)
    if (first && drawing.length >= 3 && Math.hypot(world.x - first.x, world.y - first.y) * viewRef.current.scale < CLOSE_DISTANCE_PX) {
      finishDrawing(drawing, true)
      return
    }
    setDrawing([...drawing, drawPointAt(e, drawing)])
  }

  /** Remplace les angles d'un contour (coordonnées « monde ») en recalant sa boîte. */
  const withContourPoints = (el: FloorElement, worldPoints: ContourPoint[]): FloorElement => ({ ...el, ...normalizeContour(worldPoints, el.closed ?? false) })

  const removeVertex = (el: FloorElement, index: number) => {
    const points = contourWorldPoints(el)
    if (points.length <= (el.closed ? 3 : 2)) return
    commitElements(valueRef.current.elements.map((x) => (x.id === el.id ? withContourPoints(el, points.filter((_, i) => i !== index)) : x)))
  }

  const insertVertex = (el: FloorElement, at: Point) => {
    const points = insertContourPoint(contourWorldPoints(el), at, el.closed ?? false)
    commitElements(valueRef.current.elements.map((x) => (x.id === el.id ? withContourPoints(el, points) : x)))
  }

  /** Redresse un mur arrondi (double-clic sur son losange). */
  const straightenWall = (el: FloorElement, index: number) => {
    const points = contourWorldPoints(el).map((p, i) => (i === index ? { x: p.x, y: p.y } : p))
    commitElements(valueRef.current.elements.map((x) => (x.id === el.id ? withContourPoints(el, points) : x)))
  }

  // ——— Placement ———

  const seatGuest = (guestId: string, elementId: string, seat: number) => {
    commit({ ...valueRef.current, assignments: assignSeat(valueRef.current.assignments, guestId, elementId, seat) })
  }

  const handleSeatClick = (elementId: string, seat: number) => {
    if (selectedGuestId) {
      seatGuest(selectedGuestId, elementId, seat)
      setSelectedGuestId(null)
      return
    }
    const occupant = valueRef.current.assignments.find((a) => a.elementId === elementId && a.seat === seat)
    setSelectedGuestId(occupant?.guestId ?? null)
  }

  const handleUnassign = (guestId: string) => {
    commit({ ...valueRef.current, assignments: unassignGuest(valueRef.current.assignments, guestId) })
  }

  // ——— Clavier ———

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return
      const mod = e.metaKey || e.ctrlKey
      if (drawing) {
        if (e.key === 'Escape') cancelDrawing()
        else if (e.key === 'Enter') finishDrawing(drawing, false)
        else if (e.key === 'Backspace' || e.key === 'Delete') setDrawing(drawing.slice(0, -1))
        else return
        e.preventDefault()
        return
      }
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
      } else if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        redo()
      } else if (e.key === 'Escape') {
        setSelectedId(null)
        setSelectedGuestId(null)
      } else if (mode !== 'disposition' || !selectedId) {
        return
      } else if (mod && e.key.toLowerCase() === 'd') {
        e.preventDefault()
        duplicateSelected()
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        deleteSelected()
      } else if (e.key.startsWith('Arrow')) {
        e.preventDefault()
        const step = e.shiftKey ? 10 : 1
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0
        const el = valueRef.current.elements.find((x) => x.id === selectedId)
        if (el) patchElement(selectedId, { x: el.x + dx, y: el.y + dy }, { commit: true, coalesceKey: `nudge:${selectedId}` })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // ——— Gestes ———

  const startGesture = (e: React.PointerEvent, g: Gesture) => {
    if (e.button !== 0) return
    e.stopPropagation()
    viewportRef.current?.setPointerCapture(e.pointerId)
    gesture.current = g
    if (g.type !== 'pan') setIsGesturing(true)
  }

  const startPan = (e: React.PointerEvent) =>
    startGesture(e, { type: 'pan', pointerId: e.pointerId, startScreen: { x: e.clientX, y: e.clientY }, startView: viewRef.current })

  const onPointerMove = (e: React.PointerEvent) => {
    if (drawing) {
      setDrawCursor(drawPointAt(e, drawing))
      return
    }
    const g = gesture.current
    if (!g || g.pointerId !== e.pointerId) return
    if (g.type === 'pan') {
      setView({ ...g.startView, x: g.startView.x + e.clientX - g.startScreen.x, y: g.startView.y + e.clientY - g.startScreen.y })
      return
    }
    const world = toWorld(e.clientX, e.clientY)
    const current = valueRef.current
    if (g.type === 'move') {
      const dx = world.x - g.startWorld.x
      const dy = world.y - g.startWorld.y
      if (!g.moved && Math.hypot(dx, dy) * viewRef.current.scale < 3) return
      g.moved = true
      preview({ ...current, elements: g.startElements.map((el) => (el.id === g.id ? { ...el, x: el.x + dx, y: el.y + dy } : el)) })
    } else if (g.type === 'resize') {
      // Table ronde : reste ronde par défaut (Maj pour en faire un ovale) ; le reste : l'inverse.
      const keepRatio = g.start.kind === 'table_ronde' ? !e.shiftKey : e.shiftKey
      const box = resizeFromCorner(g.start, g.handle, world, keepRatio)
      // Murs : les angles suivent la boîte proportionnellement.
      const points = g.start.points ? { points: scalePoints(g.start.points, g.start, box) } : {}
      preview({ ...current, elements: current.elements.map((el) => (el.id === g.id ? { ...el, ...box, ...points } : el)) })
    } else if (g.type === 'vertex') {
      const points = contourWorldPoints(g.start)
      const prev = points[g.index - 1] ?? (g.start.closed ? points[points.length - 1] : undefined)
      points[g.index] = { ...points[g.index], ...(e.shiftKey && prev ? constrainAngle(prev, world) : world) }
      preview({ ...current, elements: current.elements.map((el) => (el.id === g.id ? withContourPoints(g.start, points) : el)) })
    } else if (g.type === 'bulge') {
      const points = contourWorldPoints(g.start)
      const a = points[g.index]
      const b = points[(g.index + 1) % points.length]
      const bulge = bulgeTowards(a, b, world)
      // Près de la ligne droite, le mur se « recolle » droit (évite les arcs à peine visibles).
      points[g.index] = { x: a.x, y: a.y, ...(Math.abs(bulge) * viewRef.current.scale > 6 ? { bulge } : {}) }
      preview({ ...current, elements: current.elements.map((el) => (el.id === g.id ? withContourPoints(g.start, points) : el)) })
    } else {
      const rotation = rotationTowards(g.start, world, e.shiftKey)
      preview({ ...current, elements: current.elements.map((el) => (el.id === g.id ? { ...el, rotation } : el)) })
    }
  }

  const onPointerUp = (e: React.PointerEvent) => {
    const g = gesture.current
    if (!g || g.pointerId !== e.pointerId) return
    gesture.current = null
    if (g.type === 'pan') return
    setIsGesturing(false)
    commit(valueRef.current)
    // Le panneau de réglages réapparaît : l'élément ne doit pas finir caché dessous.
    const el = valueRef.current.elements.find((x) => x.id === g.id)
    if (el) revealBesidePanel(boundsOf([el]), INSPECTOR_WIDTH)
  }

  // ——— Export ———

  const runExport = async (kind: 'png' | 'pdf' | 'liste') => {
    if (elements.length === 0) {
      toast.error('Le plan est vide.')
      return
    }
    setExporting(true)
    const title = `${wedding.coupleName} — ${plan.title}`
    try {
      if (kind === 'png') await downloadFloorPlanPng(elements, assignments, guests, exportFileName(wedding.coupleName, 'plan', plan.title))
      else if (kind === 'pdf') await printFloorPlan(elements, assignments, guests, title)
      else await printSeatingList(title, elements, assignments, guests)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Export impossible.')
    } finally {
      setExporting(false)
    }
  }

  const placement = mode === 'placement'

  return (
    <div className="flex h-[calc(100dvh-13rem)] min-h-[560px] flex-col overflow-hidden rounded-lg border border-border bg-card">
      {/* Barre d'outils */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-border px-2 py-1.5">
        {versionPicker}
        <span className="mx-1 h-5 w-px shrink-0 bg-border" aria-hidden="true" />
        <div className="flex shrink-0 rounded-lg bg-muted p-[3px]" role="tablist" aria-label="Mode">
          {(
            [
              ['disposition', 'Disposition', LayoutGrid],
              ['placement', 'Placement', Users],
            ] as const
          ).map(([m, label, Icon]) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => {
                onModeChange(m)
                setSelectedId(null)
                setSelectedGuestId(null)
                cancelDrawing()
              }}
              className={cn(
                'inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors',
                mode === m ? 'bg-background text-foreground shadow-sm' : 'text-foreground/60 hover:text-foreground',
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="shrink-0" aria-label="Ajouter" title="Ajouter une table, la piste, le bar…">
              <Plus className="size-4" aria-hidden="true" />
              <span className="hidden xl:inline">Ajouter</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-52">
            {ADD_GROUPS.map((group, i) => (
              <div key={group.label}>
                {i > 0 && <DropdownMenuSeparator />}
                <DropdownMenuLabel>{group.label}</DropdownMenuLabel>
                {group.kinds.map((kind) => (
                  <DropdownMenuItem key={kind} onSelect={() => addElement(kind)}>
                    {ELEMENT_LABELS[kind]}
                  </DropdownMenuItem>
                ))}
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant={drawing ? 'secondary' : 'ghost'}
          size="sm"
          className="shrink-0"
          onClick={() => (drawing ? cancelDrawing() : startDrawing())}
          aria-pressed={drawing !== null}
          aria-label="Murs"
          title="Dessiner les murs de la salle, angle par angle"
        >
          <PenLine className="size-4" aria-hidden="true" />
          <span className="hidden xl:inline">Murs</span>
        </Button>

        <div className="ml-auto flex shrink-0 items-center gap-1">
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
              <DropdownMenuItem onSelect={() => void runExport('png')}>Plan en image PNG</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => void runExport('pdf')}>Plan en PDF</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => void runExport('liste')}>Liste par table (PDF)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1">
        {placement && (
          <GuestPanel
            weddingId={wedding.id}
            guests={guests}
            assignments={assignments}
            elements={elements}
            stats={stats}
            selectedGuestId={selectedGuestId}
            onSelectGuest={setSelectedGuestId}
            onUnassign={handleUnassign}
          />
        )}

        {/* Zone de travail */}
        <div
          ref={viewportRef}
          className={cn('relative flex-1 touch-none select-none overflow-hidden bg-[#F3F5F8]', drawing && 'cursor-crosshair')}
          style={{
            backgroundImage: 'radial-gradient(rgb(31 45 61 / 0.09) 1px, transparent 1px)',
            backgroundSize: `${24 * view.scale}px ${24 * view.scale}px`,
            backgroundPosition: `${view.x}px ${view.y}px`,
          }}
          onPointerDown={(e) => {
            if (drawing) {
              handleDrawClick(e)
              return
            }
            setSelectedId(null)
            setPanelClosedFor(null)
            startPan(e)
          }}
          onDoubleClick={(e) => {
            // Double-clic = termine le tracé ouvert (les 2 clics du double-clic ont posé le même point deux fois).
            if (drawing) {
              if (drawing.length >= 2) finishDrawing(drawing.slice(0, -1), false)
              return
            }
            // Murs sélectionnés : double-clic sur un angle = le retirer ; sur un mur = y ajouter un angle.
            // (Géré ici et non sur le mur lui-même : le 1er clic a capturé le pointeur sur la zone de travail.)
            if (selected?.kind !== 'contour') return
            const world = toWorld(e.clientX, e.clientY)
            const tolerance = 12 / viewRef.current.scale
            const points = contourWorldPoints(selected)
            const vertex = points.findIndex((p) => Math.hypot(p.x - world.x, p.y - world.y) <= tolerance)
            const wall = contourSegments(points, selected.closed ?? false).find(([a, b]) => {
              const { apex } = segmentCurve(a, b, a.bulge)
              return Math.hypot(apex.x - world.x, apex.y - world.y) <= tolerance
            })
            if (vertex >= 0) removeVertex(selected, vertex)
            else if (wall?.[0].bulge) straightenWall(selected, wall[2])
            else if (distanceToContour(points, world, selected.closed ?? false) <= tolerance) insertVertex(selected, world)
          }}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div className="absolute left-0 top-0 origin-top-left" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}>
            {sorted.map((el) => {
              const occupants = occupantsOf(el.id)
              return (
                <div
                  key={el.id}
                  // Murs : seul leur trait (dans le SVG) reçoit les clics, l'intérieur laisse passer vers les tables et la vue.
                  className={cn('absolute', el.kind === 'contour' ? 'pointer-events-none' : !placement && !drawing && 'cursor-move')}
                  style={{ left: el.x, top: el.y, width: el.w, height: el.h, transform: `rotate(${el.rotation}deg)` }}
                  onPointerDown={(e) => {
                    // En mode placement, les formes ne bougent pas : on fait glisser la vue. Pendant un tracé, le clic pose un angle.
                    if (placement || drawing) return
                    if (el.id !== selectedId) setPanelClosedFor(null)
                    setSelectedId(el.id)
                    startGesture(e, {
                      type: 'move',
                      pointerId: e.pointerId,
                      id: el.id,
                      startWorld: toWorld(e.clientX, e.clientY),
                      startElements: valueRef.current.elements,
                      moved: false,
                    })
                  }}
                >
                  <FloorElementView element={el} seatsFilled={occupants.filter(Boolean).length} interactive={!placement && !drawing} />
                  {isTable(el) && (
                    <SeatDots
                      element={el}
                      occupants={occupants}
                      interactive={placement}
                      highlightedGuestId={selectedGuestId}
                      onSeatClick={(seat) => handleSeatClick(el.id, seat)}
                      onGuestDrop={(guestId, seat) => seatGuest(guestId, el.id, seat)}
                    />
                  )}
                </div>
              )
            })}

            {selected && (
              <SelectionFrame
                box={selected}
                scale={view.scale}
                rotateClearance={isTable(selected) ? SEAT_OFFSET + SEAT_RADIUS : 0}
                rotatable={selected.kind !== 'contour'}
                onRotateStart={(e) => startGesture(e, { type: 'rotate', pointerId: e.pointerId, id: selected.id, start: selected })}
                onResizeStart={(handle, e) => startGesture(e, { type: 'resize', pointerId: e.pointerId, id: selected.id, handle, start: selected })}
              />
            )}

            {/* Angles des murs sélectionnés : on les déplace, double-clic pour en retirer un. */}
            {selected?.kind === 'contour' &&
              contourWorldPoints(selected).map((p, index) => (
                <button
                  key={index}
                  type="button"
                  aria-label={`Angle ${index + 1} des murs`}
                  title="Glisser pour déplacer · double-clic pour retirer"
                  className="absolute cursor-move rounded-full border-ring bg-white"
                  style={{
                    left: p.x,
                    top: p.y,
                    width: VERTEX_PX / view.scale,
                    height: VERTEX_PX / view.scale,
                    borderWidth: 2 / view.scale,
                    transform: 'translate(-50%, -50%)',
                  }}
                  onPointerDown={(e) => startGesture(e, { type: 'vertex', pointerId: e.pointerId, id: selected.id, index, start: selected })}
                />
              ))}

            {/* Milieu de chaque mur : losange à glisser pour l'arrondir, double-clic pour le redresser. */}
            {selected?.kind === 'contour' &&
              contourSegments(contourWorldPoints(selected), selected.closed ?? false).map(([a, b, index]) => {
                const { apex } = segmentCurve(a, b, a.bulge)
                return (
                  <button
                    key={`arc-${index}`}
                    type="button"
                    aria-label={`Arrondir le mur ${index + 1}`}
                    title="Glisser pour arrondir le mur · double-clic pour le redresser"
                    className="absolute cursor-grab border-ring bg-white"
                    style={{
                      left: apex.x,
                      top: apex.y,
                      width: (VERTEX_PX * 0.85) / view.scale,
                      height: (VERTEX_PX * 0.85) / view.scale,
                      borderWidth: 1.5 / view.scale,
                      transform: 'translate(-50%, -50%) rotate(45deg)',
                    }}
                    onPointerDown={(e) => startGesture(e, { type: 'bulge', pointerId: e.pointerId, id: selected.id, index, start: selected })}
                  />
                )
              })}

            {/* Tracé en cours */}
            {drawing && drawing.length > 0 && (
              <svg className="pointer-events-none absolute left-0 top-0 overflow-visible" width={1} height={1} aria-hidden="true">
                <polyline
                  points={[...drawing, ...(drawCursor ? [drawCursor] : [])].map((p) => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  stroke={PLAN_COLORS.wall}
                  strokeWidth={PLAN_COLORS.wallWidth}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  strokeOpacity={0.8}
                />
                {drawing.map((p, i) => (
                  <circle
                    key={i}
                    cx={p.x}
                    cy={p.y}
                    r={(i === 0 && drawing.length >= 3 ? 8 : 5) / view.scale}
                    fill={i === 0 && drawing.length >= 3 ? 'var(--color-ring)' : '#FFFFFF'}
                    stroke="var(--color-ring)"
                    strokeWidth={2 / view.scale}
                  />
                ))}
              </svg>
            )}
          </div>

          {drawing && (
            <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center px-3">
              <p className="max-w-xl rounded-2xl bg-foreground/85 px-4 py-2 text-center text-xs leading-relaxed text-background shadow-sm">
                <span className="font-medium">
                  {drawing.length < 3 ? 'Cliquez pour poser chaque angle de la salle.' : 'Cliquez sur le 1er point pour fermer, ou Entrée pour une simple ligne.'}
                </span>
                <br />
                Maj : murs droits · Retour arrière : dernier angle · Échap : annuler
              </p>
            </div>
          )}

          {elements.length === 0 && !drawing && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
              <p className="font-heading text-xl text-foreground">Dessinez la salle</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                « Murs » trace la forme de la salle, même biscornue. « Ajouter » pose les tables, la piste, le bar… où vous voulez. Puis passez en
                « Placement » pour asseoir chacun.
              </p>
            </div>
          )}
          {placement && elements.length > 0 && !elements.some(isTable) && (
            <p className="pointer-events-none absolute inset-x-0 top-4 text-center text-sm text-muted-foreground">Ajoutez des tables pour placer vos invités.</p>
          )}
        </div>

        {selected && !isGesturing && panelClosedFor !== selected.id && (
          <FloorElementInspector
            key={selected.id}
            element={selected}
            seatedCount={assignments.filter((a) => a.elementId === selected.id).length}
            palette={palette}
            onChange={(patch, options) => patchElement(selected.id, patch, options)}
            onBringToFront={() => reorderSelected(true)}
            onSendToBack={() => reorderSelected(false)}
            onDuplicate={duplicateSelected}
            onDelete={deleteSelected}
            onClose={() => setPanelClosedFor(selected.id)}
          />
        )}
      </div>
    </div>
  )
}
