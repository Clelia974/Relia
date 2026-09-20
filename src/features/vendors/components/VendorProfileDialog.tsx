import { useState } from 'react'
import { Clock, Mail, Pencil, Phone, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { CostReviewBadge } from '@/components/CostReviewBadge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AddToWeddingDialog } from '@/features/vendors/components/AddToWeddingDialog'
import { VendorForm } from '@/features/vendors/components/VendorForm'
import { VendorStatusBadge } from '@/features/vendors/components/VendorStatusBadge'
import { getVendorAssignments } from '@/features/vendors/assignments'
import type { VendorFormValues } from '@/features/vendors/vendorForm.schema'
import { currency } from '@/lib/currency'
import { useReturnFocus } from '@/lib/useReturnFocus'
import { useWorkspaceStore } from '@/store/workspaceStore'
import type { VendorCategory } from '@/types/entities'

interface VendorProfileDialogProps {
  /** null = fermé. */
  vendorId: string | null
  onClose: () => void
}

/** Fiche prestataire : informations catalogue globales + une affectation par mariage lié. Aucune route dédiée (dialogue). */
export function VendorProfileDialog({ vendorId, onClose }: VendorProfileDialogProps) {
  const vendor = useWorkspaceStore((s) => s.workspace.vendors.find((v) => v.id === vendorId))
  const links = useWorkspaceStore((s) => s.workspace.vendorWeddingLinks)
  const weddings = useWorkspaceStore((s) => s.workspace.weddings)
  const updateVendor = useWorkspaceStore((s) => s.updateVendor)
  const addVendorToWedding = useWorkspaceStore((s) => s.addVendorToWedding)

  const returnFocus = useReturnFocus()
  const [editing, setEditing] = useState(false)
  const [adding, setAdding] = useState(false)

  if (!vendor) return null

  const assignments = getVendorAssignments(vendor, links)
  const weddingById = new Map(weddings.map((w) => [w.id, w]))

  const handleGlobalSubmit = (values: VendorFormValues) => {
    updateVendor(vendor.id, {
      name: values.name.trim(),
      company: values.company.trim() || undefined,
      category: values.category as VendorCategory,
      phone: values.phone.trim() || undefined,
      email: values.email.trim() || undefined,
      notes: values.notes.trim() || undefined,
    })
    toast.success('Fiche prestataire mise à jour.')
    setEditing(false)
  }

  return (
    <>
      <Dialog open={!editing && !adding} onOpenChange={(open) => !open && onClose()}>
        <DialogContent
          className="max-h-[90dvh] max-w-xl overflow-y-auto"
          onOpenAutoFocus={returnFocus.onOpenAutoFocus}
          onCloseAutoFocus={(event) => {
            // Passage vers le formulaire / dialogue d'ajout : on garde le déclencheur d'origine pour la fermeture finale.
            if (editing || adding) {
              event.preventDefault()
              return
            }
            returnFocus.onCloseAutoFocus(event)
          }}
        >
          <DialogHeader>
            <DialogTitle>{vendor.name}</DialogTitle>
            <DialogDescription>
              Fiche prestataire · {vendor.category}
              {vendor.company ? ` · ${vendor.company}` : ''}
            </DialogDescription>
          </DialogHeader>

          <section aria-labelledby="vp-general" className="flex flex-col gap-2 text-sm">
            <h3 id="vp-general" className="font-heading text-sm font-semibold text-foreground">
              Informations générales
            </h3>
            {vendor.phone || vendor.email ? (
              <div className="flex flex-col gap-1">
                {vendor.phone && (
                  <a href={`tel:${vendor.phone}`} className="flex items-center gap-1.5 text-foreground hover:underline">
                    <Phone className="size-3.5 text-muted-foreground" aria-hidden="true" />
                    {vendor.phone}
                  </a>
                )}
                {vendor.email && (
                  <a href={`mailto:${vendor.email}`} className="flex items-center gap-1.5 text-foreground hover:underline">
                    <Mail className="size-3.5 text-muted-foreground" aria-hidden="true" />
                    {vendor.email}
                  </a>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">Aucune coordonnée renseignée.</p>
            )}
            {vendor.notes && <p className="whitespace-pre-line text-muted-foreground">{vendor.notes}</p>}
            <div className="flex flex-wrap gap-2 pt-1">
              <Button type="button" size="sm" variant="outline" onClick={() => setEditing(true)}>
                <Pencil className="size-3.5" aria-hidden="true" />
                Modifier la fiche
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setAdding(true)}>
                <Plus className="size-3.5" aria-hidden="true" />
                Ajouter à un mariage
              </Button>
            </div>
          </section>

          <section aria-labelledby="vp-weddings" className="flex flex-col gap-2">
            <h3 id="vp-weddings" className="font-heading text-sm font-semibold text-foreground">
              Mariages liés ({assignments.length})
            </h3>
            {assignments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Ce prestataire n'est lié à aucun mariage pour le moment.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {assignments.map(({ link }) => (
                  <li key={link.weddingId} className="flex flex-col gap-1.5 rounded-lg border border-border p-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Link
                        to={`/mariages/${link.weddingId}/prestataires`}
                        onClick={onClose}
                        className="font-medium text-foreground hover:underline"
                      >
                        {weddingById.get(link.weddingId)?.coupleName ?? 'Mariage introuvable'}
                      </Link>
                      <VendorStatusBadge status={link.status} />
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="size-3.5" aria-hidden="true" />
                        {link.arrivalTime ?? 'Horaire non renseigné'}
                      </span>
                      <span>Estimé : {link.estimatedCost !== undefined ? currency.format(link.estimatedCost) : '—'}</span>
                      <span>Réel : {link.actualCost !== undefined ? currency.format(link.actualCost) : '—'}</span>
                    </div>
                    {link.notes && <p className="text-xs text-muted-foreground">{link.notes}</p>}
                    {link.needsCostReview && <CostReviewBadge />}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </DialogContent>
      </Dialog>

      {editing && (
        <VendorForm
          key={vendor.id}
          open
          onOpenChange={(open) => !open && setEditing(false)}
          vendor={vendor}
          onSubmit={handleGlobalSubmit}
        />
      )}

      {adding && (
        <AddToWeddingDialog
          vendor={vendor}
          weddings={weddings}
          onOpenChange={(open) => !open && setAdding(false)}
          onConfirm={(weddingId) => {
            addVendorToWedding(vendor.id, weddingId)
            toast.success(`${vendor.name} ajouté à ${weddingById.get(weddingId)?.coupleName ?? 'ce mariage'}.`)
            setAdding(false)
          }}
        />
      )}
    </>
  )
}
