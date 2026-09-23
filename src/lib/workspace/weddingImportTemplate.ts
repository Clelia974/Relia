import ExcelJS from 'exceljs'
import { VENDOR_STATUS_LABELS, VENDOR_STATUS_OPTIONS } from '@/lib/vendorStatus'
import { WEDDING_STATUS_LABELS, WEDDING_STATUS_OPTIONS } from '@/lib/weddingStatus'

/**
 * Nombre de lignes pré-remplies avec un repère (M1, M2…) sur la feuille
 * Mariages. La cliente n'invente jamais ce repère : elle le voit déjà posé
 * en face de chaque ligne et n'a qu'à le recopier dans la feuille
 * Prestataires pour relier un prestataire à son mariage. Fixe la limite du
 * nombre de mariages importables en une fois — largement suffisant pour un
 * import ponctuel de migration, pas pour un usage courant.
 */
export const MAX_IMPORT_ROWS = 40

export const WEDDING_IMPORT_HEADERS = {
  reference: 'Repère',
  coupleName: 'Prénoms du couple',
  date: 'Date du mariage (JJ/MM/AAAA)',
  venue: 'Lieu',
  clientBudget: 'Budget client (€)',
  soldAmount: 'Montant du contrat (€)',
  status: 'Statut',
  clientAddress: 'Adresse client',
  clientPhone: 'Téléphone client',
  notes: 'Notes (optionnel)',
} as const

export const VENDOR_IMPORT_HEADERS = {
  reference: 'Repère mariage',
  name: 'Nom du prestataire',
  company: 'Entreprise',
  category: 'Catégorie',
  phone: 'Téléphone',
  email: 'Email',
  status: 'Statut',
  arrivalTime: "Heure d'arrivée (HH:MM)",
  estimatedCost: 'Coût estimé (€)',
  actualCost: 'Coût réel (€)',
  notes: 'Notes (optionnel)',
} as const

export const WEDDINGS_SHEET_NAME = 'Mariages'
export const VENDORS_SHEET_NAME = 'Prestataires'

const referenceLabel = (index: number) => `M${index + 1}`

/** Exportée séparément du déclenchement du téléchargement pour rester testable sans DOM (cf. weddingImport.test.ts), et réutilisée par la génération du fichier à télécharger. */
export async function buildWeddingImportTemplateWorkbook(): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook()

  const weddingsSheet = workbook.addWorksheet(WEDDINGS_SHEET_NAME)
  weddingsSheet.columns = [
    { header: WEDDING_IMPORT_HEADERS.reference, key: 'reference', width: 10 },
    { header: WEDDING_IMPORT_HEADERS.coupleName, key: 'coupleName', width: 28 },
    { header: WEDDING_IMPORT_HEADERS.date, key: 'date', width: 26 },
    { header: WEDDING_IMPORT_HEADERS.venue, key: 'venue', width: 32 },
    { header: WEDDING_IMPORT_HEADERS.clientBudget, key: 'clientBudget', width: 18 },
    { header: WEDDING_IMPORT_HEADERS.soldAmount, key: 'soldAmount', width: 22 },
    { header: WEDDING_IMPORT_HEADERS.status, key: 'status', width: 18 },
    { header: WEDDING_IMPORT_HEADERS.clientAddress, key: 'clientAddress', width: 32 },
    { header: WEDDING_IMPORT_HEADERS.clientPhone, key: 'clientPhone', width: 18 },
    { header: WEDDING_IMPORT_HEADERS.notes, key: 'notes', width: 32 },
  ]
  weddingsSheet.getRow(1).font = { bold: true }

  weddingsSheet.addRow({
    reference: referenceLabel(0),
    coupleName: 'Camille & Antoine',
    date: '05/10/2026',
    venue: 'Domaine de la Prairie, Rambouillet',
    clientBudget: 9000,
    soldAmount: 8400,
    status: WEDDING_STATUS_LABELS.en_preparation,
    clientAddress: '12 rue des Lilas, 75011 Paris',
    clientPhone: '06 12 34 56 78',
    notes: 'Exemple — remplace ou supprime cette ligne',
  })
  for (let i = 1; i < MAX_IMPORT_ROWS; i++) {
    weddingsSheet.addRow({ reference: referenceLabel(i) })
  }

  const weddingStatusFormula = `"${WEDDING_STATUS_OPTIONS.map((s) => WEDDING_STATUS_LABELS[s]).join(',')}"`
  const weddingStatusColumn = weddingsSheet.getColumn('status').letter
  for (let row = 2; row <= MAX_IMPORT_ROWS + 1; row++) {
    weddingsSheet.getCell(`${weddingStatusColumn}${row}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [weddingStatusFormula],
      showErrorMessage: true,
      error: 'Choisis un statut dans la liste proposée.',
    }
  }

  const vendorsSheet = workbook.addWorksheet(VENDORS_SHEET_NAME)
  vendorsSheet.columns = [
    { header: VENDOR_IMPORT_HEADERS.reference, key: 'reference', width: 14 },
    { header: VENDOR_IMPORT_HEADERS.name, key: 'name', width: 24 },
    { header: VENDOR_IMPORT_HEADERS.company, key: 'company', width: 24 },
    { header: VENDOR_IMPORT_HEADERS.category, key: 'category', width: 18 },
    { header: VENDOR_IMPORT_HEADERS.phone, key: 'phone', width: 18 },
    { header: VENDOR_IMPORT_HEADERS.email, key: 'email', width: 26 },
    { header: VENDOR_IMPORT_HEADERS.status, key: 'status', width: 18 },
    { header: VENDOR_IMPORT_HEADERS.arrivalTime, key: 'arrivalTime', width: 20 },
    { header: VENDOR_IMPORT_HEADERS.estimatedCost, key: 'estimatedCost', width: 16 },
    { header: VENDOR_IMPORT_HEADERS.actualCost, key: 'actualCost', width: 16 },
    { header: VENDOR_IMPORT_HEADERS.notes, key: 'notes', width: 32 },
  ]
  vendorsSheet.getRow(1).font = { bold: true }
  vendorsSheet.addRow({
    reference: referenceLabel(0),
    name: 'Julien Roussel',
    company: 'Traiteur Les Saveurs',
    category: 'Traiteur',
    phone: '',
    email: 'contact@lessaveurs.fr',
    status: VENDOR_STATUS_LABELS.confirme,
    arrivalTime: '10:00',
    estimatedCost: 4200,
    actualCost: 4200,
    notes: 'Exemple — remplace ou supprime cette ligne. Le repère renvoie au mariage correspondant, feuille Mariages.',
  })

  const vendorStatusFormula = `"${VENDOR_STATUS_OPTIONS.map((s) => VENDOR_STATUS_LABELS[s]).join(',')}"`
  const vendorStatusColumn = vendorsSheet.getColumn('status').letter
  const vendorReferenceColumn = vendorsSheet.getColumn('reference').letter
  // La liste des repères valides est prise directement sur la feuille Mariages : toujours cohérente avec MAX_IMPORT_ROWS, jamais à dupliquer à la main.
  const referenceRange = `${WEDDINGS_SHEET_NAME}!$A$2:$A$${MAX_IMPORT_ROWS + 1}`
  for (let row = 2; row <= 200; row++) {
    vendorsSheet.getCell(`${vendorStatusColumn}${row}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [vendorStatusFormula],
      showErrorMessage: true,
      error: 'Choisis un statut dans la liste proposée.',
    }
    vendorsSheet.getCell(`${vendorReferenceColumn}${row}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [referenceRange],
      showErrorMessage: true,
      error: 'Choisis le repère du mariage correspondant (feuille Mariages).',
    }
  }

  const help = workbook.addWorksheet('Aide')
  help.columns = [{ key: 'line', width: 100 }]
  help.addRows([
    { line: 'Comment utiliser ce modèle' },
    { line: '' },
    { line: '1. Feuille "Mariages" : une ligne par mariage. Le repère (M1, M2…) est déjà rempli, ne le modifie pas.' },
    { line: '2. Feuille "Prestataires" (facultative) : une ligne par prestataire. La colonne "Repère mariage" indique à quel mariage il appartient — choisis-le dans la liste déroulante.' },
    { line: '3. Les colonnes "Statut" et "Repère mariage" proposent une liste déroulante : choisis toujours une valeur dedans plutôt que de la retaper.' },
    { line: '4. Supprime la ligne d\'exemple si tu ne veux pas l\'importer.' },
    { line: '5. Dépose ce fichier dans Paramètres > Importer des mariages (Excel) une fois rempli.' },
  ])
  help.getRow(1).font = { bold: true }

  return workbook
}

/** Déclenche le téléchargement du modèle Excel (deux feuilles : Mariages et Prestataires, listes déroulantes incluses). */
export async function downloadWeddingImportTemplate(): Promise<void> {
  const workbook = await buildWeddingImportTemplateWorkbook()
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = 'relia-modele-import-mariages.xlsx'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
