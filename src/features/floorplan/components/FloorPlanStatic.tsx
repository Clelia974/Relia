import { useEffect, useRef, useState } from 'react'
import { FloorElementView } from '@/features/floorplan/components/FloorElementView'
import { SeatDots } from '@/features/floorplan/components/SeatDots'
import { isTable, SEAT_OFFSET, SEAT_RADIUS } from '@/features/floorplan/floorPlanGeometry'
import { boundsOf } from '@/features/moodboard/geometry'
import type { FloorPlan, Guest } from '@/types/entities'

/** Repère interne (ratio 3:2), réduit ensuite à la largeur réelle du conteneur. */
const W = 900
const H = 600
const PAD = 24 + SEAT_OFFSET + SEAT_RADIUS

/** Plan en lecture seule, recadré sur son contenu (mobile, aperçus). */
export function FloorPlanStatic({ plan, guests }: { plan: FloorPlan; guests: Guest[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(W)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => setWidth(el.clientWidth || W)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const byId = new Map(guests.map((g) => [g.id, g]))
  const b = boundsOf(plan.elements.length ? plan.elements : [{ x: 0, y: 0, w: 1, h: 1 }])
  const scale = Math.min((W - PAD * 2) / b.w, (H - PAD * 2) / b.h, 1.5)
  const offsetX = (W - b.w * scale) / 2 - b.x * scale
  const offsetY = (H - b.h * scale) / 2 - b.y * scale

  return (
    <div ref={containerRef} className="relative aspect-[3/2] w-full overflow-hidden bg-[#F3F5F8]">
      {plan.elements.length === 0 && <p className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">Plan vide</p>}
      {/* Repère interne 900×600 réduit à la largeur réelle. */}
      <div className="absolute left-0 top-0 origin-top-left" style={{ width: W, height: H, transform: `scale(${width / W})` }}>
        <div className="absolute left-0 top-0 origin-top-left" style={{ transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})` }}>
          {[...plan.elements]
            .sort((a, c) => a.z - c.z)
            .map((el) => {
              const occupants: (Guest | undefined)[] = []
              for (const a of plan.assignments) if (a.elementId === el.id) occupants[a.seat] = byId.get(a.guestId)
              return (
                <div key={el.id} className="absolute" style={{ left: el.x, top: el.y, width: el.w, height: el.h, transform: `rotate(${el.rotation}deg)` }}>
                  <FloorElementView element={el} seatsFilled={occupants.filter(Boolean).length} />
                  {isTable(el) && <SeatDots element={el} occupants={occupants} interactive={false} />}
                </div>
              )
            })}
        </div>
      </div>
    </div>
  )
}
