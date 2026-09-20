import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { ContractStatusBadge } from '@/features/contracts/components/ContractStatusBadge'
import { applyContractStatus, CONTRACT_STATUS_LABELS, CONTRACT_STATUS_OPTIONS } from '@/lib/contractStatus'
import type { Contract, ContractStatus } from '@/types/entities'

interface ContractPanelProps {
  contract: Contract | undefined
  onChange: (contract: Contract) => void
}

const toDateInput = (iso?: string) => (iso ? iso.slice(0, 10) : '')
const fromDateInput = (value: string) => (value ? new Date(value).toISOString() : undefined)

/** Suivi du contrat d'un mariage : statut, dates d'envoi et de signature, note. Pas de fichier joint pour l'instant. */
export function ContractPanel({ contract, onChange }: ContractPanelProps) {
  const status: ContractStatus = contract?.status ?? 'a_rediger'
  const [notesDraft, setNotesDraft] = useState(contract?.notes ?? '')

  const current: Contract = contract ?? { status }
  const setStatus = (next: ContractStatus) => onChange(applyContractStatus(contract, next, new Date().toISOString()))
  const saveNotes = () => {
    const notes = notesDraft.trim() || undefined
    if (notes !== contract?.notes) onChange({ ...current, notes })
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
                onChange={(e) => onChange({ ...current, sentAt: fromDateInput(e.target.value) })}
              />
            </div>
            {status === 'signe' && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="contract-signed">Date de signature</Label>
                <Input
                  id="contract-signed"
                  type="date"
                  value={toDateInput(current.signedAt)}
                  onChange={(e) => onChange({ ...current, signedAt: fromDateInput(e.target.value) })}
                />
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contract-notes">
            Notes <span className="font-normal text-muted-foreground">(facultatif)</span>
          </Label>
          <Textarea id="contract-notes" rows={3} value={notesDraft} onChange={(e) => setNotesDraft(e.target.value)} onBlur={saveNotes} />
        </div>

        <p className="text-xs text-muted-foreground">
          Le suivi porte sur le statut et les dates. Le dépôt du contrat signé (PDF) sera proposé dans une prochaine version.
        </p>
      </CardContent>
    </Card>
  )
}
