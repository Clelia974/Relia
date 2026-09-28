import { useRef, useState } from 'react'
import { Copy, FileText, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { ContractStatusBadge } from '@/features/contracts/components/ContractStatusBadge'
import { useUploadContract } from '@/features/contracts/useUploadContract'
import { useShareContrat } from '@/features/contracts/useShareContrat'
import { copyTextToClipboard } from '@/lib/clipboard'
import { applyContractStatus, CONTRACT_STATUS_LABELS, CONTRACT_STATUS_OPTIONS } from '@/lib/contractStatus'
import { useAuth } from '@/hooks/useAuth'
import type { BusinessConfig, Contract, ContractStatus } from '@/types/entities'

interface ContractPanelProps {
  contract: Contract | undefined
  onChange: (contract: Contract) => void
  /** Requis pour l'upload (chemin de stockage préfixé par son id) et l'envoi (nom affiché comme expéditeur, reply-to). */
  businessConfig: BusinessConfig
  clientName: string
  clientEmail?: string
}

const toDateInput = (iso?: string) => (iso ? iso.slice(0, 10) : '')
const fromDateInput = (value: string) => (value ? new Date(value).toISOString() : undefined)

/** Suivi du contrat d'un mariage : statut, dates d'envoi et de signature, note, et le PDF lui-même (uploadé par la décoratrice — jamais généré par Relia). */
export function ContractPanel({ contract, onChange, businessConfig, clientName, clientEmail }: ContractPanelProps) {
  const { user } = useAuth()
  const { uploadContract, isLoading: isUploading } = useUploadContract()
  const { shareContrat, isLoading: isSharing } = useShareContrat()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [notesDraft, setNotesDraft] = useState(contract?.notes ?? '')
  /**
   * Reflète `contract` en local : nécessaire pour que le lien de partage
   * s'affiche immédiatement après "Marquer comme envoyé" sans attendre un
   * aller-retour par le parent (updateWedding puis re-render) — même
   * logique que Proposal.shareId/Invoice.shareId, mais ce composant reçoit
   * son état par props plutôt que de lire le store directement.
   */
  const [current, setCurrent] = useState<Contract>(contract ?? { status: 'a_rediger' })
  const status: ContractStatus = current.status
  const applyChange = (next: Contract) => {
    setCurrent(next)
    onChange(next)
  }

  const setStatus = (next: ContractStatus) => {
    applyChange(applyContractStatus(current, next, new Date().toISOString()))
    toast.success('Contrat mis à jour.')
  }
  const saveNotes = () => {
    const notes = notesDraft.trim() || undefined
    if (notes !== current.notes) applyChange({ ...current, notes })
  }

  const handleFileSelected = async (file: File) => {
    if (!user) return
    const result = await uploadContract(user.id, file)
    if (!result) {
      toast.error("Le fichier n'a pas pu être envoyé.")
      return
    }
    applyChange({ ...current, storagePath: result.storagePath, fileName: result.fileName, shareId: undefined })
  }

  const handleShare = async () => {
    if (!current.storagePath || !current.fileName) return
    const shareId = await shareContrat({
      storagePath: current.storagePath,
      fileName: current.fileName,
      clientEmail,
      clientName,
      companyName: businessConfig.companyName,
      replyToEmail: businessConfig.email,
    })
    if (!shareId) {
      toast.error("Le lien du contrat n'a pas pu être généré.")
      return
    }
    applyChange({ ...current, shareId })
    toast.success(clientEmail ? 'Contrat envoyé par email à la cliente.' : 'Lien du contrat généré — copiez-le pour l’envoyer vous-même.')
  }

  const shareUrl = current.shareId ? `${window.location.origin}/contrat/${current.shareId}` : undefined
  const handleCopyShareLink = async () => {
    if (!shareUrl) return
    const ok = await copyTextToClipboard(shareUrl)
    toast[ok ? 'success' : 'error'](ok ? 'Lien copié.' : 'Impossible de copier automatiquement.')
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-heading text-lg font-semibold text-foreground">Contrat</h2>
          <ContractStatusBadge status={status} />
        </div>

        <RadioGroup value={status} onValueChange={(v) => setStatus(v as ContractStatus)} aria-label="Statut du contrat" className="gap-2.5 sm:grid-cols-3">
          {CONTRACT_STATUS_OPTIONS.map((option) => (
            <div key={option} className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2.5">
              <RadioGroupItem value={option} id={`contract-${option}`} />
              <Label htmlFor={`contract-${option}`} className="flex-1 cursor-pointer font-normal">
                {CONTRACT_STATUS_LABELS[option]}
              </Label>
            </div>
          ))}
        </RadioGroup>

        {status !== 'a_rediger' && (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contract-sent">Date d'envoi</Label>
              <Input
                id="contract-sent"
                type="date"
                value={toDateInput(current.sentAt)}
                onChange={(e) => applyChange({ ...current, sentAt: fromDateInput(e.target.value) })}
              />
            </div>
            {status === 'signe' && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="contract-signed">Date de signature</Label>
                <Input
                  id="contract-signed"
                  type="date"
                  value={toDateInput(current.signedAt)}
                  onChange={(e) => applyChange({ ...current, signedAt: fromDateInput(e.target.value) })}
                />
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
          <p className="text-sm font-medium text-foreground">Fichier du contrat</p>
          <p className="text-xs text-muted-foreground">
            Rédigé et/ou signé de votre côté (Word, DocuSign…) — uploadez le PDF ici pour obtenir un lien à transmettre à votre cliente.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFileSelected(file)
              e.target.value = ''
            }}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" disabled={isUploading} onClick={() => fileInputRef.current?.click()}>
              <Upload className="size-4" aria-hidden="true" />
              {current.fileName ? 'Remplacer le fichier' : 'Uploader un PDF'}
            </Button>
            {current.fileName && (
              <span className="flex items-center gap-1.5 truncate text-sm text-muted-foreground">
                <FileText className="size-4 shrink-0" aria-hidden="true" />
                {current.fileName}
              </span>
            )}
          </div>
          {current.storagePath && (
            <Button size="sm" className="w-fit" disabled={isSharing} onClick={handleShare}>
              {current.shareId ? 'Renvoyer' : 'Marquer comme envoyé'}
            </Button>
          )}
          {shareUrl && (
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded-md border border-border bg-card px-3 py-2 text-sm text-muted-foreground">{shareUrl}</code>
              <Button variant="outline" size="icon" onClick={handleCopyShareLink} aria-label="Copier le lien du contrat">
                <Copy className="size-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contract-notes">
            Notes <span className="font-normal text-muted-foreground">(facultatif)</span>
          </Label>
          <Textarea id="contract-notes" rows={3} value={notesDraft} onChange={(e) => setNotesDraft(e.target.value)} onBlur={saveNotes} />
        </div>
      </CardContent>
    </Card>
  )
}
