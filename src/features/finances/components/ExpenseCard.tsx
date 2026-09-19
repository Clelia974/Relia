import { MoreHorizontal } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { type BadgeTone, toneClass } from '@/lib/badgeTone'
import { currency } from '@/lib/currency'
import { formatShortDate } from '@/lib/dateFormat'
import { EXPENSE_CATEGORY_LABELS } from '@/lib/expenseCategory'
import { EXPENSE_STATUS_LABELS } from '@/lib/expenseStatus'
import type { Expense } from '@/types/entities'

const STATUS_TONE: Record<Expense['status'], BadgeTone> = {
  prevue: 'muted',
  engagee: 'warning',
  payee: 'success',
}

interface ExpenseCardProps {
  expense: Expense
  onEdit: (expense: Expense) => void
  onDelete: (expense: Expense) => void
}

export function ExpenseCard({ expense, onEdit, onDelete }: ExpenseCardProps) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium text-foreground">{expense.description}</p>
            <p className="text-xs text-muted-foreground">{formatShortDate(expense.date)}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="font-heading text-base font-semibold tabular-nums text-foreground">{currency.format(expense.amount)}</span>
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label={`Actions pour ${expense.description}`}
                      className="relative rounded-md p-1.5 text-muted-foreground transition-colors after:absolute after:-inset-3.5 hover:bg-accent hover:text-accent-foreground"
                    >
                      <MoreHorizontal className="size-4" aria-hidden="true" />
                    </button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>Actions</TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => onEdit(expense)}>Modifier</DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onSelect={() => onDelete(expense)}>
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline">{EXPENSE_CATEGORY_LABELS[expense.category]}</Badge>
          <Badge className={toneClass(STATUS_TONE[expense.status])}>{EXPENSE_STATUS_LABELS[expense.status]}</Badge>
        </div>

        {expense.notes && <p className="text-xs text-muted-foreground">{expense.notes}</p>}
      </CardContent>
    </Card>
  )
}
