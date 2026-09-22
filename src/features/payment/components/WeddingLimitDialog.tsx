import { useNavigate } from 'react-router-dom'
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
import { GRATUIT_WEDDING_LIMIT } from '@/features/payment/weddingLimit'

interface WeddingLimitDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Jamais agressif : explique la limite, propose le Pro, laisse toujours "Annuler" — pas de blocage brutal sans échappatoire. */
export function WeddingLimitDialog({ open, onOpenChange }: WeddingLimitDialogProps) {
  const navigate = useNavigate()

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Limite de la version Gratuite atteinte</AlertDialogTitle>
          <AlertDialogDescription>
            La version Gratuite est limitée à {GRATUIT_WEDDING_LIMIT} mariages. Passez au Pro pour créer des mariages
            en illimité, en plus de la sauvegarde en ligne multi-appareil.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={() => navigate('/paiement')}>Passer au Pro</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
