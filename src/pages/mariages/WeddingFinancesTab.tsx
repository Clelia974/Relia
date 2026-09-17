import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Link, useOutletContext } from 'react-router-dom'
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
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CostReviewBadge } from '@/components/CostReviewBadge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  calculateProposedScopeChanges,
  getWeddingFinancials,
  simulateScopeChangeApproval,
} from '@/features/finances/calculations'
import { ExpenseCard } from '@/features/finances/components/ExpenseCard'
import { ExpenseForm } from '@/features/finances/components/ExpenseForm'
import { MarginStatusBadge } from '@/features/finances/components/MarginStatusBadge'
import { ScopeChangeCard } from '@/features/finances/components/ScopeChangeCard'
import { ScopeChangeForm } from '@/features/finances/components/ScopeChangeForm'
import type { ExpenseFormValues } from '@/features/finances/expenseForm.schema'
import type { ScopeChangeFormValues } from '@/features/finances/scopeChangeForm.schema'
import { useWorkspaceStore } from '@/store/workspaceStore'
import type { WeddingOutletContext } from '@/pages/mariages/WeddingLayout'
import type { Expense, ExpenseCategory, ExpenseStatus, ScopeChange, ScopeChangeStatus } from '@/types/entities'

const currency = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

function toExpensePatch(weddingId: string, values: ExpenseFormValues) {
  return {
    weddingId,
    description: values.description.trim(),
    category: values.category as ExpenseCategory,
    amount: Number(values.amount),
    date: new Date(values.date).toISOString(),
    status: values.status as ExpenseStatus,
    notes: values.notes.trim() || undefined,
  }
}

function toScopeChangePatch(weddingId: string, values: ScopeChangeFormValues) {
  return {
    weddingId,
    description: values.description.trim(),
    date: new Date(values.date).toISOString(),
    vendorCost: values.vendorCost === '' ? 0 : Number(values.vendorCost),
    clientPrice: values.clientPrice === '' ? 0 : Number(values.clientPrice),
    status: values.status as ScopeChangeStatus,
    notes: values.notes.trim() || undefined,
  }
}

export function WeddingFinancesTab() {
  const { wedding } = useOutletContext<WeddingOutletContext>()
  const allVendors = useWorkspaceStore((s) => s.workspace.vendors)
  const allVendorWeddingLinks = useWorkspaceStore((s) => s.workspace.vendorWeddingLinks)
  const allExpenses = useWorkspaceStore((s) => s.workspace.expenses)
  const allScopeChanges = useWorkspaceStore((s) => s.workspace.scopeChanges)
  const updateWedding = useWorkspaceStore((s) => s.updateWedding)
  const addExpense = useWorkspaceStore((s) => s.addExpense)
  const updateExpense = useWorkspaceStore((s) => s.updateExpense)
  const deleteExpense = useWorkspaceStore((s) => s.deleteExpense)
  const addScopeChange = useWorkspaceStore((s) => s.addScopeChange)
  const updateScopeChange = useWorkspaceStore((s) => s.updateScopeChange)
  const approveScopeChange = useWorkspaceStore((s) => s.approveScopeChange)
  const rejectScopeChange = useWorkspaceStore((s) => s.rejectScopeChange)
  const deleteScopeChange = useWorkspaceStore((s) => s.deleteScopeChange)

  const vendors = allVendors.filter((v) => v.weddingIds.includes(wedding.id))
  const vendorLinks = allVendorWeddingLinks.filter((l) => l.weddingId === wedding.id)
  const linkByVendorId = new Map(vendorLinks.map((l) => [l.vendorId, l]))
  const expenses = allExpenses.filter((e) => e.weddingId === wedding.id)
  const scopeChanges = allScopeChanges.filter((sc) => sc.weddingId === wedding.id)
  const financials = getWeddingFinancials(wedding, vendors, vendorLinks, expenses, scopeChanges)

  const [soldAmountDraft, setSoldAmountDraft] = useState(String(wedding.soldAmount))

  const [expenseFormOpen, setExpenseFormOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [pendingDeleteExpense, setPendingDeleteExpense] = useState<Expense | null>(null)

  const [scopeFormOpen, setScopeFormOpen] = useState(false)
  const [editingScopeChange, setEditingScopeChange] = useState<ScopeChange | null>(null)
  const [pendingDeleteScopeChange, setPendingDeleteScopeChange] = useState<ScopeChange | null>(null)

  const saveSoldAmount = () => {
    const parsed = Number(soldAmountDraft)
    if (Number.isNaN(parsed) || parsed < 0) {
      toast.error('Veuillez saisir un montant valide.')
      setSoldAmountDraft(String(wedding.soldAmount))
      return
    }
    if (parsed === wedding.soldAmount) return
    updateWedding(wedding.id, { soldAmount: parsed })
    toast.success('Montant vendu mis à jour.')
  }

  const openCreateExpense = () => {
    setEditingExpense(null)
    setExpenseFormOpen(true)
  }
  const openEditExpense = (expense: Expense) => {
    setEditingExpense(expense)
    setExpenseFormOpen(true)
  }
  const handleExpenseSubmit = (values: ExpenseFormValues) => {
    const patch = toExpensePatch(wedding.id, values)
    if (editingExpense) {
      updateExpense(editingExpense.id, patch)
      toast.success('Dépense mise à jour.')
    } else {
      addExpense(patch)
      toast.success('Dépense ajoutée.')
    }
    setExpenseFormOpen(false)
  }
  const confirmDeleteExpense = () => {
    if (!pendingDeleteExpense) return
    deleteExpense(pendingDeleteExpense.id)
    setPendingDeleteExpense(null)
    toast.success('Dépense supprimée.')
  }

  const openCreateScopeChange = () => {
    setEditingScopeChange(null)
    setScopeFormOpen(true)
  }
  const openEditScopeChange = (scopeChange: ScopeChange) => {
    setEditingScopeChange(scopeChange)
    setScopeFormOpen(true)
  }
  const handleScopeChangeSubmit = (values: ScopeChangeFormValues) => {
    const patch = toScopeChangePatch(wedding.id, values)
    if (editingScopeChange) {
      updateScopeChange(editingScopeChange.id, patch)
      toast.success('Changement mis à jour.')
    } else {
      addScopeChange(patch)
      toast.success('Changement ajouté.')
    }
    setScopeFormOpen(false)
  }
  const confirmDeleteScopeChange = () => {
    if (!pendingDeleteScopeChange) return
    deleteScopeChange(pendingDeleteScopeChange.id)
    setPendingDeleteScopeChange(null)
    toast.success('Changement supprimé.')
  }

  const handleApprove = (scopeChange: ScopeChange) => {
    const marginBefore = financials.marginPct
    approveScopeChange(scopeChange.id)
    const after = getWeddingFinancials(
      wedding,
      vendors,
      vendorLinks,
      expenses,
      scopeChanges.map((sc) => (sc.id === scopeChange.id ? { ...sc, status: 'approuvee' as const } : sc)),
    )
    toast.success(
      `Changement approuvé. Marge : ${Math.round(marginBefore)}% → ${Math.round(after.marginPct)}% (${after.marginPct >= marginBefore ? '+' : ''}${Math.round(after.marginPct - marginBefore)} points).`,
    )
    if (financials.hasSoldAmount && financials.hasCostData && after.marginPct < 25) {
      toast.warning('La marge de ce mariage est maintenant inférieure à 25%. Vérifiez les coûts ou le prix proposé.')
    }
  }
  const handleReject = (scopeChange: ScopeChange) => {
    rejectScopeChange(scopeChange.id)
    toast.success('Changement rejeté.')
  }

  const missingCostVendors = vendors.filter((v) => {
    const link = linkByVendorId.get(v.id)
    return link === undefined || (link.estimatedCost === undefined && link.actualCost === undefined)
  })
  const showEmptyState = !financials.hasSoldAmount && !financials.hasCostData

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground">Finances</h1>
        <p className="mt-1 text-sm text-muted-foreground">Suivez la rentabilité de ce mariage.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="flex flex-col gap-1.5">
            <Label htmlFor="sold-amount" className="text-xs text-muted-foreground">
              Montant vendu
            </Label>
            <Input
              id="sold-amount"
              inputMode="decimal"
              value={soldAmountDraft}
              onChange={(e) => setSoldAmountDraft(e.target.value)}
              onBlur={saveSoldAmount}
            />
          </CardContent>
        </Card>

        {!showEmptyState && (
          <>
            <SummaryCard label="Changements approuvés" value={`+${currency.format(financials.scopeChangeApprovedTotal)}`} />
            <SummaryCard
              label="Coûts totaux"
              value={financials.hasCostData ? currency.format(financials.totalCosts) : '—'}
            />
            <SummaryCard
              label="Profit prévisionnel"
              value={financials.hasCostData ? currency.format(financials.profit) : '—'}
            />
            <Card>
              <CardContent className="flex flex-col gap-1.5">
                <p className="text-xs text-muted-foreground">Marge</p>
                {financials.marginStatus ? (
                  <div className="flex items-center gap-2">
                    <span className="font-heading text-xl font-semibold tabular-nums text-foreground">
                      {Math.round(financials.marginPct)} %
                    </span>
                    <MarginStatusBadge status={financials.marginStatus} />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {financials.hasSoldAmount ? 'Ajoutez vos premiers coûts.' : 'Ajoutez votre montant vendu.'}
                  </p>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {!showEmptyState && financials.hasCostNeedingReview && (
        <p className="rounded-lg border border-warning/30 bg-warning-bg px-4 py-2.5 text-sm text-warning">
          La marge ci-dessus inclut au moins un coût prestataire à vérifier (dupliqué automatiquement lors d'une mise
          à jour). Corrigez-le dans « Coûts fournisseurs » ci-dessous pour fiabiliser ce chiffre.
        </p>
      )}

      {showEmptyState && (
        <p className="rounded-lg border border-dashed border-border px-6 py-8 text-center text-sm text-muted-foreground">
          Ajoutez votre montant vendu et vos premiers coûts pour suivre votre marge.
        </p>
      )}

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 className="font-heading text-lg font-semibold text-foreground">Coûts fournisseurs</h2>
          {financials.vendorCosts > 0 && (
            <p className="text-sm text-foreground">
              Total : <span className="font-medium tabular-nums">{currency.format(financials.vendorCosts)}</span>
              {financials.scopeChangeApprovedCost > 0 && (
                <span className="text-muted-foreground"> (dont {currency.format(financials.scopeChangeApprovedCost)} de changements de périmètre approuvés)</span>
              )}
            </p>
          )}
        </div>
        {vendors.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun prestataire associé à ce mariage.</p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {vendors.map((vendor) => {
                const link = linkByVendorId.get(vendor.id)
                const hasEstimated = link?.estimatedCost !== undefined
                const hasActual = link?.actualCost !== undefined
                const gap = hasEstimated && hasActual ? link.actualCost! - link.estimatedCost! : null
                return (
                  <Card key={vendor.id}>
                    <CardContent className="flex flex-col gap-2">
                      <p className="font-medium text-foreground">{vendor.name}</p>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <dt className="text-xs text-muted-foreground">Coût estimé</dt>
                          <dd className="tabular-nums text-foreground">{hasEstimated ? currency.format(link!.estimatedCost!) : '—'}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-muted-foreground">Coût réel</dt>
                          <dd className="tabular-nums text-foreground">{hasActual ? currency.format(link!.actualCost!) : '—'}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-muted-foreground">Écart</dt>
                          <dd className="tabular-nums text-foreground">{gap !== null ? currency.format(gap) : '—'}</dd>
                        </div>
                      </div>
                      {!hasEstimated && !hasActual && <p className="text-xs text-warning">Coût non renseigné pour ce mariage.</p>}
                      {link?.needsCostReview && <CostReviewBadge />}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              {missingCostVendors.length > 0
                ? `${missingCostVendors.length} coût${missingCostVendors.length !== 1 ? 's' : ''} non renseigné${missingCostVendors.length !== 1 ? 's' : ''}.`
                : 'Tous les coûts prestataires sont renseignés.'}{' '}
              <Link to={`/mariages/${wedding.id}/prestataires`} className="underline-offset-4 hover:underline">
                Gérer les prestataires →
              </Link>
            </p>
          </>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-heading text-lg font-semibold text-foreground">Autres dépenses</h2>
          <Button size="sm" onClick={openCreateExpense}>
            <Plus className="size-4" aria-hidden="true" />
            Ajouter une dépense
          </Button>
        </div>
        {expenses.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune autre dépense pour ce mariage.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {expenses.map((expense) => (
              <ExpenseCard key={expense.id} expense={expense} onEdit={openEditExpense} onDelete={setPendingDeleteExpense} />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-heading text-lg font-semibold text-foreground">Changements de périmètre</h2>
          <Button size="sm" onClick={openCreateScopeChange}>
            <Plus className="size-4" aria-hidden="true" />
            Ajouter un changement
          </Button>
        </div>

        {scopeChanges.length > 0 && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>Scope creep proposé : +{currency.format(calculateProposedScopeChanges(scopeChanges))}</span>
            <span>Scope creep approuvé : +{currency.format(financials.scopeChangeApprovedTotal)}</span>
            <span>Scope creep non facturé : {currency.format(financials.scopeChangeUnbilledTotal)}</span>
          </div>
        )}

        {scopeChanges.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun changement de périmètre pour ce mariage.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {scopeChanges.map((sc) => (
              <ScopeChangeCard
                key={sc.id}
                scopeChange={sc}
                impact={
                  ['proposee', 'a_envoyer', 'en_attente_approbation'].includes(sc.status)
                    ? simulateScopeChangeApproval(wedding, vendors, vendorLinks, expenses, scopeChanges, sc.id)
                    : null
                }
                onApprove={handleApprove}
                onReject={handleReject}
                onEdit={openEditScopeChange}
                onDelete={setPendingDeleteScopeChange}
              />
            ))}
          </div>
        )}
      </section>

      <ExpenseForm
        key={expenseFormOpen ? (editingExpense?.id ?? 'new') : 'closed'}
        open={expenseFormOpen}
        onOpenChange={setExpenseFormOpen}
        expense={editingExpense}
        onSubmit={handleExpenseSubmit}
      />
      <AlertDialog open={pendingDeleteExpense !== null} onOpenChange={(open) => !open && setPendingDeleteExpense(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer « {pendingDeleteExpense?.description} » ?</AlertDialogTitle>
            <AlertDialogDescription>Cette dépense sera définitivement supprimée. Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteExpense}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ScopeChangeForm
        key={scopeFormOpen ? (editingScopeChange?.id ?? 'new') : 'closed'}
        open={scopeFormOpen}
        onOpenChange={setScopeFormOpen}
        scopeChange={editingScopeChange}
        onSubmit={handleScopeChangeSubmit}
      />
      <AlertDialog open={pendingDeleteScopeChange !== null} onOpenChange={(open) => !open && setPendingDeleteScopeChange(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer « {pendingDeleteScopeChange?.description} » ?</AlertDialogTitle>
            <AlertDialogDescription>Ce changement sera définitivement supprimé. Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteScopeChange}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1.5">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-heading text-xl font-semibold tabular-nums text-foreground">{value}</p>
      </CardContent>
    </Card>
  )
}
