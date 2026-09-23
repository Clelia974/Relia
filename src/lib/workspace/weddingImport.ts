import ExcelJS from 'exceljs'
import { VENDOR_STATUS_LABELS, VENDOR_STATUS_OPTIONS } from '@/lib/vendorStatus'
import { WEDDING_STATUS_LABELS, WEDDING_STATUS_OPTIONS } from '@/lib/weddingStatus'
import {
  VENDOR_IMPORT_HEADERS,
  VENDORS_SHEET_NAME,
  WEDDING_IMPORT_HEADERS,
  WEDDINGS_SHEET_NAME,
} from '@/lib/workspace/weddingImportTemplate'
import type { VendorStatus, WeddingStatus } from '@/types/entities'

export interface ParsedWedding {
  coupleName: string
  date: string
  venue: string
  clientBudget: number
  soldAmount: number
  status: WeddingStatus
  clientAddress?: string
  clientPhone?: string
  notes?: string
}

export interface WeddingImportRow {
  /** Numéro de ligne tel qu'affiché dans Excel (1 = en-tête). */
  rowNumber: number
  /** Repère (colonne "Repère", ex. "M1") — sert uniquement à relier les prestataires à ce mariage, jamais stocké sur le mariage créé. */
  reference: string
  data: ParsedWedding | null
  errors: string[]
}

export interface ParsedVendor {
  name: string
  company?: string
  category: string
  phone?: string
  email?: string
  status: VendorStatus
  arrivalTime?: string
  estimatedCost?: number
  actualCost?: number
  notes?: string
}

export interface VendorImportRow {
  rowNumber: number
  /** Repère du mariage auquel ce prestataire est censé être rattaché — résolu en id réel seulement à l'import (les mariages n'ont pas encore d'id tant qu'ils ne sont pas créés). */
  weddingReference: string
  data: ParsedVendor | null
  errors: string[]
}

export interface WeddingImportResult {
  /** Non vide uniquement si le fichier lui-même est illisible ou si la feuille Mariages ne correspond pas au modèle — aucune ligne n'est alors analysée. */
  fileError: string | null
  weddingRows: WeddingImportRow[]
  vendorRows: VendorImportRow[]
}

const WEDDING_STATUS_BY_LABEL = new Map<string, WeddingStatus>(
  WEDDING_STATUS_OPTIONS.map((status) => [WEDDING_STATUS_LABELS[status].toLowerCase(), status]),
)
const VENDOR_STATUS_BY_LABEL = new Map<string, VendorStatus>(
  VENDOR_STATUS_OPTIONS.map((status) => [VENDOR_STATUS_LABELS[status].toLowerCase(), status]),
)

function cellToString(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') {
    if ('richText' in value) return value.richText.map((part) => part.text).join('').trim()
    if ('text' in value) return String(value.text ?? '').trim()
    if ('result' in value) return String(value.result ?? '').trim()
  }
  return String(value).trim()
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/**
 * Modèle : JJ/MM/AAAA en texte. Accepte aussi une vraie cellule date Excel
 * et, en repli, un format ISO (yyyy-MM-dd). Construit la chaîne ISO à la
 * main (jamais via `new Date(y, m, d).toISOString()`) : ce dernier convertit
 * en UTC selon le fuseau de la machine qui lit le fichier, ce qui décale la
 * date d'un jour pour toute cliente à l'est de Greenwich. Valide aussi que
 * le jour/mois forment une vraie date calendaire — `new Date(2026, 12, 31)`
 * (mois 13) ne lève pas d'erreur, il déborde silencieusement sur janvier
 * 2027, donc on détecte ce débordement explicitement plutôt que d'importer
 * une date fausse.
 */
function cellToDateIso(value: ExcelJS.CellValue): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getUTCFullYear()}-${pad2(value.getUTCMonth() + 1)}-${pad2(value.getUTCDate())}`
  }
  const text = cellToString(value)
  if (!text) return null

  const frMatch = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (frMatch) {
    const [, dayText, monthText, year] = frMatch
    const day = Number(dayText)
    const month = Number(monthText)
    if (month < 1 || month > 12) return null
    const check = new Date(Date.UTC(Number(year), month - 1, day))
    if (check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) return null
    return `${year}-${pad2(month)}-${pad2(day)}`
  }

  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})/)
  return isoMatch ? `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}` : null
}

/** Vide → 0 (montants facultatifs sur la feuille Mariages). "9 000 €" / "9000,50" acceptés. */
function cellToAmountOrZero(value: ExcelJS.CellValue): number | null {
  const text = cellToString(value).replace(/[€\s]/g, '').replace(',', '.')
  if (!text) return 0
  const n = Number(text)
  return Number.isNaN(n) ? null : n
}

/** Vide → undefined (coûts prestataire : l'absence de valeur est distincte de "0 €", cf. VendorWeddingLink). */
function cellToOptionalAmount(value: ExcelJS.CellValue): number | undefined | null {
  const text = cellToString(value).replace(/[€\s]/g, '').replace(',', '.')
  if (!text) return undefined
  const n = Number(text)
  return Number.isNaN(n) ? null : n
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const TIME_PATTERN = /^([01]?\d|2[0-3]):([0-5]\d)$/

function buildColumnIndex<K extends string>(
  headerRow: ExcelJS.Row,
  headers: Record<K, string>,
  optionalKeys: readonly K[],
): Map<K, number> | null {
  const byHeader = new Map<string, number>()
  headerRow.eachCell((cell, colNumber) => {
    byHeader.set(cellToString(cell.value).toLowerCase(), colNumber)
  })

  const index = new Map<K, number>()
  for (const key of Object.keys(headers) as K[]) {
    const colNumber = byHeader.get(headers[key].toLowerCase())
    if (colNumber === undefined && !optionalKeys.includes(key)) return null
    if (colNumber !== undefined) index.set(key, colNumber)
  }
  return index
}

function parseWeddingsSheet(sheet: ExcelJS.Worksheet): WeddingImportRow[] | null {
  const columnIndex = buildColumnIndex<keyof typeof WEDDING_IMPORT_HEADERS>(sheet.getRow(1), WEDDING_IMPORT_HEADERS, [
    'notes',
    'clientAddress',
    'clientPhone',
  ])
  if (!columnIndex) return null

  const rows: WeddingImportRow[] = []

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return

    const cell = (key: keyof typeof WEDDING_IMPORT_HEADERS) => {
      const col = columnIndex.get(key)
      return col === undefined ? undefined : row.getCell(col).value
    }

    const reference = cellToString(cell('reference'))
    const coupleName = cellToString(cell('coupleName'))
    const venue = cellToString(cell('venue'))
    const clientAddress = cellToString(cell('clientAddress'))
    const clientPhone = cellToString(cell('clientPhone'))
    const notes = cellToString(cell('notes'))
    const dateValue = cell('date')
    const statusLabel = cellToString(cell('status'))

    // Ligne entièrement vide (repère pré-rempli mais rien renseigné à côté) → ignorée sans erreur.
    if (!coupleName && !venue && !dateValue && !statusLabel) return

    const errors: string[] = []

    if (!coupleName) errors.push('Le nom du couple est obligatoire.')
    if (!venue) errors.push('Le lieu est obligatoire.')

    const date = cellToDateIso(dateValue)
    if (!date) errors.push('Date invalide ou manquante (format attendu : JJ/MM/AAAA).')

    const status = statusLabel ? WEDDING_STATUS_BY_LABEL.get(statusLabel.toLowerCase()) : 'prospect'
    if (statusLabel && !status) {
      errors.push(`Statut « ${statusLabel} » non reconnu — choisis-le dans la liste déroulante de la colonne.`)
    }

    const clientBudget = cellToAmountOrZero(cell('clientBudget'))
    if (clientBudget === null) errors.push('Budget client invalide.')

    const soldAmount = cellToAmountOrZero(cell('soldAmount'))
    if (soldAmount === null) errors.push('Montant du contrat invalide.')

    if (errors.length > 0 || !date || clientBudget === null || soldAmount === null || !status) {
      rows.push({ rowNumber, reference, data: null, errors })
      return
    }

    rows.push({
      rowNumber,
      reference,
      errors: [],
      data: {
        coupleName,
        date,
        venue,
        clientBudget,
        soldAmount,
        status,
        clientAddress: clientAddress || undefined,
        clientPhone: clientPhone || undefined,
        notes: notes || undefined,
      },
    })
  })

  return rows
}

function parseVendorsSheet(sheet: ExcelJS.Worksheet, validReferences: Set<string>): VendorImportRow[] | null {
  const columnIndex = buildColumnIndex<keyof typeof VENDOR_IMPORT_HEADERS>(sheet.getRow(1), VENDOR_IMPORT_HEADERS, [
    'company',
    'phone',
    'email',
    'status',
    'arrivalTime',
    'estimatedCost',
    'actualCost',
    'notes',
  ])
  if (!columnIndex) return null

  const rows: VendorImportRow[] = []

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return

    const cell = (key: keyof typeof VENDOR_IMPORT_HEADERS) => {
      const col = columnIndex.get(key)
      return col === undefined ? undefined : row.getCell(col).value
    }

    const reference = cellToString(cell('reference'))
    const name = cellToString(cell('name'))
    const company = cellToString(cell('company'))
    const category = cellToString(cell('category'))
    const phone = cellToString(cell('phone'))
    const email = cellToString(cell('email'))
    const statusLabel = cellToString(cell('status'))
    const arrivalTime = cellToString(cell('arrivalTime'))
    const notes = cellToString(cell('notes'))

    // Ligne entièrement vide → ignorée sans erreur.
    if (!reference && !name && !category) return

    const errors: string[] = []

    if (!name) errors.push('Le nom du prestataire est obligatoire.')
    if (!category) errors.push('La catégorie est obligatoire.')

    if (!reference) {
      errors.push('Le repère du mariage est obligatoire (colonne « Repère mariage »).')
    } else if (!validReferences.has(reference)) {
      errors.push(`Repère « ${reference} » introuvable ou en erreur sur la feuille Mariages — corrige ce mariage d'abord.`)
    }

    if (email && !EMAIL_PATTERN.test(email)) errors.push('Adresse email invalide.')
    if (arrivalTime && !TIME_PATTERN.test(arrivalTime)) errors.push("Heure d'arrivée invalide (format attendu : HH:MM).")

    const status = statusLabel ? VENDOR_STATUS_BY_LABEL.get(statusLabel.toLowerCase()) : 'a_contacter'
    if (statusLabel && !status) {
      errors.push(`Statut « ${statusLabel} » non reconnu — choisis-le dans la liste déroulante de la colonne.`)
    }

    const estimatedCost = cellToOptionalAmount(cell('estimatedCost'))
    if (estimatedCost === null) errors.push('Coût estimé invalide.')

    const actualCost = cellToOptionalAmount(cell('actualCost'))
    if (actualCost === null) errors.push('Coût réel invalide.')

    if (errors.length > 0 || estimatedCost === null || actualCost === null || !status) {
      rows.push({ rowNumber, weddingReference: reference, data: null, errors })
      return
    }

    rows.push({
      rowNumber,
      weddingReference: reference,
      errors: [],
      data: {
        name,
        category,
        status,
        company: company || undefined,
        phone: phone || undefined,
        email: email || undefined,
        arrivalTime: arrivalTime || undefined,
        estimatedCost,
        actualCost,
        notes: notes || undefined,
      },
    })
  })

  return rows
}

export async function parseWeddingImportFile(file: File): Promise<WeddingImportResult> {
  const workbook = new ExcelJS.Workbook()
  try {
    const buffer = await file.arrayBuffer()
    await workbook.xlsx.load(buffer)
  } catch {
    return { fileError: "Ce fichier n'est pas un fichier Excel (.xlsx) valide.", weddingRows: [], vendorRows: [] }
  }

  const weddingsSheet = workbook.getWorksheet(WEDDINGS_SHEET_NAME) ?? workbook.worksheets[0]
  if (!weddingsSheet || weddingsSheet.rowCount === 0) {
    return { fileError: 'Le fichier est vide.', weddingRows: [], vendorRows: [] }
  }

  const weddingRows = parseWeddingsSheet(weddingsSheet)
  if (!weddingRows) {
    return {
      fileError:
        "Les colonnes de la feuille « Mariages » ne correspondent pas au modèle. Repars du modèle téléchargé (« Télécharger le modèle ») sans renommer les en-têtes.",
      weddingRows: [],
      vendorRows: [],
    }
  }

  // La feuille Prestataires est facultative : son absence n'est jamais une erreur, seul un en-tête modifié en est une.
  const vendorsSheet = workbook.getWorksheet(VENDORS_SHEET_NAME)
  if (!vendorsSheet) {
    return { fileError: null, weddingRows, vendorRows: [] }
  }

  const validReferences = new Set(weddingRows.filter((r) => r.data !== null).map((r) => r.reference))
  const vendorRows = parseVendorsSheet(vendorsSheet, validReferences)
  if (!vendorRows) {
    return {
      fileError:
        "Les colonnes de la feuille « Prestataires » ne correspondent pas au modèle. Repars du modèle téléchargé (« Télécharger le modèle ») sans renommer les en-têtes.",
      weddingRows: [],
      vendorRows: [],
    }
  }

  return { fileError: null, weddingRows, vendorRows }
}
