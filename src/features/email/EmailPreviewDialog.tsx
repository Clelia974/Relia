import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface EmailPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientName: string
  /** Nom affiché comme expéditeur — celui de la décoratrice, jamais "SilkyPlace" (cf. businessConfig.companyName, avec repli). */
  senderName: string
  subject: string
  /** Phrase fixe décrivant ce qui est partagé (ex. "vous a préparé un devis — vous pouvez le consulter directement en ligne :"). */
  introText: string
  /** Lien réel si déjà connu (relance), sinon un espace réservé — le vrai lien n'existe qu'après l'envoi pour un premier partage. */
  linkPreview?: string
  isSending: boolean
  onConfirm: (customMessage: string) => void
  confirmLabel?: string
}

/**
 * Aperçu de l'email avant tout envoi (devis, facture, contrat, relance) —
 * la décoratrice doit toujours voir ce qui part avant de cliquer, jamais
 * un envoi à l'aveugle. Le message personnalisé s'insère juste après la
 * formule de politesse, dans les quatre emails (cf. api/_lib/send*.ts).
 */
export function EmailPreviewDialog({
  open,
  onOpenChange,
  clientName,
  senderName,
  subject,
  introText,
  linkPreview,
  isSending,
  onConfirm,
  confirmLabel = 'Envoyer',
}: EmailPreviewDialogProps) {
  const [customMessage, setCustomMessage] = useState('')

  useEffect(() => {
    if (open) setCustomMessage('')
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Aperçu de l'email</DialogTitle>
          <DialogDescription>Vérifiez le contenu avant l'envoi à {clientName}.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email-custom-message">
              Message personnalisé <span className="font-normal text-muted-foreground">(facultatif)</span>
            </Label>
            <Textarea
              id="email-custom-message"
              rows={3}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Ajoutez un mot pour votre cliente…"
            />
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Objet : {subject}</p>
            <div className="whitespace-pre-line text-foreground">
              {`Bonjour ${clientName},\n\n`}
              {customMessage.trim() ? `${customMessage.trim()}\n\n` : ''}
              {`${senderName} ${introText}\n\n`}
              {linkPreview ?? '[le lien sera généré à l’envoi]'}
              {`\n\nN'hésitez pas à revenir vers ${senderName} pour toute question.\n\nÀ très vite !`}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSending}>
            Annuler
          </Button>
          <Button onClick={() => onConfirm(customMessage.trim())} disabled={isSending}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
