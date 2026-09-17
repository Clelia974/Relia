import type { ExpenseCategory } from '@/types/entities'

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  main_doeuvre: "Main-d'œuvre",
  fournitures: 'Fournitures',
  transport: 'Transport',
  location: 'Location',
  repas: 'Repas',
  hebergement: 'Hébergement',
  frais_divers: 'Frais divers',
  autre: 'Autre',
}

export const EXPENSE_CATEGORY_OPTIONS: ExpenseCategory[] = [
  'main_doeuvre',
  'fournitures',
  'transport',
  'location',
  'repas',
  'hebergement',
  'frais_divers',
  'autre',
]
