import { useState } from 'react'
import { Copy, FileJson, Lock, Plus, Printer, Trash2 } from 'lucide-react'
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom'
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { computeProposalTotals } from '@/features/proposals/calculations'
import { LineItemsEditor } from '@/features/proposals/components/LineItemsEditor'
import { ProposalDocumentPreview } from '@/features/proposals/components/ProposalDocumentPreview'
import { ProposalStatusBadge } from '@/features/proposals/components/ProposalStatusBadge'
import {
  ProposalFormSchema,
  ProposalLineItemFormSchema,
  emptyLineItemFormValues,
  type ProposalLineItemFormValues,
} from '@/features/proposals/proposalForm.schema'
import { copyTextToClipboard } from '@/lib/clipboard'
import { currency } from '@/lib/currency'
import { downloadJson } from '@/lib/downloadFile'
import { isProposalEditable, isProposalStatusLocked, PROPOSAL_STATUS_LABELS, PROPOSAL_STATUS_OPTIONS } from '@/lib/proposalStatus'
import { useWorkspaceStore } from '@/store/workspaceStore'
import type { WeddingOutletContext } from '@/pages/mariages/WeddingLayout'
import type { ProposalStatus } from '@/types/entities'

function toNumericLines(lines: ProposalLineItemFormValues[]) {
  return lines.map((l) => ({
    id: l.id,
    description: l.description.trim(),
    category: l.category.trim(),
    quantity: Number(l.quantity) || 0,
    unitPrice: Number(l.unitPrice) || 0,
    total: (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0),
    included: l.included,
    optional: l.optional,
    notes: l.notes.trim() || undefined,
  }))
}

export function ProposalBuilderPage() {
  const { proposalId } = useParams<{ proposalId: string }>()
  return <ProposalBuilderInner key={proposalId} proposalId={proposalId ?? ''} />
}

function ProposalBuilderInner({ proposalId }: { proposalId: string }) {
  const { wedding } = useOutletContext<WeddingOutletContext>()
  const navigate = useNavigate()
  const businessConfig = useWorkspaceStore((s) => s.workspace.businessConfig)
  const proposalTemplates = useWorkspaceStore((s) => s.workspace.proposalTemplates)
  const proposal = useWorkspaceStore((s) => s.workspace.proposals.find((p) => p.id === proposalId))
  const updateProposal = useWorkspaceStore((s) => s.updateProposal)
  const updateProposalStatus = useWorkspaceStore((s) => s.updateProposalStatus)
  const duplicateProposal = useWorkspaceStore((s) => s.duplicateProposal)
  const deleteProposal = useWorkspaceStore((s) => s.deleteProposal)

  const [title, setTitle] = useState(proposal?.title ?? '')
  const [clientName, setClientName] = useState(proposal?.clientName ?? '')
  const [clientAddress, setClientAddress] = useState(proposal?.clientAddress ?? wedding.clientAddress ?? '')
  const [clientPhone, setClientPhone] = useState(proposal?.clientPhone ?? wedding.clientPhone ?? '')
  const [validUntil, setValidUntil] = useState(proposal?.validUntil?.slice(0, 10) ?? '')
  const [depositPercentage, setDepositPercentage] = useState(proposal?.depositPercentage !== undefined ? String(proposal.depositPercentage) : '')
  const [notes, setNotes] = useState(proposal?.notes ?? '')
  const [lines, setLines] = useState<ProposalLineItemFormValues[]>(
    () =>
      proposal?.lineItems.map((l) =>
        emptyLineItemFormValues({
          id: l.id,
          description: l.description,
          category: l.category,
          quantity: String(l.quantity),
          unitPrice: String(l.unitPrice),
          included: l.included,
          optional: l.optional,
          notes: l.notes ?? '',
        }),
      ) ?? [],
  )
  const [errors, setErrors] = useState<Partial<Record<'title' | 'validUntil' | 'depositPercentage', string>>>({})
  const [rowErrors, setRowErrors] = useState<Record<string, Partial<Record<keyof ProposalLineItemFormValues, string>>>>({})
  const [view, setView] = useState<'editeur' | 'apercu'>(proposal && !isProposalEditable(proposal.status) ? 'apercu' : 'editeur')
  const [pendingDelete, setPendingDelete] = useState(false)

  if (!proposal) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed border-border px-6 py-16">
        <h1 className="font-heading text-xl font-semibold text-foreground">Proposition introuvable</h1>
        <Button asChild variant="outline">
          <Link to={`/mariages/${wedding.id}/documents`}>Retour aux documents</Link>
        </Button>
      </div>
    )
  }

  const proposalTemplate = proposalTemplates.find((t) => t.tier === proposal.template)
  const templateLabel = proposalTemplate?.label ?? proposal.template
  /** Nom de la formule montré au client — absent si l'organisatrice a choisi de ne pas l'afficher. */
  const documentTemplateLabel = proposalTemplate?.showOnDocuments === false ? undefined : templateLabel
  /** Envoyée/en attente/approuvée/rejetée/expirée : lecture seule par défaut — cf. lib/proposalStatus.ts. */
  const editable = isProposalEditable(proposal.status)
  /** Approuvée/rejetée/expirée : issue définitive, plus aucun changement de statut (Phase 2b) — seule une nouvelle version peut corriger. */
  const statusLocked = isProposalStatusLocked(proposal.status)

  const numericLines = toNumericLines(lines)
  const totals = computeProposalTotals(
    numericLines,
    businessConfig.vatStatus,
    businessConfig.vatRate,
    depositPercentage === '' ? undefined : Number(depositPercentage),
  )

  const setLineField = (id: string, patch: Partial<ProposalLineItemFormValues>) => {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  }
  const removeLine = (id: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id))
  }
  const addLine = () => setLines((prev) => [...prev, emptyLineItemFormValues()])
  const addOption = () => setLines((prev) => [...prev, emptyLineItemFormValues({ included: false, optional: true })])

  /**
   * Une fois approuvée, rejetée ou expirée, le statut est définitif (Phase 2b,
   * cf. isProposalStatusLocked) — le sélecteur est désactivé et cette
   * fonction ne devrait jamais être appelée dans cet état ; le store refuse
   * de toute façon silencieusement la mise à jour en second rempart.
   */
  const handleStatusChange = (value: string) => {
    const nextStatus = value as ProposalStatus
    updateProposalStatus(proposal.id, nextStatus)
    toast.success(`Statut mis à jour : ${PROPOSAL_STATUS_LABELS[nextStatus]}.`)
  }

  const handleSave = () => {
    const topResult = ProposalFormSchema.safeParse({
      title,
      template: proposal.template,
      clientName,
      validUntil,
      status: proposal.status,
      depositPercentage,
      notes,
    })
    const fieldErrors: typeof errors = {}
    if (!topResult.success) {
      for (const issue of topResult.error.issues) {
        const key = issue.path[0] as keyof typeof errors
        if (key === 'title' || key === 'validUntil' || key === 'depositPercentage') fieldErrors[key] = issue.message
      }
    }

    if (lines.length === 0) {
      setErrors({ ...fieldErrors })
      setRowErrors({})
      toast.error('Veuillez ajouter au moins une ligne.')
      return
    }

    const newRowErrors: typeof rowErrors = {}
    for (const line of lines) {
      const result = ProposalLineItemFormSchema.safeParse(line)
      if (!result.success) {
        const lineErrs: Partial<Record<keyof ProposalLineItemFormValues, string>> = {}
        for (const issue of result.error.issues) {
          const key = issue.path[0] as keyof ProposalLineItemFormValues
          if (!lineErrs[key]) lineErrs[key] = issue.message
        }
        newRowErrors[line.id] = lineErrs
      }
    }

    setErrors(fieldErrors)
    setRowErrors(newRowErrors)
    if (!topResult.success || Object.keys(newRowErrors).length > 0) {
      toast.error('Veuillez corriger les champs en erreur.')
      return
    }

    const finalLines = toNumericLines(lines)
    const finalTotals = computeProposalTotals(
      finalLines,
      businessConfig.vatStatus,
      businessConfig.vatRate,
      depositPercentage === '' ? undefined : Number(depositPercentage),
    )

    updateProposal(proposal.id, {
      title: title.trim(),
      clientName: clientName.trim(),
      clientAddress: clientAddress.trim() || undefined,
      clientPhone: clientPhone.trim() || undefined,
      validUntil: validUntil ? new Date(validUntil).toISOString() : undefined,
      lineItems: finalLines,
      subtotal: finalTotals.subtotal,
      vatMode: businessConfig.vatStatus,
      vatRate: businessConfig.vatRate,
      taxAmount: finalTotals.taxAmount,
      total: finalTotals.total,
      depositPercentage: depositPercentage === '' ? undefined : Number(depositPercentage),
      depositAmount: finalTotals.depositAmount,
      balanceAmount: finalTotals.balanceAmount,
      notes: notes.trim() || undefined,
    })
    toast.success('Proposition enregistrée.')
  }

  const buildTextSummary = () => {
    const lines2 = [
      `${title} — ${wedding.coupleName}`,
      ...(documentTemplateLabel ? [`Formule : ${documentTemplateLabel}`] : []),
      '',
      'Services inclus :',
      ...numericLines.filter((l) => l.included && !l.optional).map((l) => `- ${l.description} (${l.quantity} × ${currency.format(l.unitPrice)}) : ${currency.format(l.total)}`),
    ]
    const options = numericLines.filter((l) => l.optional)
    if (options.length > 0) {
      lines2.push('', 'Options :', ...options.map((l) => `- ${l.description} : ${currency.format(l.total)}`))
    }
    lines2.push('', `Sous-total : ${currency.format(totals.subtotal)}`, `Total : ${currency.format(totals.total)}`)
    if (depositPercentage) lines2.push(`Acompte (${depositPercentage}%) : ${currency.format(totals.depositAmount)}`, `Solde : ${currency.format(totals.balanceAmount)}`)
    return lines2.join('\n')
  }

  const handleCopy = async () => {
    const ok = await copyTextToClipboard(buildTextSummary())
    toast[ok ? 'success' : 'error'](ok ? 'Contenu copié dans le presse-papiers.' : 'Impossible de copier automatiquement.')
  }

  const handleExportJson = () => {
    downloadJson(`proposition-${proposal.id}.json`, { ...proposal, title, clientName, lineItems: numericLines, ...totals })
    toast.success('Proposition exportée en JSON.')
  }

  const handleDuplicate = () => {
    const newId = duplicateProposal(proposal.id)
    if (newId) {
      toast.success('Proposition dupliquée.')
      navigate(`/mariages/${wedding.id}/documents/propositions/${newId}`)
    }
  }

  const confirmDelete = () => {
    deleteProposal(proposal.id)
    toast.success('Proposition supprimée.')
    navigate(`/mariages/${wedding.id}/documents`)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="no-print flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to={`/mariages/${wedding.id}/documents`} className="text-sm text-muted-foreground hover:underline">
            ← Documents
          </Link>
          <p className="mt-1 text-xs font-medium uppercase tracking-wide tabular-nums text-thread">N° {proposal.proposalNumber}</p>
          <h1 className="font-heading text-2xl font-semibold text-foreground">{title || 'Proposition'}</h1>
          <div className="mt-1 flex items-center gap-2">
            <ProposalStatusBadge status={proposal.status} />
            {proposal.approvedAt && <span className="text-xs text-muted-foreground">Approuvée</span>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={proposal.status} onValueChange={handleStatusChange} disabled={statusLocked}>
            <SelectTrigger className="w-48" aria-label={statusLocked ? 'Statut verrouillé' : 'Statut de la proposition'}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROPOSAL_STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} value={status}>
                  {PROPOSAL_STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleDuplicate}>
            {editable ? 'Dupliquer' : 'Créer une nouvelle version'}
          </Button>
          <Button variant="outline" className="text-risk hover:text-risk" onClick={() => setPendingDelete(true)}>
            <Trash2 className="size-4" aria-hidden="true" />
            Supprimer
          </Button>
        </div>
      </div>

      {statusLocked && (
        <Alert className="no-print border-warning/40 bg-warning-bg">
          <Lock className="size-4 text-warning" aria-hidden="true" />
          <AlertDescription className="text-warning">
            Cette proposition est {PROPOSAL_STATUS_LABELS[proposal.status].toLowerCase()} et verrouillée — son statut et son contenu ne peuvent
            plus être modifiés. Pour la corriger, créez une nouvelle version.
          </AlertDescription>
        </Alert>
      )}

      <div className="no-print flex flex-wrap gap-2">
        {editable && (
          <>
            <Button variant={view === 'editeur' ? 'default' : 'outline'} size="sm" onClick={() => setView('editeur')}>
              Éditeur
            </Button>
            <Button variant={view === 'apercu' ? 'default' : 'outline'} size="sm" onClick={() => setView('apercu')}>
              Aperçu
            </Button>
          </>
        )}
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={handleCopy}>
          <Copy className="size-4" aria-hidden="true" />
          Copier
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportJson}>
          <FileJson className="size-4" aria-hidden="true" />
          Exporter en JSON
        </Button>
        {!editable || view === 'apercu' ? (
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="size-4" aria-hidden="true" />
            Imprimer / Enregistrer en PDF
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setView('apercu')}>
            <Printer className="size-4" aria-hidden="true" />
            Prévisualiser avant impression
          </Button>
        )}
      </div>

      {editable && view === 'editeur' ? (
        <div className="no-print grid gap-6 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="flex flex-col gap-6">
            <Card>
              <CardContent className="flex flex-col gap-4">
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  <Field label="Titre de la proposition" htmlFor="pb-title" error={errors.title}>
                    <Input
                      id="pb-title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      aria-invalid={Boolean(errors.title)}
                      aria-describedby={errors.title ? 'pb-title-error' : undefined}
                    />
                  </Field>
                  <Field label="Nom du client" htmlFor="pb-client" optional>
                    <Input id="pb-client" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder={wedding.coupleName} />
                  </Field>
                </div>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  <Field label="Adresse du client" htmlFor="pb-client-address" optional>
                    <Textarea id="pb-client-address" rows={2} value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} placeholder="Numéro, rue, code postal, ville" />
                  </Field>
                  <Field label="Téléphone du client" htmlFor="pb-client-phone" optional>
                    <Input id="pb-client-phone" type="tel" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="Ex. 06 12 34 56 78" />
                  </Field>
                </div>
                {(!clientAddress.trim() || !clientPhone.trim()) && (
                  <p className="text-xs text-warning">Pour un document conforme, renseignez l'adresse et le téléphone du client.</p>
                )}
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  <Field label="Date de validité" htmlFor="pb-valid-until" optional error={errors.validUntil}>
                    <Input
                      id="pb-valid-until"
                      type="date"
                      value={validUntil}
                      onChange={(e) => setValidUntil(e.target.value)}
                      aria-invalid={Boolean(errors.validUntil)}
                      aria-describedby={errors.validUntil ? 'pb-valid-until-error' : undefined}
                    />
                  </Field>
                  <Field label="Pourcentage d'acompte" htmlFor="pb-deposit" optional error={errors.depositPercentage}>
                    <Input
                      id="pb-deposit"
                      inputMode="decimal"
                      value={depositPercentage}
                      onChange={(e) => setDepositPercentage(e.target.value)}
                      placeholder="Ex. 30"
                      aria-invalid={Boolean(errors.depositPercentage)}
                      aria-describedby={errors.depositPercentage ? 'pb-deposit-error' : undefined}
                    />
                  </Field>
                </div>
                <Field label="Notes" htmlFor="pb-notes" optional>
                  <Textarea id="pb-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
                </Field>
              </CardContent>
            </Card>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-heading text-lg font-semibold text-foreground">Lignes</h2>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={addLine}>
                  <Plus className="size-4" aria-hidden="true" />
                  Ajouter une ligne
                </Button>
                <Button variant="outline" size="sm" onClick={addOption}>
                  <Plus className="size-4" aria-hidden="true" />
                  Ajouter une option
                </Button>
              </div>
            </div>
            <LineItemsEditor lines={lines} errors={rowErrors} onChange={setLineField} onRemove={removeLine} />

            <Button onClick={handleSave} className="w-fit">
              Enregistrer
            </Button>
          </div>

          <div className="flex flex-col gap-3">
            <Card>
              <CardContent className="flex flex-col gap-2 text-sm">
                <p className="text-xs font-medium text-muted-foreground">Résumé</p>
                <Row label="Sous-total" value={currency.format(totals.subtotal)} />
                {totals.optionsTotal > 0 && <Row label="Options (hors total)" value={currency.format(totals.optionsTotal)} />}
                <Row label="TVA indicative" value={currency.format(totals.taxAmount)} />
                <Row label="Total" value={currency.format(totals.total)} strong />
                {depositPercentage && (
                  <>
                    <Row label="Acompte" value={currency.format(totals.depositAmount)} />
                    <Row label="Solde" value={currency.format(totals.balanceAmount)} />
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="print-area">
          <ProposalDocumentPreview
            businessConfig={businessConfig}
            wedding={wedding}
            title={title}
            proposalNumber={proposal.proposalNumber}
            templateLabel={documentTemplateLabel}
            clientName={clientName || wedding.coupleName}
            clientAddress={clientAddress.trim() || undefined}
            clientPhone={clientPhone.trim() || undefined}
            validUntil={validUntil ? new Date(validUntil).toISOString() : undefined}
            lineItems={numericLines}
            totals={totals}
            vatMode={businessConfig.vatStatus}
            vatRate={businessConfig.vatRate}
            depositPercentage={depositPercentage === '' ? undefined : Number(depositPercentage)}
            notes={notes}
          />
        </div>
      )}

      <AlertDialog open={pendingDelete} onOpenChange={setPendingDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer « {proposal.title} » ?</AlertDialogTitle>
            <AlertDialogDescription>Cette proposition sera définitivement supprimée. Cette action est irréversible.</AlertDialogDescription>
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

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${strong ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
      <span>{label}</span>
      <span className="tabular-nums text-foreground">{value}</span>
    </div>
  )
}

function Field({
  label,
  htmlFor,
  error,
  optional,
  children,
}: {
  label: string
  htmlFor: string
  error?: string
  optional?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>
        {label}
        {optional && <span className="ml-1 font-normal text-muted-foreground">(facultatif)</span>}
      </Label>
      {children}
      {error && (
        <p id={`${htmlFor}-error`} className="text-xs text-risk">
          {error}
        </p>
      )}
    </div>
  )
}
