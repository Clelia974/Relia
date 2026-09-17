import { useState } from 'react'
import { addDays } from 'date-fns'
import { Plus } from 'lucide-react'
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
import { VendorCard } from '@/features/vendors/components/VendorCard'
import { VendorEmptyState } from '@/features/vendors/components/VendorEmptyState'
import { VendorForm } from '@/features/vendors/components/VendorForm'
import { VendorSummary } from '@/features/vendors/components/VendorSummary'
import type { VendorFormValues } from '@/features/vendors/vendorForm.schema'
import { isVendorConfirmed } from '@/lib/vendorStatus'
import { useWorkspaceStore } from '@/store/workspaceStore'
import type { WeddingOutletContext } from '@/pages/mariages/WeddingLayout'
import type { Vendor, VendorCategory, VendorStatus } from '@/types/entities'

function toVendorPatch(values: VendorFormValues) {
  return {
    name: values.name.trim(),
    company: values.company.trim() || undefined,
    category: values.category as VendorCategory,
    phone: values.phone.trim() || undefined,
    email: values.email.trim() || undefined,
    arrivalTime: values.arrivalTime || undefined,
    status: values.status as VendorStatus,
    notes: values.notes.trim() || undefined,
  }
}

function toCostPatch(values: VendorFormValues) {
  return {
    estimatedCost: values.estimatedCost === '' ? undefined : Number(values.estimatedCost),
    actualCost: values.actualCost === '' ? undefined : Number(values.actualCost),
  }
}

export function WeddingVendorsTab() {
  const { wedding } = useOutletContext<WeddingOutletContext>()
  const allVendors = useWorkspaceStore((s) => s.workspace.vendors)
  const vendors = allVendors.filter((v) => v.weddingIds.includes(wedding.id))
  const allVendorWeddingLinks = useWorkspaceStore((s) => s.workspace.vendorWeddingLinks)
  const vendorLinks = allVendorWeddingLinks.filter((l) => l.weddingId === wedding.id)
  const linkByVendorId = new Map(vendorLinks.map((l) => [l.vendorId, l]))
  const tasks = useWorkspaceStore((s) => s.workspace.tasks)
  const addVendor = useWorkspaceStore((s) => s.addVendor)
  const updateVendor = useWorkspaceStore((s) => s.updateVendor)
  const setVendorCostForWedding = useWorkspaceStore((s) => s.setVendorCostForWedding)
  const markVendorConfirmed = useWorkspaceStore((s) => s.markVendorConfirmed)
  const removeVendorFromWedding = useWorkspaceStore((s) => s.removeVendorFromWedding)
  const addTask = useWorkspaceStore((s) => s.addTask)
  const completeTask = useWorkspaceStore((s) => s.completeTask)

  const [formOpen, setFormOpen] = useState(false)
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Vendor | null>(null)
  const [taskPromptVendor, setTaskPromptVendor] = useState<Vendor | null>(null)
  const [completeTaskPrompt, setCompleteTaskPrompt] = useState<{ vendorName: string; taskId: string; taskTitle: string } | null>(null)

  const openCreate = () => {
    setEditingVendor(null)
    setFormOpen(true)
  }
  const openEdit = (vendor: Vendor) => {
    setEditingVendor(vendor)
    setFormOpen(true)
  }

  const promptCompleteTaskIfNeeded = (vendor: Vendor) => {
    const openAutoTasks = tasks.filter((t) => t.vendorId === vendor.id && t.source === 'automatic' && t.status !== 'terminee')
    if (openAutoTasks.length === 1) {
      setCompleteTaskPrompt({ vendorName: vendor.name, taskId: openAutoTasks[0].id, taskTitle: openAutoTasks[0].title })
    }
  }

  const handleSubmit = (values: VendorFormValues) => {
    const patch = toVendorPatch(values)
    const costPatch = toCostPatch(values)

    if (editingVendor) {
      updateVendor(editingVendor.id, patch)
      setVendorCostForWedding(editingVendor.id, wedding.id, costPatch)
      toast.success('Prestataire mis à jour.')
      setFormOpen(false)
      if (!isVendorConfirmed(editingVendor.status) && isVendorConfirmed(patch.status)) {
        promptCompleteTaskIfNeeded({ ...editingVendor, ...patch })
      }
      return
    }

    const id = addVendor({ ...patch, ...costPatch, weddingIds: [wedding.id] })
    toast.success('Prestataire ajouté.')
    setFormOpen(false)

    const hasOpenAutoTask = tasks.some((t) => t.vendorId === id && t.source === 'automatic' && t.status !== 'terminee')
    if (!isVendorConfirmed(patch.status) && !hasOpenAutoTask) {
      setTaskPromptVendor({ id, ...patch, weddingIds: [wedding.id] })
    }
  }

  const handleMarkConfirmed = (vendor: Vendor) => {
    markVendorConfirmed(vendor.id)
    toast.success(`${vendor.name} marqué comme confirmé.`)
    promptCompleteTaskIfNeeded(vendor)
  }

  const confirmDelete = () => {
    if (!pendingDelete) return
    const isLastLink = pendingDelete.weddingIds.length <= 1
    removeVendorFromWedding(pendingDelete.id, wedding.id)
    setPendingDelete(null)
    toast.success(isLastLink ? 'Prestataire supprimé.' : 'Prestataire retiré de ce mariage.')
  }

  const createConfirmationTask = () => {
    if (!taskPromptVendor) return
    const dueDate = new Date(Math.min(addDays(new Date(), 3).getTime(), new Date(wedding.date).getTime())).toISOString()
    addTask({
      title: `Confirmer ${taskPromptVendor.category} — ${taskPromptVendor.name}`,
      weddingId: wedding.id,
      vendorId: taskPromptVendor.id,
      status: 'a_faire',
      dueDate,
      source: 'automatic',
    })
    toast.success('Tâche de confirmation créée.')
    setTaskPromptVendor(null)
  }

  const confirmCompleteTask = () => {
    if (!completeTaskPrompt) return
    completeTask(completeTaskPrompt.taskId)
    toast.success('Tâche de confirmation terminée.')
    setCompleteTaskPrompt(null)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground">Prestataires</h1>
        <p className="mt-1 text-sm text-muted-foreground">Coordonnez les personnes qui donnent vie à ce mariage.</p>
      </div>

      {vendors.length === 0 ? (
        <VendorEmptyState onAdd={openCreate} />
      ) : (
        <>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <VendorSummary vendors={vendors} />
            <Button onClick={openCreate}>
              <Plus className="size-4" aria-hidden="true" />
              Ajouter un prestataire
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {vendors.map((vendor) => (
              <VendorCard
                key={vendor.id}
                vendor={vendor}
                weddingDate={wedding.date}
                costForThisWedding={linkByVendorId.get(vendor.id)}
                onEdit={openEdit}
                onDelete={setPendingDelete}
                onMarkConfirmed={handleMarkConfirmed}
              />
            ))}
          </div>
        </>
      )}

      <VendorForm
        key={formOpen ? (editingVendor?.id ?? 'new') : 'closed'}
        open={formOpen}
        onOpenChange={setFormOpen}
        vendor={editingVendor}
        costForThisWedding={editingVendor ? linkByVendorId.get(editingVendor.id) : undefined}
        onSubmit={handleSubmit}
      />

      <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          {pendingDelete && pendingDelete.weddingIds.length > 1 ? (
            <AlertDialogHeader>
              <AlertDialogTitle>Retirer ce prestataire de ce mariage ?</AlertDialogTitle>
              <AlertDialogDescription>
                {pendingDelete.name} sera retiré de ce mariage uniquement. Ses coûts et son historique pour vos
                autres mariages seront conservés. Les tâches liées à ce mariage seront conservées, sans lien vers ce
                prestataire. Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
          ) : (
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer ce prestataire ?</AlertDialogTitle>
              <AlertDialogDescription>
                {pendingDelete?.name} n'est lié à aucun autre mariage — il sera définitivement supprimé. Les tâches
                déjà créées seront conservées, sans lien vers ce prestataire. Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              {pendingDelete && pendingDelete.weddingIds.length > 1 ? 'Retirer' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={taskPromptVendor !== null} onOpenChange={(open) => !open && setTaskPromptVendor(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Créer une tâche de confirmation pour ce prestataire ?</AlertDialogTitle>
            <AlertDialogDescription>
              Une tâche « Confirmer {taskPromptVendor?.category} — {taskPromptVendor?.name} » sera ajoutée à vos
              tâches à faire.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Non merci</AlertDialogCancel>
            <AlertDialogAction onClick={createConfirmationTask}>Créer la tâche</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={completeTaskPrompt !== null} onOpenChange={(open) => !open && setCompleteTaskPrompt(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Terminer la tâche de confirmation ?</AlertDialogTitle>
            <AlertDialogDescription>
              « {completeTaskPrompt?.taskTitle} » peut être marquée comme terminée puisque {completeTaskPrompt?.vendorName}{' '}
              est maintenant confirmé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Non</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCompleteTask}>Terminer la tâche</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
