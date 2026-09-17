import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useWorkspaceStore } from '@/store/workspaceStore'
import type { EquipmentItem } from '@/types/entities'

interface DamageFormProps {
  item: EquipmentItem
  onDone: () => void
}

export function DamageForm({ item, onDone }: DamageFormProps) {
  const updateEquipmentItem = useWorkspaceStore((s) => s.updateEquipmentItem)
  const [notes, setNotes] = useState(item.damageNotes ?? '')

  const handleSave = () => {
    updateEquipmentItem(item.id, { isDamaged: true, damageNotes: notes.trim() || undefined })
    onDone()
  }

  const handleClear = () => {
    updateEquipmentItem(item.id, { isDamaged: false, damageNotes: undefined })
    onDone()
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-risk/30 bg-risk/5 p-2.5">
      <Textarea
        placeholder="Ex. pied cassé, tissu taché…"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        className="text-sm"
      />
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={handleSave}>
          Enregistrer le dégât
        </Button>
        {item.isDamaged && (
          <Button type="button" size="sm" variant="outline" onClick={handleClear}>
            Retirer
          </Button>
        )}
        <Button type="button" size="sm" variant="ghost" onClick={onDone}>
          Annuler
        </Button>
      </div>
    </div>
  )
}
