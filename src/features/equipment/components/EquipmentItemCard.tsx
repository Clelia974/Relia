import { Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { type BadgeTone, toneClass } from '@/lib/badgeTone'
import { EQUIPMENT_ACQUISITION_MODE_LABELS } from '@/lib/equipmentAcquisitionMode'
import { EQUIPMENT_STATUS_LABELS, EQUIPMENT_STATUS_OPTIONS } from '@/lib/equipmentStatus'
import { cn } from '@/lib/utils'
import type { EquipmentItem, EquipmentStatus } from '@/types/entities'

const STATUS_TONE: Record<EquipmentStatus, BadgeTone> = {
  a_prevoir: 'muted',
  pret: 'warning',
  charge: 'warning',
  installe: 'success',
  recupere: 'success',
}

interface EquipmentItemCardProps {
  item: EquipmentItem
  onEdit: (item: EquipmentItem) => void
  onStatusChange: (id: string, status: EquipmentStatus) => void
  onDelete: (item: EquipmentItem) => void
}

export function EquipmentItemCard({ item, onEdit, onStatusChange, onDelete }: EquipmentItemCardProps) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <button type="button" onClick={() => onEdit(item)} className="min-w-0 flex-1 text-left">
            <p className="truncate font-heading text-base font-semibold text-foreground hover:underline">{item.name}</p>
            {item.category && <p className="truncate text-xs text-muted-foreground">{item.category}</p>}
          </button>
          <button
            type="button"
            aria-label={`Supprimer ${item.name}`}
            onClick={() => onDelete(item)}
            className="shrink-0 relative rounded-md p-1.5 text-muted-foreground transition-colors after:absolute after:-inset-3.5 hover:bg-accent hover:text-risk"
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span>Quantité : {item.quantity}</span>
          <span>{EQUIPMENT_ACQUISITION_MODE_LABELS[item.acquisitionMode]}</span>
        </div>

        <Badge className={cn('w-fit border-transparent font-medium', toneClass(STATUS_TONE[item.status]))}>
          {EQUIPMENT_STATUS_LABELS[item.status]}
        </Badge>

        {item.notes && <p className="text-xs text-muted-foreground">{item.notes}</p>}

        <Select value={item.status} onValueChange={(v) => onStatusChange(item.id, v as EquipmentStatus)}>
          <SelectTrigger className="w-full" aria-label={`Statut de ${item.name}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EQUIPMENT_STATUS_OPTIONS.map((status) => (
              <SelectItem key={status} value={status}>
                {EQUIPMENT_STATUS_LABELS[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  )
}
