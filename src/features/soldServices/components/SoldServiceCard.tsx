import { Check, ClipboardPlus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SOLD_SERVICE_STATUS_LABELS, SOLD_SERVICE_STATUS_OPTIONS } from '@/lib/soldServiceStatus'
import type { SoldService, SoldServiceStatus } from '@/types/entities'

const currency = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

interface SoldServiceCardProps {
  soldService: SoldService
  onStatusChange: (id: string, status: SoldServiceStatus) => void
  onCreateTask: (soldService: SoldService) => void
  onDelete: (soldService: SoldService) => void
}

export function SoldServiceCard({ soldService, onStatusChange, onCreateTask, onDelete }: SoldServiceCardProps) {
  const retiree = soldService.status === 'retiree'

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className={`truncate font-heading text-base font-semibold text-foreground ${retiree ? 'line-through opacity-60' : ''}`}>
              {soldService.title}
            </p>
            {soldService.description && <p className="mt-0.5 text-xs text-muted-foreground">{soldService.description}</p>}
          </div>
          <button
            type="button"
            aria-label={`Supprimer ${soldService.title}`}
            onClick={() => onDelete(soldService)}
            className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-risk"
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          {soldService.quantity !== undefined && <span className="text-muted-foreground">Quantité : {soldService.quantity}</span>}
          <span className="font-medium tabular-nums text-foreground">{currency.format(soldService.soldPrice)}</span>
        </div>

        {soldService.notes && <p className="text-xs text-muted-foreground">{soldService.notes}</p>}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
          <Select value={soldService.status} onValueChange={(v) => onStatusChange(soldService.id, v as SoldServiceStatus)}>
            <SelectTrigger className="w-52" aria-label={`Statut de ${soldService.title}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SOLD_SERVICE_STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} value={status}>
                  {SOLD_SERVICE_STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {soldService.taskId ? (
            <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Check className="size-3.5" aria-hidden="true" />
              Tâche de préparation créée
            </span>
          ) : (
            <Button variant="outline" size="sm" onClick={() => onCreateTask(soldService)}>
              <ClipboardPlus className="size-4" aria-hidden="true" />
              Créer une tâche de préparation
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
