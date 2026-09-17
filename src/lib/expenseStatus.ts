import type { ExpenseStatus } from '@/types/entities'

export const EXPENSE_STATUS_LABELS: Record<ExpenseStatus, string> = {
  prevue: 'Prévue',
  engagee: 'Engagée',
  payee: 'Payée',
}

export const EXPENSE_STATUS_OPTIONS: ExpenseStatus[] = ['prevue', 'engagee', 'payee']
