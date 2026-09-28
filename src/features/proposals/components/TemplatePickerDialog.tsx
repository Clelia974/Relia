import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { computeProposalTotals } from '@/features/proposals/calculations'
import { currency } from '@/lib/currency'
import { useWorkspaceStore } from '@/store/workspaceStore'
import type { ProposalTier } from '@/types/entities'

interface TemplatePickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPick: (tier: ProposalTier) => void
}

/** Choix d'une formule (Silver/Gold/Platinum) — utilisé pour créer un devis, que ce soit depuis un mariage ou depuis une demande pas encore signée. */
export function TemplatePickerDialog({ open, onOpenChange, onPick }: TemplatePickerDialogProps) {
  const businessConfig = useWorkspaceStore((s) => s.workspace.businessConfig)
  const proposalTemplates = useWorkspaceStore((s) => s.workspace.proposalTemplates)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Choisir une formule</DialogTitle>
          <DialogDescription>Chaque formule est entièrement personnalisable une fois créée.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
          {proposalTemplates.map((template) => {
            const totals = computeProposalTotals(
              template.lines.map((l) => ({
                id: l.id,
                description: l.description,
                category: l.category,
                quantity: l.quantity,
                unitPrice: l.unitPrice,
                total: l.quantity * l.unitPrice,
                included: l.included,
                optional: l.optional,
              })),
              businessConfig.vatStatus,
              businessConfig.vatRate,
              undefined,
            )
            return (
              <button
                key={template.tier}
                type="button"
                onClick={() => onPick(template.tier)}
                className="flex flex-col gap-2 rounded-lg border border-border p-4 text-left transition-colors hover:border-thread hover:bg-accent"
              >
                <p className="font-heading text-lg font-semibold text-foreground">{template.label}</p>
                <p className="text-sm text-muted-foreground">{template.tagline}</p>
                <p className="mt-2 font-heading text-xl font-semibold tabular-nums text-foreground">{currency.format(totals.subtotal)}</p>
                <p className="text-xs text-muted-foreground">
                  {template.lines.length} ligne{template.lines.length !== 1 ? 's' : ''} préconfigurée
                  {template.lines.length !== 1 ? 's' : ''}
                </p>
              </button>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
