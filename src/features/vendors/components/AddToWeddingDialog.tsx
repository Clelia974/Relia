import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useReturnFocus } from '@/lib/useReturnFocus'
import type { Vendor, Wedding } from '@/types/entities'

interface AddToWeddingDialogProps {
  vendor: Vendor
  weddings: Wedding[]
  onOpenChange: (open: boolean) => void
  onConfirm: (weddingId: string) => void
}

/** Le parent monte ce composant uniquement quand il doit être ouvert (état initial vierge à chaque ouverture). */
export function AddToWeddingDialog({ vendor, weddings, onOpenChange, onConfirm }: AddToWeddingDialogProps) {
  const available = weddings.filter((w) => !w.archived && !vendor.weddingIds.includes(w.id))
  const returnFocus = useReturnFocus()
  const [weddingId, setWeddingId] = useState('')

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" {...returnFocus}>
        <DialogHeader>
          <DialogTitle>Ajouter à un mariage</DialogTitle>
          <DialogDescription>
            {vendor.name} reçoit une affectation vierge (« À contacter ») : ses coûts, son horaire et ses notes seront propres à ce mariage.
          </DialogDescription>
        </DialogHeader>
        {available.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ce prestataire est déjà lié à tous vos mariages actifs.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="add-to-wedding">Mariage</Label>
            <Select value={weddingId} onValueChange={setWeddingId}>
              <SelectTrigger id="add-to-wedding" className="w-full">
                <SelectValue placeholder="Choisir un mariage" />
              </SelectTrigger>
              <SelectContent>
                {available.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.coupleName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button type="button" disabled={!weddingId} onClick={() => onConfirm(weddingId)}>
            Ajouter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
