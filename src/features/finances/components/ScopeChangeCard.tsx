import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { MoreHorizontal } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SCOPE_CHANGE_STATUS_LABELS, isScopeChangeBillable } from '@/lib/scopeChangeStatus'
import { cn } from '@/lib/utils'
import type { ScopeChange } from '@/types/entities'

const currency = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0, signDisplay: 'never' })

const STATUS_TONE: Record<ScopeChange['status'], string> = {
  proposee: 'bg-muted text-muted-foreground',
  a_envoyer: 'bg-muted text-muted-foreground',
  en_attente_approbation: 'bg-warning-bg text-warning',
  approuvee: 'bg-success-bg text-success',
  realisee: 'bg-success-bg text-success',
  rejetee: 'bg-risk-bg text-risk',
}

const PENDING_STATUSES: ScopeChange['status'][] = ['proposee', 'a_envoyer', 'en_attente_approbation']

interface ScopeChangeCardProps {
  scopeChange: ScopeChange
  impact: { marginBefore: number; marginAfter: number } | null
  onApprove: (scopeChange: ScopeChange) => void
  onReject: (scopeChange: ScopeChange) => void
  onEdit: (scopeChange: ScopeChange) => void
  onDelete: (scopeChange: ScopeChange) => void
}

export function ScopeChangeCard({ scopeChange, impact, onApprove, onReject, onEdit, onDelete }: ScopeChangeCardProps) {
  const isPending = PENDING_STATUSES.includes(scopeChange.status)
  const billable = isScopeChangeBillable(scopeChange.status)
  const profitPotential = scopeChange.clientPrice - scopeChange.vendorCost

  return (
    <Card>
      <CardContent className="flex flex-col gap-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium text-foreground">{scopeChange.description}</p>
            <p className="text-xs text-muted-foreground">{format(new Date(scopeChange.date), 'd MMM yyyy', { locale: fr })}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={`Actions pour ${scopeChange.description}`}
                className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <MoreHorizontal className="size-4" aria-hidden="true" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => onEdit(scopeChange)}>Modifier</DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onSelect={() => onDelete(scopeChange)}>
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Badge className={cn('w-fit border-transparent font-medium', STATUS_TONE[scopeChange.status])}>
          {SCOPE_CHANGE_STATUS_LABELS[scopeChange.status]}
        </Badge>

        <dl className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Coût fournisseur</dt>
            <dd className="tabular-nums text-foreground">{currency.format(scopeChange.vendorCost)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Prix facturé</dt>
            <dd className="tabular-nums text-foreground">{scopeChange.clientPrice === 0 ? 'Non facturé' : currency.format(scopeChange.clientPrice)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">{billable ? 'Profit approuvé' : 'Profit potentiel'}</dt>
            <dd className={cn('tabular-nums', profitPotential < 0 ? 'text-risk' : 'text-foreground')}>
              {profitPotential < 0 ? '-' : ''}
              {currency.format(profitPotential)}
            </dd>
          </div>
        </dl>

        {isPending && impact && (
          <p className="rounded-md bg-muted px-2.5 py-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Impact potentiel : </span>
            ce changement pourrait faire passer la marge de {Math.round(impact.marginBefore)}% à {Math.round(impact.marginAfter)}%.
          </p>
        )}

        {scopeChange.notes && <p className="text-xs text-muted-foreground">{scopeChange.notes}</p>}

        {isPending && (
          <div className="flex gap-2">
            <Button size="sm" onClick={() => onApprove(scopeChange)}>
              Approuver
            </Button>
            <Button size="sm" variant="outline" onClick={() => onReject(scopeChange)}>
              Rejeter
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
