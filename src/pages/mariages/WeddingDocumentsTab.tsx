import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Link, useNavigate, useOutletContext } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmptyState } from '@/components/EmptyState'
import { ContractPanel } from '@/features/contracts/components/ContractPanel'
import { ContractStatusBadge } from '@/features/contracts/components/ContractStatusBadge'
import { computeProposalTotals } from '@/features/proposals/calculations'
import { ProposalStatusBadge } from '@/features/proposals/components/ProposalStatusBadge'
import { currency } from '@/lib/currency'
import { formatShortDate } from '@/lib/dateFormat'
import { generateId } from '@/lib/id'
import { useWorkspaceStore } from '@/store/workspaceStore'
import type { WeddingOutletContext } from '@/pages/mariages/WeddingLayout'
import type { ProposalTier } from '@/types/entities'

export function WeddingDocumentsTab() {
  const { wedding } = useOutletContext<WeddingOutletContext>()
  const navigate = useNavigate()
  const businessConfig = useWorkspaceStore((s) => s.workspace.businessConfig)
  const proposalTemplates = useWorkspaceStore((s) => s.workspace.proposalTemplates)
  const allProposals = useWorkspaceStore((s) => s.workspace.proposals)
  const allInvoices = useWorkspaceStore((s) => s.workspace.invoices)
  const createProposal = useWorkspaceStore((s) => s.createProposal)
  const createInvoicePreview = useWorkspaceStore((s) => s.createInvoicePreview)
  const updateWedding = useWorkspaceStore((s) => s.updateWedding)

  const proposals = allProposals.filter((p) => p.weddingId === wedding.id).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  const invoices = allInvoices.filter((inv) => inv.weddingId === wedding.id).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  const approvedProposals = proposals.filter((p) => p.status === 'approuvee')

  const [templatePickerOpen, setTemplatePickerOpen] = useState(false)
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false)
  const [invoiceSource, setInvoiceSource] = useState('vide')

  const handlePickTemplate = (tier: ProposalTier) => {
    const template = proposalTemplates.find((t) => t.tier === tier)
    if (!template) return
    const lineItems = template.lines.map((line) => ({
      id: generateId(),
      description: line.description,
      category: line.category,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      total: line.quantity * line.unitPrice,
      included: line.included,
      optional: line.optional,
    }))
    const totals = computeProposalTotals(lineItems, businessConfig.vatStatus, businessConfig.vatRate, undefined)
    const id = createProposal({
      weddingId: wedding.id,
      template: tier,
      title: template.showOnDocuments === false ? `Proposition — ${wedding.coupleName}` : `Proposition ${template.label} — ${wedding.coupleName}`,
      clientName: wedding.coupleName,
      clientAddress: wedding.clientAddress,
      clientPhone: wedding.clientPhone,
      lineItems,
      subtotal: totals.subtotal,
      vatMode: businessConfig.vatStatus,
      vatRate: businessConfig.vatRate,
      taxAmount: totals.taxAmount,
      total: totals.total,
      depositAmount: totals.depositAmount,
      balanceAmount: totals.balanceAmount,
    })
    setTemplatePickerOpen(false)
    navigate(`/mariages/${wedding.id}/documents/propositions/${id}`)
  }

  const handleCreateInvoice = () => {
    const source = invoiceSource !== 'vide' ? proposals.find((p) => p.id === invoiceSource) : undefined
    const id = source
      ? createInvoicePreview({
          weddingId: wedding.id,
          proposalId: source.id,
          date: new Date().toISOString(),
          clientName: source.clientName || wedding.coupleName,
          clientAddress: source.clientAddress ?? wedding.clientAddress,
          clientPhone: source.clientPhone ?? wedding.clientPhone,
          lineItems: source.lineItems.map((line) => ({ ...line, id: generateId() })),
          subtotal: source.subtotal,
          vatMode: source.vatMode,
          vatRate: source.vatRate,
          taxAmount: source.taxAmount,
          total: source.total,
          depositAmount: source.depositAmount,
          balanceAmount: source.balanceAmount,
          legalMentions: businessConfig.legalMentions,
        })
      : createInvoicePreview({
          weddingId: wedding.id,
          date: new Date().toISOString(),
          clientName: wedding.coupleName,
          clientAddress: wedding.clientAddress,
          clientPhone: wedding.clientPhone,
          lineItems: [],
          subtotal: 0,
          vatMode: businessConfig.vatStatus,
          vatRate: businessConfig.vatRate,
          taxAmount: 0,
          total: 0,
          legalMentions: businessConfig.legalMentions,
        })
    setInvoiceDialogOpen(false)
    navigate(`/mariages/${wedding.id}/documents/factures/${id}`)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground">Documents</h1>
        <p className="mt-1 text-sm text-muted-foreground">Propositions, factures indicatives et contrat pour ce mariage.</p>
      </div>

      <Tabs defaultValue="propositions">
        <TabsList>
          <TabsTrigger value="propositions">Propositions</TabsTrigger>
          <TabsTrigger value="factures">Factures indicatives</TabsTrigger>
          <TabsTrigger value="contrat" className="gap-2">
            Contrat
            {wedding.contract && <ContractStatusBadge status={wedding.contract.status} />}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="propositions" className="flex flex-col gap-4 pt-4">
          <div className="flex justify-end">
            <Button onClick={() => setTemplatePickerOpen(true)}>
              <Plus className="size-4" aria-hidden="true" />
              Nouvelle proposition
            </Button>
          </div>

          {proposals.length === 0 ? (
            <EmptyState description="Aucune proposition pour l'instant — choisissez une formule pour commencer." />
          ) : (
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {proposals.map((p) => (
                <Link key={p.id} to={`/mariages/${wedding.id}/documents/propositions/${p.id}`}>
                  <Card className="h-full transition-colors hover:border-thread/50">
                    <CardContent className="flex flex-col gap-2">
                      <p className="text-xs uppercase tracking-wide text-thread-text">
                        {p.proposalNumber} · {proposalTemplates.find((t) => t.tier === p.template)?.label ?? p.template}
                      </p>
                      <p className="font-medium text-foreground">{p.title}</p>
                      <ProposalStatusBadge status={p.status} />
                      <p className="mt-1 font-heading text-lg font-semibold tabular-nums text-foreground">{currency.format(p.total)}</p>
                      <p className="text-xs text-muted-foreground">Mis à jour le {formatShortDate(p.updatedAt)}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="factures" className="flex flex-col gap-4 pt-4">
          <div className="flex justify-end">
            <Button onClick={() => setInvoiceDialogOpen(true)}>
              <Plus className="size-4" aria-hidden="true" />
              Nouvelle facture indicative
            </Button>
          </div>

          {invoices.length === 0 ? (
            <EmptyState description="Aucune facture indicative pour l'instant." />
          ) : (
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {invoices.map((inv) => (
                <Link key={inv.id} to={`/mariages/${wedding.id}/documents/factures/${inv.id}`}>
                  <Card className="h-full transition-colors hover:border-thread/50">
                    <CardContent className="flex flex-col gap-2">
                      <p className="text-xs uppercase tracking-wide text-thread-text">Facture n° {inv.invoiceNumber}</p>
                      <p className="font-medium text-foreground">{inv.clientName || wedding.coupleName}</p>
                      <p className="font-heading text-lg font-semibold tabular-nums text-foreground">{currency.format(inv.total)}</p>
                      <p className="text-xs text-muted-foreground">{formatShortDate(inv.date)}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="contrat" className="pt-4">
          <ContractPanel
            key={wedding.id}
            contract={wedding.contract}
            onChange={(contract) => {
              updateWedding(wedding.id, { contract })
              toast.success('Contrat mis à jour.')
            }}
          />
        </TabsContent>
      </Tabs>

      <Dialog open={templatePickerOpen} onOpenChange={setTemplatePickerOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Choisir une formule</DialogTitle>
            <DialogDescription>Chaque formule est entièrement personnalisable une fois créée.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
            {proposalTemplates.map((template) => {
              const totals = computeProposalTotals(
                template.lines.map((l) => ({ id: l.id, description: l.description, category: l.category, quantity: l.quantity, unitPrice: l.unitPrice, total: l.quantity * l.unitPrice, included: l.included, optional: l.optional })),
                businessConfig.vatStatus,
                businessConfig.vatRate,
                undefined,
              )
              return (
                <button
                  key={template.tier}
                  type="button"
                  onClick={() => handlePickTemplate(template.tier)}
                  className="flex flex-col gap-2 rounded-lg border border-border p-4 text-left transition-colors hover:border-thread hover:bg-accent"
                >
                  <p className="font-heading text-lg font-semibold text-foreground">{template.label}</p>
                  <p className="text-sm text-muted-foreground">{template.tagline}</p>
                  <p className="mt-2 font-heading text-xl font-semibold tabular-nums text-foreground">{currency.format(totals.subtotal)}</p>
                  <p className="text-xs text-muted-foreground">{template.lines.length} ligne{template.lines.length !== 1 ? 's' : ''} préconfigurée{template.lines.length !== 1 ? 's' : ''}</p>
                </button>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle facture indicative</DialogTitle>
            <DialogDescription>Vous pourrez modifier son contenu ensuite.</DialogDescription>
          </DialogHeader>
          <RadioGroup value={invoiceSource} onValueChange={setInvoiceSource} className="gap-3">
            <div className="flex items-start gap-2.5">
              <RadioGroupItem value="vide" id="inv-blank" className="mt-0.5" />
              <Label htmlFor="inv-blank" className="flex flex-col gap-0.5 font-normal">
                <span className="text-foreground">Facture vide</span>
                <span className="text-xs font-normal text-muted-foreground">Renseignez les lignes manuellement.</span>
              </Label>
            </div>
            {approvedProposals.map((p) => (
              <div key={p.id} className="flex items-start gap-2.5">
                <RadioGroupItem value={p.id} id={`inv-${p.id}`} className="mt-0.5" />
                <Label htmlFor={`inv-${p.id}`} className="flex flex-col gap-0.5 font-normal">
                  <span className="text-foreground">À partir de « {p.title} »</span>
                  <span className="text-xs font-normal text-muted-foreground">{currency.format(p.total)} — proposition approuvée</span>
                </Label>
              </div>
            ))}
          </RadioGroup>
          <div className="flex justify-end">
            <Button onClick={handleCreateInvoice}>Créer la facture</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
