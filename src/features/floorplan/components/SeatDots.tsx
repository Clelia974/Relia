import { GUEST_DRAG_TYPE } from '@/features/floorplan/dnd'
import { initials, SEAT_RADIUS, seatPositions } from '@/features/floorplan/floorPlanGeometry'
import { PLAN_COLORS } from '@/features/floorplan/floorPlanStyle'
import { cn } from '@/lib/utils'
import type { FloorElement, Guest } from '@/types/entities'

interface SeatDotsProps {
  element: FloorElement
  /** Invité assis à chaque place (index = numéro de place). */
  occupants: (Guest | undefined)[]
  /** Mode placement : places cliquables et cibles de dépôt. */
  interactive: boolean
  highlightedGuestId?: string | null
  onSeatClick?: (seat: number) => void
  onGuestDrop?: (guestId: string, seat: number) => void
}

/** Pastilles des places autour d'une table : vides (blanches) ou occupées (vert sauge + initiales). */
export function SeatDots({ element, occupants, interactive, highlightedGuestId, onSeatClick, onGuestDrop }: SeatDotsProps) {
  return (
    <>
      {seatPositions(element).map((p, seat) => {
        const guest = occupants[seat]
        const highlighted = guest !== undefined && guest.id === highlightedGuestId
        return (
          <button
            key={seat}
            type="button"
            tabIndex={interactive ? 0 : -1}
            title={guest ? guest.name : `Place ${seat + 1} — libre`}
            aria-label={guest ? `${element.label ?? 'Table'}, place ${seat + 1} : ${guest.name}` : `${element.label ?? 'Table'}, place ${seat + 1} libre`}
            draggable={interactive && guest !== undefined}
            className={cn(
              'absolute flex items-center justify-center rounded-full text-[9px] font-semibold leading-none select-none',
              interactive ? 'cursor-pointer hover:ring-2 hover:ring-ring/50' : 'pointer-events-none',
              highlighted && 'ring-2 ring-ring ring-offset-1',
            )}
            style={{
              left: p.x - SEAT_RADIUS,
              top: p.y - SEAT_RADIUS,
              width: SEAT_RADIUS * 2,
              height: SEAT_RADIUS * 2,
              backgroundColor: guest ? PLAN_COLORS.seatFilled : PLAN_COLORS.seatEmpty,
              color: PLAN_COLORS.seatFilledText,
              border: `1.5px solid ${guest ? PLAN_COLORS.seatFilled : PLAN_COLORS.stroke}`,
              // Les initiales restent droites même si la table est tournée.
              transform: `rotate(${-element.rotation}deg)`,
            }}
            onPointerDown={(e) => interactive && e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              onSeatClick?.(seat)
            }}
            onDragStart={(e) => {
              if (!guest) return
              e.dataTransfer.setData(GUEST_DRAG_TYPE, guest.id)
              e.dataTransfer.effectAllowed = 'move'
            }}
            onDragOver={(e) => {
              if (interactive && e.dataTransfer.types.includes(GUEST_DRAG_TYPE)) {
                e.preventDefault()
                e.dataTransfer.dropEffect = 'move'
              }
            }}
            onDrop={(e) => {
              const guestId = e.dataTransfer.getData(GUEST_DRAG_TYPE)
              if (!guestId) return
              e.preventDefault()
              e.stopPropagation()
              onGuestDrop?.(guestId, seat)
            }}
          >
            {guest ? initials(guest.name) : ''}
          </button>
        )
      })}
    </>
  )
}
