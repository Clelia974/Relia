import { readableTextOn } from '@/features/moodboard/colors'
import { contourPathD, isTable } from '@/features/floorplan/floorPlanGeometry'
import { DASHED_KINDS, ELEMENT_FILL, PLAN_COLORS } from '@/features/floorplan/floorPlanStyle'
import type { FloorElement } from '@/types/entities'

/** Zone cliquable autour du trait des murs (px « monde »), bien plus large que le trait lui-même. */
const WALL_HIT_WIDTH = 20

/** Murs de la salle : tracé libre, fermé (intérieur clair) ou ouvert. Seul le trait est cliquable, jamais l'intérieur. */
function ContourShape({ element, interactive }: { element: FloorElement; interactive: boolean }) {
  const d = contourPathD(element.points ?? [], element.closed ?? false)
  return (
    <svg className="pointer-events-none absolute left-0 top-0 overflow-visible" width={element.w} height={element.h} aria-hidden="true">
      <path
        d={d}
        fill={element.closed ? (element.color ?? ELEMENT_FILL.contour) : 'none'}
        stroke={PLAN_COLORS.wall}
        strokeWidth={PLAN_COLORS.wallWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {interactive && (
        <path d={d} fill="none" stroke="transparent" strokeWidth={WALL_HIT_WIDTH} style={{ pointerEvents: 'stroke', cursor: 'move' }} />
      )}
      {element.label && (
        <text x={12} y={24} fill={PLAN_COLORS.stroke} fontSize={14} fontStyle="italic" fontFamily="'Source Serif 4', Georgia, serif">
          {element.label}
        </text>
      )}
    </svg>
  )
}

interface FloorElementViewProps {
  element: FloorElement
  seatsFilled?: number
  /** Murs uniquement : leur trait est-il cliquable (mode Disposition) ? */
  interactive?: boolean
}

/**
 * Forme d'un élément du plan, qui remplit sa boîte (position/taille/rotation
 * gérées par le conteneur). Les places des tables sont dessinées à part
 * (SeatDots), pour pouvoir être cibles de glisser-déposer.
 */
export function FloorElementView({ element, seatsFilled, interactive = false }: FloorElementViewProps) {
  if (element.kind === 'contour') return <ContourShape element={element} interactive={interactive} />

  const fill = element.color ?? ELEMENT_FILL[element.kind]
  const textColor = fill === 'transparent' ? PLAN_COLORS.text : readableTextOn(fill)
  const round = element.kind === 'table_ronde'

  if (element.kind === 'texte') {
    return (
      <div className="flex size-full items-center justify-center">
        <p className="w-full truncate text-center font-heading text-lg" style={{ color: PLAN_COLORS.text }}>
          {element.label || 'Texte'}
        </p>
      </div>
    )
  }

  return (
    <div
      className="flex size-full flex-col items-center justify-center overflow-hidden px-2 text-center"
      style={{
        backgroundColor: fill,
        border: `1.5px ${DASHED_KINDS.has(element.kind) ? 'dashed' : 'solid'} ${PLAN_COLORS.stroke}`,
        borderRadius: round ? '50%' : element.kind === 'piste' ? 4 : 8,
        // Parquet discret pour la piste de danse.
        backgroundImage: element.kind === 'piste' && !element.color ? 'repeating-linear-gradient(90deg, rgb(0 0 0 / 0.035) 0 1px, transparent 1px 24px)' : undefined,
        color: textColor,
      }}
    >
      <p className="w-full truncate text-sm font-medium leading-tight">{element.label}</p>
      {isTable(element) && (
        <p className="text-[11px] tabular-nums opacity-70">
          {seatsFilled ?? 0}/{element.seats ?? 0}
        </p>
      )}
    </div>
  )
}
