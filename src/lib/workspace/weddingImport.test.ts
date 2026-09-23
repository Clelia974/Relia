import ExcelJS from 'exceljs'
import { describe, expect, it } from 'vitest'
import {
  VENDOR_IMPORT_HEADERS,
  WEDDING_IMPORT_HEADERS,
  buildWeddingImportTemplateWorkbook,
} from '@/lib/workspace/weddingImportTemplate'
import { parseWeddingImportFile } from '@/lib/workspace/weddingImport'

async function toFile(workbook: ExcelJS.Workbook, name = 'import.xlsx'): Promise<File> {
  const buffer = await workbook.xlsx.writeBuffer()
  return new File([buffer], name, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

/** Construit un classeur Mariages(+Prestataires) avec les en-têtes du modèle, dans le même ordre de colonnes. */
function buildWorkbook(weddingRows: Record<string, unknown>[], vendorRows?: Record<string, unknown>[]): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook()

  const weddingKeys = Object.keys(WEDDING_IMPORT_HEADERS) as (keyof typeof WEDDING_IMPORT_HEADERS)[]
  const weddingsSheet = workbook.addWorksheet('Mariages')
  weddingsSheet.columns = weddingKeys.map((key) => ({ header: WEDDING_IMPORT_HEADERS[key], key }))
  for (const row of weddingRows) weddingsSheet.addRow(row)

  if (vendorRows) {
    const vendorKeys = Object.keys(VENDOR_IMPORT_HEADERS) as (keyof typeof VENDOR_IMPORT_HEADERS)[]
    const vendorsSheet = workbook.addWorksheet('Prestataires')
    vendorsSheet.columns = vendorKeys.map((key) => ({ header: VENDOR_IMPORT_HEADERS[key], key }))
    for (const row of vendorRows) vendorsSheet.addRow(row)
  }

  return workbook
}

describe('parseWeddingImportFile — feuille Mariages', () => {
  it("importe la ligne d'exemple du modèle téléchargeable sans erreur", async () => {
    const workbook = await buildWeddingImportTemplateWorkbook()
    const file = await toFile(workbook)

    const result = await parseWeddingImportFile(file)

    expect(result.fileError).toBeNull()
    expect(result.weddingRows).toHaveLength(1)
    expect(result.weddingRows[0].errors).toEqual([])
    expect(result.weddingRows[0].reference).toBe('M1')
    expect(result.weddingRows[0].data).toMatchObject({
      coupleName: 'Camille & Antoine',
      date: '2026-10-05',
      venue: 'Domaine de la Prairie, Rambouillet',
      clientBudget: 9000,
      soldAmount: 8400,
      status: 'en_preparation',
      clientAddress: '12 rue des Lilas, 75011 Paris',
      clientPhone: '06 12 34 56 78',
    })
    // L'exemple du modèle inclut aussi un prestataire (feuille Prestataires) qui référence M1.
    expect(result.vendorRows).toHaveLength(1)
    expect(result.vendorRows[0].errors).toEqual([])
    expect(result.vendorRows[0].data).toMatchObject({ name: 'Julien Roussel', category: 'Traiteur', status: 'confirme' })
  })

  it('accepte plusieurs lignes valides, un statut vide (Prospect par défaut) et des montants vides (0 par défaut)', async () => {
    const workbook = buildWorkbook([
      { reference: 'M1', coupleName: 'Nora & Thibault', date: '01/10/2026', venue: 'Le Clos des Cèdres', clientBudget: 5000, soldAmount: 4500, status: 'Signé' },
      { reference: 'M2', coupleName: 'Lina & Hugo', date: '03/11/2026', venue: 'Château de Villette' },
    ])
    const file = await toFile(workbook)

    const result = await parseWeddingImportFile(file)

    expect(result.weddingRows).toHaveLength(2)
    expect(result.weddingRows.every((r) => r.errors.length === 0)).toBe(true)
    expect(result.weddingRows[0].data?.status).toBe('signe')
    expect(result.weddingRows[1].data).toMatchObject({ status: 'prospect', clientBudget: 0, soldAmount: 0 })
  })

  it('ignore silencieusement une ligne entièrement vide (repère pré-rempli, reste non renseigné)', async () => {
    const workbook = buildWorkbook([
      { reference: 'M1', coupleName: 'Sofia & Marc', date: '28/12/2026', venue: 'Abbaye de Vaux-de-Cernay' },
      { reference: 'M2' },
      { reference: 'M3' },
    ])
    const file = await toFile(workbook)

    const result = await parseWeddingImportFile(file)

    expect(result.weddingRows).toHaveLength(1)
  })

  it.each([
    [{ reference: 'M1', coupleName: '', date: '01/10/2026', venue: 'Un lieu' }, 'Le nom du couple est obligatoire.'],
    [{ reference: 'M1', coupleName: 'Un couple', date: '', venue: 'Un lieu' }, 'Date invalide ou manquante'],
    [{ reference: 'M1', coupleName: 'Un couple', date: '01/10/2026', venue: '' }, 'Le lieu est obligatoire.'],
    [{ reference: 'M1', coupleName: 'Un couple', date: '31/13/2026', venue: 'Un lieu' }, 'Date invalide ou manquante'],
    [{ reference: 'M1', coupleName: 'Un couple', date: '01/10/2026', venue: 'Un lieu', status: 'Confus' }, 'non reconnu'],
    [{ reference: 'M1', coupleName: 'Un couple', date: '01/10/2026', venue: 'Un lieu', clientBudget: 'beaucoup' }, 'Budget client invalide.'],
  ])('signale une erreur ligne par ligne plutôt que de rejeter tout le fichier : %o', async (row, expectedMessage) => {
    const workbook = buildWorkbook([row])
    const file = await toFile(workbook)

    const result = await parseWeddingImportFile(file)

    expect(result.fileError).toBeNull()
    expect(result.weddingRows).toHaveLength(1)
    expect(result.weddingRows[0].data).toBeNull()
    expect(result.weddingRows[0].errors.some((e) => e.includes(expectedMessage as string))).toBe(true)
  })

  it('rejette un fichier dont les en-têtes ne correspondent pas au modèle', async () => {
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Feuille1')
    sheet.columns = [{ header: 'Colonne A', key: 'a' }, { header: 'Colonne B', key: 'b' }]
    sheet.addRow({ a: 1, b: 2 })
    const file = await toFile(workbook)

    const result = await parseWeddingImportFile(file)

    expect(result.fileError).toMatch(/modèle téléchargé/)
    expect(result.weddingRows).toEqual([])
  })

  it("rejette un fichier qui n'est pas un .xlsx valide, sans lever d'exception", async () => {
    const file = new File(['ceci n\'est pas un fichier Excel'], 'import.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const result = await parseWeddingImportFile(file)

    expect(result.fileError).toMatch(/valide/)
  })
})

describe('parseWeddingImportFile — feuille Prestataires (facultative)', () => {
  it("n'est pas une erreur si la feuille Prestataires est absente", async () => {
    const workbook = buildWorkbook([{ reference: 'M1', coupleName: 'Un couple', date: '01/10/2026', venue: 'Un lieu' }])
    const file = await toFile(workbook)

    const result = await parseWeddingImportFile(file)

    expect(result.fileError).toBeNull()
    expect(result.vendorRows).toEqual([])
  })

  it('relie un prestataire au bon mariage via le repère, avec des coûts vides laissés indéfinis (pas 0)', async () => {
    const workbook = buildWorkbook(
      [{ reference: 'M1', coupleName: 'Un couple', date: '01/10/2026', venue: 'Un lieu' }],
      [{ reference: 'M1', name: 'Julien Roussel', category: 'Traiteur', email: 'contact@traiteur.fr' }],
    )
    const file = await toFile(workbook)

    const result = await parseWeddingImportFile(file)

    expect(result.vendorRows).toHaveLength(1)
    expect(result.vendorRows[0].errors).toEqual([])
    expect(result.vendorRows[0].data).toMatchObject({ name: 'Julien Roussel', category: 'Traiteur', status: 'a_contacter' })
    expect(result.vendorRows[0].data?.estimatedCost).toBeUndefined()
    expect(result.vendorRows[0].data?.actualCost).toBeUndefined()
  })

  it('signale un prestataire dont le repère ne correspond à aucun mariage', async () => {
    const workbook = buildWorkbook(
      [{ reference: 'M1', coupleName: 'Un couple', date: '01/10/2026', venue: 'Un lieu' }],
      [{ reference: 'M9', name: 'Julien Roussel', category: 'Traiteur' }],
    )
    const file = await toFile(workbook)

    const result = await parseWeddingImportFile(file)

    expect(result.vendorRows[0].data).toBeNull()
    expect(result.vendorRows[0].errors.some((e) => e.includes('introuvable'))).toBe(true)
  })

  it('signale un prestataire dont le mariage référencé est lui-même en erreur, plutôt que de l\'importer orphelin', async () => {
    const workbook = buildWorkbook(
      [{ reference: 'M1', coupleName: '', date: '01/10/2026', venue: 'Un lieu' }], // mariage invalide : pas de nom de couple
      [{ reference: 'M1', name: 'Julien Roussel', category: 'Traiteur' }],
    )
    const file = await toFile(workbook)

    const result = await parseWeddingImportFile(file)

    expect(result.weddingRows[0].data).toBeNull()
    expect(result.vendorRows[0].data).toBeNull()
    expect(result.vendorRows[0].errors.some((e) => e.includes('introuvable'))).toBe(true)
  })

  it('ignore silencieusement une ligne prestataire entièrement vide', async () => {
    const workbook = buildWorkbook(
      [{ reference: 'M1', coupleName: 'Un couple', date: '01/10/2026', venue: 'Un lieu' }],
      [{ reference: 'M1', name: 'Julien Roussel', category: 'Traiteur' }, {}, {}],
    )
    const file = await toFile(workbook)

    const result = await parseWeddingImportFile(file)

    expect(result.vendorRows).toHaveLength(1)
  })

  it.each([
    [{ reference: 'M1', name: '', category: 'Traiteur' }, 'nom du prestataire est obligatoire'],
    [{ reference: 'M1', name: 'Julien', category: '' }, 'catégorie est obligatoire'],
    [{ reference: '', name: 'Julien', category: 'Traiteur' }, 'repère du mariage est obligatoire'],
    [{ reference: 'M1', name: 'Julien', category: 'Traiteur', email: 'pas-un-email' }, 'email invalide'],
    [{ reference: 'M1', name: 'Julien', category: 'Traiteur', arrivalTime: '25:99' }, "Heure d'arrivée invalide"],
    [{ reference: 'M1', name: 'Julien', category: 'Traiteur', status: 'Confus' }, 'non reconnu'],
    [{ reference: 'M1', name: 'Julien', category: 'Traiteur', estimatedCost: 'beaucoup' }, 'Coût estimé invalide'],
  ])('signale une erreur ligne par ligne sur la feuille Prestataires : %o', async (row, expectedMessage) => {
    const workbook = buildWorkbook(
      [{ reference: 'M1', coupleName: 'Un couple', date: '01/10/2026', venue: 'Un lieu' }],
      [row],
    )
    const file = await toFile(workbook)

    const result = await parseWeddingImportFile(file)

    expect(result.fileError).toBeNull()
    expect(result.vendorRows[0].data).toBeNull()
    expect(result.vendorRows[0].errors.some((e) => e.toLowerCase().includes((expectedMessage as string).toLowerCase()))).toBe(true)
  })

  it('rejette la feuille Prestataires si ses en-têtes ne correspondent pas au modèle, sans planter sur les Mariages déjà lus', async () => {
    const workbook = buildWorkbook([{ reference: 'M1', coupleName: 'Un couple', date: '01/10/2026', venue: 'Un lieu' }])
    const badVendorsSheet = workbook.addWorksheet('Prestataires')
    badVendorsSheet.columns = [{ header: 'Colonne A', key: 'a' }]
    badVendorsSheet.addRow({ a: 1 })
    const file = await toFile(workbook)

    const result = await parseWeddingImportFile(file)

    expect(result.fileError).toMatch(/Prestataires/)
  })
})
