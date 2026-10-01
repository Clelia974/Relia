import type { CornerHandle, RotatedBox } from '@/features/moodboard/geometry'

const HANDLE_PX = 10
const ROTATE_OFFSET_PX = 28

const CORNERS: { handle: CornerHandle; left: string; top: string; cursor: string }[] = [
  { handle: 'nw', left: '0%', top: '0%', cursor: 'nwse-resize' },
  { handle: 'ne', left: '100%', top: '0%', cursor: 'nesw-resize' },
  { handle: 'sw', left: '0%', top: '100%', cursor: 'nesw-resize' },
  { handle: 'se', left: '100%', top: '100%', cursor: 'nwse-resize' },
]

interface SelectionFrameProps {
  box: RotatedBox
  /** Zoom courant : cadre et poignées gardent la même taille à l'écran. */
  scale: number
  onResizeStart: (handle: CornerHandle, e: React.PointerEvent) => void
  onRotateStart: (e: React.PointerEvent) => void
  /** Distance supplémentaire (px « monde ») entre le bord et la poignée de rotation — pour passer au-dessus des places d'une table. */
  rotateClearance?: number
  /** Faux pour les murs d'une salle : on les redessine plutôt que de les faire pivoter. */
  rotatable?: boolean
}

/** Cadre de l'élément sélectionné, avec 4 poignées de redimensionnement et une de rotation (coordonnées « monde »). */
export function SelectionFrame({ box, scale, onResizeStart, onRotateStart, rotateClearance = 0, rotatable = true }: SelectionFrameProps) {
  const handle = HANDLE_PX / scale
  const rotateOffset = ROTATE_OFFSET_PX / scale + rotateClearance
  return (
    <div
      className="pointer-events-none absolute"
      style={{
        left: box.x,
        top: box.y,
        width: box.w,
        height: box.h,
        transform: `rotate(${box.rotation}deg)`,
        outline: `${1.5 / scale}px solid var(--color-ring)`,
        outlineOffset: 2 / scale,
      }}
    >
      {rotatable && (
        <>
          <div className="pointer-events-none absolute left-1/2 bg-ring" style={{ top: -rotateOffset, width: 1 / scale, height: rotateOffset }} />
          <button
            type="button"
            aria-label="Faire pivoter"
            className="pointer-events-auto absolute cursor-grab rounded-full border-ring bg-white"
            style={{
              left: '50%',
              top: -rotateOffset,
              width: handle * 1.2,
              height: handle * 1.2,
              borderWidth: 1.5 / scale,
              transform: 'translate(-50%, -50%)',
            }}
            onPointerDown={onRotateStart}
          />
        </>
      )}
      {CORNERS.map((c) => (
        <button
          key={c.handle}
          type="button"
          aria-label="Redimensionner"
          className="pointer-events-auto absolute rounded-[2px] border-ring bg-white"
          style={{
            left: c.left,
            top: c.top,
            width: handle,
            height: handle,
            borderWidth: 1.5 / scale,
            cursor: c.cursor,
            transform: 'translate(-50%, -50%)',
          }}
          onPointerDown={(e) => onResizeStart(c.handle, e)}
        />
      ))}
    </div>
  )
}
