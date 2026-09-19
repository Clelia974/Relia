import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EmptyState } from '@/components/EmptyState'
import { BreakdownItemCard } from '@/features/breakdown/components/BreakdownItemCard'
import { BreakdownSummaryStats } from '@/features/breakdown/components/BreakdownSummaryStats'
import { buildBreakdownSummary, groupEquipmentByZone, selectPendingEquipmentItems } from '@/features/breakdown/breakdownSummary'
import { useWorkspaceStore } from '@/store/workspaceStore'
import type { WeddingOutletContext } from '@/pages/mariages/WeddingLayout'

export function WeddingBreakdownTab() {
  const { wedding } = useOutletContext<WeddingOutletContext>()
  const allItems = useWorkspaceStore((s) => s.workspace.equipmentItems)
  const allVendors = useWorkspaceStore((s) => s.workspace.vendors)
  const createBreakdownTasksForZones = useWorkspaceStore((s) => s.createBreakdownTasksForZones)

  const items = allItems.filter((e) => e.weddingId === wedding.id)
  const pending = selectPendingEquipmentItems(items, wedding.id)
  const byZone = groupEquipmentByZone(pending)
  const summary = buildBreakdownSummary(items, wedding.id)
  const vendors = allVendors.filter((v) => v.weddingIds.includes(wedding.id))

  const [showSchedule, setShowSchedule] = useState(false)
  const [dueDate, setDueDate] = useState(wedding.date.slice(0, 10))
  const [dueTime, setDueTime] = useState('18:00')
  const [vendorId, setVendorId] = useState('')

  const handleCreateTasks = () => {
    const dueIso = new Date(`${dueDate}T${dueTime}`).toISOString()
    const created = createBreakdownTasksForZones(wedding.id, dueIso, vendorId || undefined)
    setShowSchedule(false)
    if (created.length > 0) {
      toast.success(`${created.length} tâche${created.length > 1 ? 's' : ''} de démontage créée${created.length > 1 ? 's' : ''}.`)
    } else {
      toast.error('Toutes les zones ont déjà une tâche de démontage.')
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">Désinstallation</h1>
          <p className="mt-1 text-sm text-muted-foreground">Suivi de la récupération du matériel après le mariage.</p>
        </div>
        <EmptyState description="Aucun élément matériel pour ce mariage — ajoutez-en d'abord dans l'onglet Matériel." />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">Désinstallation</h1>
          <p className="mt-1 text-sm text-muted-foreground">Suivi de la récupération du matériel après le mariage.</p>
        </div>
        {pending.length > 0 && (
          <Button variant="outline" onClick={() => setShowSchedule((v) => !v)}>
            {showSchedule ? 'Annuler' : 'Commencer le démontage'}
          </Button>
        )}
      </div>

      {showSchedule && (
        <div className="flex flex-col gap-4 rounded-lg border border-border bg-card px-4 py-4">
          <p className="text-sm font-medium text-foreground">Planifier le démontage</p>
          <p className="text-xs text-muted-foreground">
            Crée une tâche de démontage par zone restant à récupérer ({byZone.size} zone{byZone.size > 1 ? 's' : ''}).
          </p>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            <Field label="Date" htmlFor="bd-date">
              <Input id="bd-date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </Field>
            <Field label="Heure" htmlFor="bd-time">
              <Input id="bd-time" type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} />
            </Field>
            <Field label="Responsable" htmlFor="bd-vendor" optional>
              <Select value={vendorId || 'aucun'} onValueChange={(v) => setVendorId(v === 'aucun' ? '' : v)}>
                <SelectTrigger id="bd-vendor" className="w-full">
                  <SelectValue placeholder="Aucun" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aucun">Aucun</SelectItem>
                  {vendors.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Button onClick={handleCreateTasks} className="w-fit">
            Créer les tâches de démontage
          </Button>
        </div>
      )}

      <BreakdownSummaryStats summary={summary} />

      {pending.length === 0 ? (
        <EmptyState description="Tous les éléments ont été récupérés." />
      ) : (
        <div className="flex flex-col gap-6">
          {[...byZone.entries()].map(([zone, zoneItems]) => (
            <div key={zone} className="flex flex-col gap-3">
              <h2 className="font-heading text-base font-semibold text-foreground">{zone}</h2>
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {zoneItems.map((item) => (
                  <BreakdownItemCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Field({
  label,
  htmlFor,
  optional,
  children,
}: {
  label: string
  htmlFor: string
  optional?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>
        {label}
        {optional && <span className="ml-1 font-normal text-muted-foreground">(facultatif)</span>}
      </Label>
      {children}
    </div>
  )
}
