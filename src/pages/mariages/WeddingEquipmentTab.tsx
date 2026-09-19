import { useState } from 'react'
import { Plus, Printer } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EmptyState } from '@/components/EmptyState'
import { EquipmentItemCard } from '@/features/equipment/components/EquipmentItemCard'
import { EquipmentItemForm } from '@/features/equipment/components/EquipmentItemForm'
import type { EquipmentItemFormValues } from '@/features/equipment/equipmentForm.schema'
import { downloadJson } from '@/lib/downloadFile'
import { EQUIPMENT_STATUS_LABELS, EQUIPMENT_STATUS_OPTIONS } from '@/lib/equipmentStatus'
import { useWorkspaceStore } from '@/store/workspaceStore'
import type { WeddingOutletContext } from '@/pages/mariages/WeddingLayout'
import type { EquipmentItem, EquipmentStatus } from '@/types/entities'

export function WeddingEquipmentTab() {
  const { wedding } = useOutletContext<WeddingOutletContext>()
  const allItems = useWorkspaceStore((s) => s.workspace.equipmentItems)
  const addEquipmentItem = useWorkspaceStore((s) => s.addEquipmentItem)
  const updateEquipmentItem = useWorkspaceStore((s) => s.updateEquipmentItem)
  const updateEquipmentItemStatus = useWorkspaceStore((s) => s.updateEquipmentItemStatus)
  const deleteEquipmentItem = useWorkspaceStore((s) => s.deleteEquipmentItem)

  const items = allItems.filter((e) => e.weddingId === wedding.id)
  const categories = Array.from(new Set(items.map((e) => e.category).filter((c): c is string => Boolean(c)))).sort()

  const [formOpen, setFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<EquipmentItem | null>(null)
  const [pendingDelete, setPendingDelete] = useState<EquipmentItem | null>(null)
  const [statusFilter, setStatusFilter] = useState<EquipmentStatus | 'tous'>('tous')
  const [categoryFilter, setCategoryFilter] = useState('toutes')

  const filtered = items
    .filter((e) => statusFilter === 'tous' || e.status === statusFilter)
    .filter((e) => categoryFilter === 'toutes' || e.category === categoryFilter)

  const openCreate = () => {
    setEditingItem(null)
    setFormOpen(true)
  }
  const openEdit = (item: EquipmentItem) => {
    setEditingItem(item)
    setFormOpen(true)
  }

  const handleSubmit = (values: EquipmentItemFormValues) => {
    const patch = {
      name: values.name.trim(),
      quantity: Number(values.quantity),
      category: values.category.trim() || undefined,
      acquisitionMode: values.acquisitionMode as EquipmentItem['acquisitionMode'],
      status: values.status as EquipmentStatus,
      notes: values.notes.trim() || undefined,
    }

    if (editingItem) {
      updateEquipmentItem(editingItem.id, patch)
      toast.success('Élément mis à jour.')
    } else {
      addEquipmentItem({ ...patch, weddingId: wedding.id })
      toast.success('Élément ajouté.')
    }
    setFormOpen(false)
  }

  const confirmDelete = () => {
    if (!pendingDelete) return
    deleteEquipmentItem(pendingDelete.id)
    setPendingDelete(null)
    toast.success('Élément supprimé.')
  }

  const handleExportJson = () => {
    downloadJson(`materiel-${wedding.id}.json`, items)
    toast.success('Checklist exportée en JSON.')
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="no-print flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">Matériel</h1>
          <p className="mt-1 text-sm text-muted-foreground">Checklist du matériel nécessaire pour ce mariage.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleExportJson}>
            Exporter en JSON
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="size-4" aria-hidden="true" />
            Imprimer
          </Button>
          <Button onClick={openCreate}>
            <Plus className="size-4" aria-hidden="true" />
            Ajouter un élément
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState description="Aucun élément pour l'instant — ajoutez ce dont vous avez besoin pour ce mariage." />
      ) : (
        <>
          <div className="no-print flex flex-wrap gap-3">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as EquipmentStatus | 'tous')}>
              <SelectTrigger className="w-52" aria-label="Filtrer par statut">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les statuts</SelectItem>
                {EQUIPMENT_STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {EQUIPMENT_STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {categories.length > 0 && (
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-52" aria-label="Filtrer par catégorie">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="toutes">Toutes catégories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {filtered.length === 0 ? (
            <EmptyState description="Aucun élément pour ces filtres." />
          ) : (
            <div className="print-area grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((item) => (
                <EquipmentItemCard
                  key={item.id}
                  item={item}
                  onEdit={openEdit}
                  onStatusChange={updateEquipmentItemStatus}
                  onDelete={setPendingDelete}
                />
              ))}
            </div>
          )}
        </>
      )}

      <EquipmentItemForm
        key={formOpen ? (editingItem?.id ?? 'new') : 'closed'}
        open={formOpen}
        onOpenChange={setFormOpen}
        item={editingItem}
        onSubmit={handleSubmit}
      />

      <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer « {pendingDelete?.name} » ?</AlertDialogTitle>
            <AlertDialogDescription>Cet élément sera définitivement supprimé. Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
