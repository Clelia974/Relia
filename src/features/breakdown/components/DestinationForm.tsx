import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EQUIPMENT_DESTINATION_LABELS, EQUIPMENT_DESTINATION_OPTIONS } from '@/lib/equipmentDestination'
import { useWorkspaceStore } from '@/store/workspaceStore'
import type { EquipmentDestination, EquipmentItem } from '@/types/entities'

interface DestinationFormProps {
  item: EquipmentItem
  onDone: () => void
}

export function DestinationForm({ item, onDone }: DestinationFormProps) {
  const updateEquipmentItem = useWorkspaceStore((s) => s.updateEquipmentItem)
  const [destination, setDestination] = useState<EquipmentDestination | ''>(item.destination ?? '')
  const [notes, setNotes] = useState(item.destinationNotes ?? '')

  const handleSave = () => {
    if (!destination) return
    updateEquipmentItem(item.id, { destination, destinationNotes: notes.trim() || undefined })
    onDone()
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-border bg-muted/40 p-2.5">
      <Select value={destination} onValueChange={(v) => setDestination(v as EquipmentDestination)}>
        <SelectTrigger className="w-full text-sm">
          <SelectValue placeholder="Choisir une destination" />
        </SelectTrigger>
        <SelectContent>
          {EQUIPMENT_DESTINATION_OPTIONS.map((d) => (
            <SelectItem key={d} value={d}>
              {EQUIPMENT_DESTINATION_LABELS[d]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        placeholder="Détails (ex. adresse du fournisseur)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="text-sm"
      />
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={handleSave} disabled={!destination}>
          Enregistrer la destination
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDone}>
          Annuler
        </Button>
      </div>
    </div>
  )
}
