import { Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EQUIPMENT_ACQUISITION_MODE_LABELS } from '@/lib/equipmentAcquisitionMode'
import { EQUIPMENT_STATUS_LABELS, EQUIPMENT_STATUS_OPTIONS } from '@/lib/equipmentStatus'
import type { EquipmentItem, EquipmentStatus } from '@/types/entities'

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
            className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-risk"
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span>Quantité : {item.quantity}</span>
          <span>{EQUIPMENT_ACQUISITION_MODE_LABELS[item.acquisitionMode]}</span>
        </div>

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
