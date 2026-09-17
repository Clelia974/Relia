import { useState } from 'react'
import { TriangleAlert } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { DamageForm } from '@/features/breakdown/components/DamageForm'
import { DestinationForm } from '@/features/breakdown/components/DestinationForm'
import { EQUIPMENT_DESTINATION_LABELS } from '@/lib/equipmentDestination'
import { useWorkspaceStore } from '@/store/workspaceStore'
import type { EquipmentItem } from '@/types/entities'

interface BreakdownItemCardProps {
  item: EquipmentItem
}

export function BreakdownItemCard({ item }: BreakdownItemCardProps) {
  const updateEquipmentItemStatus = useWorkspaceStore((s) => s.updateEquipmentItemStatus)
  const [showDamage, setShowDamage] = useState(false)
  const [showDestination, setShowDestination] = useState(false)

  const isReturned = item.status === 'recupere'

  return (
    <Card>
      <CardContent className="flex flex-col gap-2.5">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={isReturned}
            onCheckedChange={(checked) => updateEquipmentItemStatus(item.id, checked ? 'recupere' : 'installe')}
            aria-label={isReturned ? 'Marquer comme non récupéré' : 'Marquer comme récupéré'}
            className="mt-0.5"
          />
          <div className="min-w-0 flex-1">
            <p className={`font-medium text-foreground ${isReturned ? 'text-muted-foreground line-through' : ''}`}>{item.name}</p>
            <p className="text-xs text-muted-foreground">Quantité : {item.quantity}</p>
          </div>
        </div>

        {item.notes && <p className="pl-7 text-xs text-muted-foreground">{item.notes}</p>}

        {showDamage ? (
          <DamageForm item={item} onDone={() => setShowDamage(false)} />
        ) : item.isDamaged ? (
          <button
            type="button"
            onClick={() => setShowDamage(true)}
            className="flex items-start gap-1.5 rounded-md border border-risk/30 bg-risk/10 px-2.5 py-1.5 text-left text-xs text-risk"
          >
            <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            Endommagé{item.damageNotes ? ` — ${item.damageNotes}` : ''}
          </button>
        ) : (
          <Button type="button" variant="outline" size="sm" onClick={() => setShowDamage(true)} className="w-fit">
            Signaler un dégât
          </Button>
        )}

        {showDestination ? (
          <DestinationForm item={item} onDone={() => setShowDestination(false)} />
        ) : item.destination ? (
          <button
            type="button"
            onClick={() => setShowDestination(true)}
            className="w-fit rounded-md border border-border bg-muted/40 px-2.5 py-1.5 text-left text-xs text-muted-foreground"
          >
            {EQUIPMENT_DESTINATION_LABELS[item.destination]}
            {item.destinationNotes ? ` — ${item.destinationNotes}` : ''}
          </button>
        ) : isReturned ? (
          <Button type="button" variant="outline" size="sm" onClick={() => setShowDestination(true)} className="w-fit">
            Indiquer la destination
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}
