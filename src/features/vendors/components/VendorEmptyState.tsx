import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function VendorEmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-start gap-4 rounded-lg border border-dashed border-border px-6 py-12">
      <div>
        <h2 className="font-heading text-lg font-semibold text-foreground">Aucun prestataire ajouté.</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Ajoutez votre premier prestataire pour commencer à coordonner ce mariage.
        </p>
      </div>
      <Button onClick={onAdd}>
        <Plus className="size-4" aria-hidden="true" />
        Ajouter un prestataire
      </Button>
    </div>
  )
}
