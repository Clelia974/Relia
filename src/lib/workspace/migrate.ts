import { createDefaultProposalTemplates } from '@/features/proposals/templates'
import { createDefaultTaskTemplate } from '@/features/tasks/defaultTaskTemplate'
import { CURRENT_SCHEMA_VERSION, WorkspaceSchema } from '@/schemas/workspace'
import { generateId } from '@/lib/id'
import type { Workspace } from '@/types/entities'

export type MigrationResult =
  | { ok: true; workspace: Workspace }
  | { ok: false; reason: string }

/**
 * Migrations séquentielles par version d'origine.
 *
 * v1 → v2 (Phase 8) : sépare clairement "autre dépense" et "coût
 * fournisseur". L'ancien Expense (label/plannedAmount/actualAmount/kind,
 * vendorId optionnel) devient une dépense générale au nouveau format
 * (description/category/amount/date/status) — les coûts fournisseurs vivent
 * désormais uniquement sur Vendor.estimatedCost/actualCost. Les anciennes
 * lignes de type "recette" n'ont plus de sens dans ce modèle et sont
 * abandonnées. Le ScopeChange (costImpact unique) devient vendorCost/
 * clientPrice distincts ; faute de mieux on suppose que l'ancien coût était
 * intégralement refacturé au client (meilleur effort, aucune UI n'existait
 * encore pour créer un scope change avant cette phase).
 */
const migrations: Record<number, (data: Record<string, unknown>) => Record<string, unknown>> = {
  1: (data) => {
    const nowIso = new Date().toISOString()

    const oldExpenses = Array.isArray(data.expenses) ? (data.expenses as Record<string, unknown>[]) : []
    const expenses = oldExpenses
      .filter((e) => e.kind !== 'recette')
      .map((e) => ({
        id: e.id,
        weddingId: e.weddingId,
        description: typeof e.label === 'string' && e.label.length > 0 ? e.label : 'Dépense',
        category: 'autre',
        amount: typeof e.actualAmount === 'number' ? e.actualAmount : (typeof e.plannedAmount === 'number' ? e.plannedAmount : 0),
        date: nowIso,
        status: 'engagee',
        createdAt: nowIso,
        updatedAt: nowIso,
      }))

    const oldScopeChanges = Array.isArray(data.scopeChanges) ? (data.scopeChanges as Record<string, unknown>[]) : []
    const statusMap: Record<string, string> = { acceptee: 'approuvee', refusee: 'rejetee', proposee: 'proposee' }
    const scopeChanges = oldScopeChanges.map((sc) => {
      const cost = typeof sc.costImpact === 'number' ? Math.max(sc.costImpact, 0) : 0
      const createdAt = typeof sc.createdAt === 'string' ? sc.createdAt : nowIso
      return {
        id: sc.id,
        weddingId: sc.weddingId,
        description: sc.description,
        date: createdAt,
        vendorCost: cost,
        clientPrice: cost,
        status: statusMap[sc.status as string] ?? 'proposee',
        notes: typeof sc.planningImpact === 'string' ? sc.planningImpact : undefined,
        createdAt,
        updatedAt: createdAt,
      }
    })

    return { ...data, schemaVersion: 2, expenses, scopeChanges }
  },

  /**
   * v2 → v3 (Phase 9) : Proposal et Invoice passent d'un format minimal
   * (tier/lines/totalAmount) à un modèle complet (lignes détaillées,
   * TVA indicative, acompte/solde, statuts). Aucune UI n'existait avant cette
   * phase pour créer une proposition ou une facture indicative : les anciens
   * tableaux sont donc structurellement incompatibles mais toujours vides en
   * pratique — meilleur effort, on repart d'un tableau vide plutôt que de
   * risquer une donnée à moitié valide.
   */
  2: (data) => ({ ...data, schemaVersion: 3, proposals: [], invoices: [] }),

  /**
   * v3 → v4 (correction bug critique) : le coût d'un prestataire
   * (estimatedCost/actualCost) vivait sur Vendor lui-même — un scalaire
   * unique, alors qu'un même prestataire peut être lié à plusieurs mariages
   * (Vendor.weddingIds). Résultat : un prestataire partagé voyait son coût
   * compté intégralement dans CHAQUE mariage lié, faussant leur marge à
   * chacun. Le coût devient une relation (VendorWeddingLink), un enregistrement
   * par (vendorId, weddingId).
   *
   * Pour un prestataire lié à un seul mariage : un lien créé avec le même
   * coût, needsCostReview absent — comportement strictement identique à
   * avant la migration, aucune perte, aucune ambiguïté à signaler.
   *
   * Pour un prestataire lié à ≥2 mariages : un lien par mariage, chacun
   * recevant une COPIE du même coût (impossible de deviner rétroactivement
   * quel montant appartenait à quel mariage) et marqué needsCostReview: true
   * pour que l'interface avertisse clairement que ce chiffre doit être
   * vérifié avant d'être considéré comme fiable.
   */
  3: (data) => {
    const oldVendors = Array.isArray(data.vendors) ? (data.vendors as Record<string, unknown>[]) : []
    const links: Record<string, unknown>[] = []

    const vendors = oldVendors.map((vendor) => {
      const weddingIds = Array.isArray(vendor.weddingIds) ? (vendor.weddingIds as string[]) : []
      const estimatedCost = typeof vendor.estimatedCost === 'number' ? vendor.estimatedCost : undefined
      const actualCost = typeof vendor.actualCost === 'number' ? vendor.actualCost : undefined
      const isShared = weddingIds.length >= 2

      if (estimatedCost !== undefined || actualCost !== undefined) {
        for (const weddingId of weddingIds) {
          links.push({
            id: generateId(),
            vendorId: vendor.id,
            weddingId,
            estimatedCost,
            actualCost,
            ...(isShared ? { needsCostReview: true } : {}),
          })
        }
      }

      const { estimatedCost: _estimatedCost, actualCost: _actualCost, ...rest } = vendor
      return rest
    })

    return {
      ...data,
      schemaVersion: 4,
      vendors,
      vendorWeddingLinks: [...(Array.isArray(data.vendorWeddingLinks) ? data.vendorWeddingLinks : []), ...links],
    }
  },

  /**
   * v4 → v5 (Phase 1) : ajoute les prestations vendues (SoldService), qui
   * matérialisent — une fois une proposition approuvée — ce qui a réellement
   * été vendu au client, distinct des lignes de la proposition (qui peuvent
   * encore changer après approbation via un scope change). Aucune donnée
   * existante n'est concernée : le tableau démarre vide, à peupler ensuite
   * depuis une proposition approuvée.
   */
  4: (data) => ({ ...data, schemaVersion: 5, soldServices: [] }),

  /**
   * v5 → v6 (Phase 2) : ajoute la checklist matériel (EquipmentItem) par
   * mariage. Aucune donnée existante n'est concernée : le tableau démarre
   * vide.
   */
  5: (data) => ({ ...data, schemaVersion: 6, equipmentItems: [] }),

  /**
   * v6 → v7 (Phase 3) : ajoute un champ `phase` facultatif (installation /
   * cérémonie / réception / démontage) sur Task et TimelineEvent, pour le
   * filtrage de la Vue Jour J. Purement additif — aucune transformation de
   * données existantes, `phase` reste simplement absent sur les tâches et
   * moments déjà créés.
   */
  6: (data) => ({ ...data, schemaVersion: 7 }),

  /**
   * v7 → v8 (Phase 4) : ajoute le suivi de désinstallation (isDamaged,
   * damageNotes, destination, destinationNotes, returnedAt) sur EquipmentItem
   * existant — pas de nouvelle entité. Purement additif, aucune
   * transformation de données existantes.
   */
  7: (data) => ({ ...data, schemaVersion: 8 }),

  /**
   * v8 → v9 (Phase 5) : ajoute la clôture et le bilan post-mariage
   * (ClosingSession) — nouvelle entité, plus `closingSessionId` facultatif
   * sur Wedding. Purement additif, aucune transformation de données
   * existantes : aucun mariage existant n'est marqué clôturé.
   */
  8: (data) => ({ ...data, schemaVersion: 9, closingSessions: [] }),

  /**
   * v9 → v10 (Phase 2b) : ajoute Invoice.status ('brouillon' | 'finalisee')
   * et Invoice.finalizedAt facultatif, pour verrouiller une facture finalisée
   * exactement comme Proposal.status le fait déjà pour les propositions.
   * Purement additif : InvoiceStatusSchema a un default('brouillon'), donc
   * toute facture déjà existante (créée avant ce champ) est relue comme
   * "brouillon" — jamais verrouillée rétroactivement, jamais traitée comme
   * "finalisee" sans qu'une action explicite ne l'ait décidé.
   */
  9: (data) => ({ ...data, schemaVersion: 10 }),

  /**
   * v10 → v11 (Phase 3) : status et arrivalTime quittent Vendor (fiche
   * catalogue globale) pour VendorWeddingLink (affectation à UN mariage) —
   * même défaut que celui corrigé pour le coût en v3→v4 : confirmer un
   * prestataire pour le mariage A le confirmait pour tous ses autres mariages.
   *
   * Pour chaque id de vendor.weddingIds : le lien existant reçoit le statut et
   * l'heure d'arrivée actuels du vendor (coûts et needsCostReview intacts) ;
   * s'il n'existe pas, il est créé sans coût. Un prestataire lié à 0 mariage
   * est conservé tel quel : son statut/horaire n'ont aucun mariage où
   * atterrir et sont abandonnés, jamais le prestataire lui-même.
   * Vendor.notes reste une note générale (non copiée sur les liens).
   */
  10: (data) => {
    const oldVendors = Array.isArray(data.vendors) ? (data.vendors as Record<string, unknown>[]) : []
    const links: Record<string, unknown>[] = Array.isArray(data.vendorWeddingLinks)
      ? (data.vendorWeddingLinks as Record<string, unknown>[]).map((l) => ({ ...l }))
      : []
    const indexByPair = new Map<string, number>()
    links.forEach((l, i) => indexByPair.set(`${String(l.vendorId)}:${String(l.weddingId)}`, i))

    const vendors = oldVendors.map((vendor) => {
      const weddingIds = Array.isArray(vendor.weddingIds) ? (vendor.weddingIds as string[]) : []
      const status = typeof vendor.status === 'string' ? vendor.status : 'a_contacter'
      const arrivalTime = typeof vendor.arrivalTime === 'string' && vendor.arrivalTime !== '' ? vendor.arrivalTime : undefined
      const assignment = { status, ...(arrivalTime !== undefined ? { arrivalTime } : {}) }

      for (const weddingId of weddingIds) {
        const key = `${String(vendor.id)}:${weddingId}`
        const existing = indexByPair.get(key)
        if (existing !== undefined) {
          links[existing] = { ...links[existing], ...assignment }
        } else {
          indexByPair.set(key, links.length)
          links.push({ id: generateId(), vendorId: vendor.id, weddingId, ...assignment })
        }
      }

      const { status: _status, arrivalTime: _arrivalTime, ...rest } = vendor
      return rest
    })

    return { ...data, schemaVersion: 11, vendors, vendorWeddingLinks: links }
  },
  /**
   * v11 → v12 : numérotation automatique des devis et des factures.
   *
   * Les devis n'avaient aucun numéro : chacun reçoit DEV-AAAA-NNNN, dans l'ordre de création (année de
   * création), sans changer l'ordre du tableau. Les factures gardent LEUR numéro tel quel (jamais
   * renumérotées) ; seul le compteur est initialisé pour que les prochains numéros continuent après
   * celles qui existent déjà cette année-là.
   */
  11: (data) => {
    const proposals = Array.isArray(data.proposals) ? (data.proposals as Record<string, unknown>[]) : []
    const invoices = Array.isArray(data.invoices) ? (data.invoices as Record<string, unknown>[]) : []
    const counters: Record<string, number> = {}
    const yearOf = (value: unknown) => (typeof value === 'string' && /^\d{4}/.test(value) ? value.slice(0, 4) : String(new Date().getFullYear()))

    const numberById = new Map<unknown, string>()
    const inCreationOrder = [...proposals].sort((a, b) => String(a.createdAt ?? '').localeCompare(String(b.createdAt ?? '')))
    for (const proposal of inCreationOrder) {
      const year = yearOf(proposal.createdAt)
      const key = `devis:${year}`
      counters[key] = (counters[key] ?? 0) + 1
      numberById.set(proposal.id, `DEV-${year}-${String(counters[key]).padStart(4, '0')}`)
    }
    for (const invoice of invoices) {
      const key = `facture:${yearOf(invoice.date ?? invoice.createdAt)}`
      counters[key] = (counters[key] ?? 0) + 1
    }

    return {
      ...data,
      schemaVersion: 12,
      proposals: proposals.map((p) => ({ ...p, proposalNumber: typeof p.proposalNumber === 'string' && p.proposalNumber ? p.proposalNumber : numberById.get(p.id) })),
      documentCounters: { ...(typeof data.documentCounters === 'object' && data.documentCounters !== null ? (data.documentCounters as Record<string, number>) : {}), ...counters },
    }
  },
}

/**
 * Valide et, si besoin, migre une donnée brute (JSON.parse d'un LocalStorage
 * ou d'un fichier importé) vers un Workspace conforme au schéma courant.
 * Ne lève jamais : retourne un résultat discriminé pour que l'appelant décide
 * quoi faire (fallback silencieux à l'hydratation, message d'erreur à l'import).
 */
export function migrateWorkspace(raw: unknown): MigrationResult {
  if (typeof raw !== 'object' || raw === null) {
    return { ok: false, reason: "Le fichier ne contient pas un objet JSON valide." }
  }

  let data = raw as Record<string, unknown>
  const version = typeof data.schemaVersion === 'number' ? data.schemaVersion : null

  if (version === null) {
    return { ok: false, reason: 'schemaVersion manquant ou invalide.' }
  }

  if (version > CURRENT_SCHEMA_VERSION) {
    return { ok: false, reason: `schemaVersion ${version} plus récent que la version supportée (${CURRENT_SCHEMA_VERSION}).` }
  }

  for (let v = version; v < CURRENT_SCHEMA_VERSION; v++) {
    const step = migrations[v]
    if (!step) {
      return { ok: false, reason: `Aucune migration disponible de la version ${v} vers ${v + 1}.` }
    }
    data = step(data)
  }

  const parsed = WorkspaceSchema.safeParse(data)
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]
    const detail = firstIssue ? `${firstIssue.path.join('.')}: ${firstIssue.message}` : 'Structure invalide.'
    return { ok: false, reason: detail }
  }

  // Données antérieures à l'introduction des formules personnalisables (ou
  // workspace vidé par erreur) : on réinjecte les 3 formules par défaut
  // plutôt que de laisser l'utilisatrice sans aucune formule disponible.
  const withProposalTemplates =
    parsed.data.proposalTemplates.length > 0
      ? parsed.data
      : { ...parsed.data, proposalTemplates: createDefaultProposalTemplates() }

  // Même principe pour la checklist de démarrage (données antérieures à son introduction).
  const workspace =
    withProposalTemplates.taskTemplate.length > 0
      ? withProposalTemplates
      : { ...withProposalTemplates, taskTemplate: createDefaultTaskTemplate() }

  return { ok: true, workspace }
}
