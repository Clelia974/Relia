import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Link, useOutletContext } from 'react-router-dom'
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EmptyState } from '@/components/EmptyState'
import { SoldServiceCard } from '@/features/soldServices/components/SoldServiceCard'
import { SoldServiceForm } from '@/features/soldServices/components/SoldServiceForm'
import type { SoldServiceFormValues } from '@/features/soldServices/soldServiceForm.schema'
import { SOLD_SERVICE_STATUS_LABELS, SOLD_SERVICE_STATUS_OPTIONS } from '@/lib/soldServiceStatus'
import { useWorkspaceStore } from '@/store/workspaceStore'
import type { WeddingOutletContext } from '@/pages/mariages/WeddingLayout'
import type { SoldService, SoldServiceStatus } from '@/types/entities'

export function WeddingSoldServicesTab() {
  const { wedding } = useOutletContext<WeddingOutletContext>()
  const allProposals = useWorkspaceStore((s) => s.workspace.proposals)
  const allSoldServices = useWorkspaceStore((s) => s.workspace.soldServices)
  const generateSoldServicesFromProposal = useWorkspaceStore((s) => s.generateSoldServicesFromProposal)
  const addSoldService = useWorkspaceStore((s) => s.addSoldService)
  const updateSoldServiceStatus = useWorkspaceStore((s) => s.updateSoldServiceStatus)
  const deleteSoldService = useWorkspaceStore((s) => s.deleteSoldService)
  const createTaskFromSoldService = useWorkspaceStore((s) => s.createTaskFromSoldService)

  const soldServices = allSoldServices.filter((s) => s.weddingId === wedding.id)
  const approvedProposals = allProposals.filter((p) => p.weddingId === wedding.id && p.status === 'approuvee')
  const generatedProposalIds = new Set(soldServices.map((s) => s.proposalId))
  const pendingProposals = approvedProposals.filter((p) => !generatedProposalIds.has(p.id))
  // Rattache les prestations ajoutées manuellement à la proposition la plus
  // récemment matérialisée — en pratique un mariage n'a qu'une seule
  // proposition approuvée à la fois, ce cas courant reste donc simple.
  const primaryProposalId = soldServices.at(-1)?.proposalId

  const [generateDialogOpen, setGenerateDialogOpen] = useState(false)
  const [selectedProposalId, setSelectedProposalId] = useState('')
  const [addFormOpen, setAddFormOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<SoldService | null>(null)
  const [statusFilter, setStatusFilter] = useState<SoldServiceStatus | 'toutes'>('toutes')

  const filtered = statusFilter === 'toutes' ? soldServices : soldServices.filter((s) => s.status === statusFilter)

  const handleGenerate = (proposalId: string) => {
    const created = generateSoldServicesFromProposal(proposalId)
    setGenerateDialogOpen(false)
    if (created.length > 0) {
      toast.success(`${created.length} prestation${created.length > 1 ? 's' : ''} vendue${created.length > 1 ? 's' : ''} générée${created.length > 1 ? 's' : ''}.`)
    } else {
      toast.error('Aucune ligne incluse à générer pour cette proposition.')
    }
  }

  const openGenerateFlow = () => {
    if (pendingProposals.length === 1) {
      handleGenerate(pendingProposals[0].id)
      return
    }
    setSelectedProposalId(pendingProposals[0]?.id ?? '')
    setGenerateDialogOpen(true)
  }

  const handleAddSubmit = (values: SoldServiceFormValues) => {
    if (!primaryProposalId) return
    addSoldService({
      weddingId: wedding.id,
      proposalId: primaryProposalId,
      title: values.title.trim(),
      description: values.description.trim() || undefined,
      quantity: values.quantity === '' ? undefined : Number(values.quantity),
      soldPrice: Number(values.soldPrice),
      status: 'ajoutee_ulterieurement',
      notes: values.notes.trim() || undefined,
    })
    toast.success('Prestation ajoutée.')
    setAddFormOpen(false)
  }

  const handleCreateTask = (soldService: SoldService) => {
    const taskId = createTaskFromSoldService(soldService.id)
    if (taskId) toast.success('Tâche de préparation créée.')
  }

  const confirmDelete = () => {
    if (!pendingDelete) return
    deleteSoldService(pendingDelete.id)
    setPendingDelete(null)
    toast.success('Prestation supprimée.')
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground">Prestations vendues</h1>
        <p className="mt-1 text-sm text-muted-foreground">Ce qui a réellement été vendu au client, une fois une proposition approuvée.</p>
      </div>

      {soldServices.length === 0 ? (
        approvedProposals.length === 0 ? (
          <EmptyState
            description={
              <>
                Aucune proposition approuvée pour ce mariage —{' '}
                <Link to={`/mariages/${wedding.id}/documents`} className="text-foreground underline">
                  approuvez une proposition
                </Link>{' '}
                pour générer les prestations vendues.
              </>
            }
          />
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">Générez les prestations vendues à partir d'une proposition approuvée.</p>
            <Button onClick={openGenerateFlow}>Générer les prestations vendues</Button>
          </div>
        )
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as SoldServiceStatus | 'toutes')}>
              <SelectTrigger className="w-56" aria-label="Filtrer par statut">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="toutes">Tous les statuts</SelectItem>
                {SOLD_SERVICE_STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {SOLD_SERVICE_STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex flex-wrap gap-2">
              {pendingProposals.length > 0 && (
                <Button variant="outline" onClick={openGenerateFlow}>
                  Générer depuis une autre proposition approuvée
                </Button>
              )}
              <Button onClick={() => setAddFormOpen(true)}>
                <Plus className="size-4" aria-hidden="true" />
                Ajouter une prestation
              </Button>
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState description="Aucune prestation pour ce statut." />
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((soldService) => (
                <SoldServiceCard
                  key={soldService.id}
                  soldService={soldService}
                  onStatusChange={updateSoldServiceStatus}
                  onCreateTask={handleCreateTask}
                  onDelete={setPendingDelete}
                />
              ))}
            </div>
          )}
        </>
      )}

      <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Choisir une proposition</DialogTitle>
            <DialogDescription>Plusieurs propositions approuvées existent pour ce mariage — laquelle utiliser ?</DialogDescription>
          </DialogHeader>
          <RadioGroup value={selectedProposalId} onValueChange={setSelectedProposalId} className="gap-3">
            {pendingProposals.map((p) => (
              <div key={p.id} className="flex items-start gap-2.5">
                <RadioGroupItem value={p.id} id={`gen-${p.id}`} className="mt-0.5" />
                <Label htmlFor={`gen-${p.id}`} className="font-normal text-foreground">
                  {p.title}
                </Label>
              </div>
            ))}
          </RadioGroup>
          <div className="flex justify-end">
            <Button onClick={() => selectedProposalId && handleGenerate(selectedProposalId)} disabled={!selectedProposalId}>
              Générer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <SoldServiceForm key={addFormOpen ? 'open' : 'closed'} open={addFormOpen} onOpenChange={setAddFormOpen} onSubmit={handleAddSubmit} />

      <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer « {pendingDelete?.title} » ?</AlertDialogTitle>
            <AlertDialogDescription>Cette prestation vendue sera définitivement supprimée. Cette action est irréversible.</AlertDialogDescription>
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
