import { EmptyState } from '@/components/EmptyState'

export function VendorEmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <EmptyState
      title="Aucun prestataire ajouté."
      description="Ajoutez votre premier prestataire pour commencer à coordonner ce mariage."
      action={{ label: 'Ajouter un prestataire', onClick: onAdd }}
    />
  )
}
