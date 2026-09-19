import { z } from 'zod'

/**
 * Schémas Zod — source de vérité du modèle de données Relia.
 * Les types TypeScript (src/types/entities.ts) sont dérivés par z.infer
 * pour ne jamais dupliquer la forme des données entre TS et la validation.
 *
 * Zod ne valide qu'aux frontières : hydratation depuis LocalStorage et
 * import de fichier JSON. Les actions du store internes ne re-valident pas
 * à chaque mutation — le code interne est fait pour produire des données
 * déjà conformes.
 */

export const CURRENT_SCHEMA_VERSION = 9 as const

const isoDate = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), { message: 'Date invalide (attendu : format ISO).' })

const id = z.string().min(1, 'Identifiant manquant.')

export const TaskStatusSchema = z.enum(['a_preparer', 'a_faire', 'en_cours', 'en_attente', 'terminee'])

export const TaskPrioritySchema = z.enum(['normale', 'haute', 'urgente'])

/** À quoi une tâche "En attente" attend — jamais présentée comme en retard. */
export const TaskWaitingOnSchema = z.enum(['client', 'prestataire', 'paiement', 'document', 'autre'])

/**
 * Phase du déroulé jour J — sert uniquement au filtrage de la Vue Jour J
 * (Phase 3) ; facultative sur Task et TimelineEvent, jamais rétroactivement
 * obligatoire (les tâches/moments déjà créés restent valides sans elle).
 */
export const DayPhaseSchema = z.enum(['installation', 'ceremonie', 'reception', 'demontage'])

export const WeddingStatusSchema = z.enum([
  'prospect',
  'devis_envoye',
  'signe',
  'en_preparation',
  'semaine_j',
  'termine',
  'annule',
])

export const ProposalTierSchema = z.enum(['silver', 'gold', 'platinum'])

export const VendorCategorySchema = z.enum([
  'Fleuriste',
  'DJ',
  'Traiteur',
  'Photographe',
  'Vidéaste',
  'Location mobilier',
  'Éclairagiste',
  'Lieu',
  'Transport',
  'Papeterie',
  'Autre',
])

export const VendorStatusSchema = z.enum([
  'a_contacter',
  'contacte',
  'devis_recu',
  'confirme',
  'acompte_paye',
  'solde_a_payer',
  'termine',
])

/**
 * Statut de TVA — jamais déduit automatiquement de la forme juridique.
 * L'utilisatrice choisit explicitement, y compris "ne sait pas encore".
 */
export const VatStatusSchema = z.enum([
  'franchise_en_base',
  'assujettie',
  'option_volontaire',
  'ne_sait_pas_encore',
])

export const BusinessConfigSchema = z.object({
  id,
  companyName: z.string(),
  address: z.string().optional(),
  siret: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  vatStatus: VatStatusSchema,
  vatRate: z.number().min(0).max(100).optional(),
  currency: z.string().min(1),
  legalMentions: z.string().optional(),
  logoDataUrl: z.string().optional(),
  /** Couleur d'accent de marque (hex) appliquée sur les documents (devis/factures) — remplace l'accent Relia par défaut. */
  brandColor: z.string().optional(),
})

export const UserProfileSchema = z.object({
  id,
  displayName: z.string(),
  onboarded: z.boolean(),
  onboardingAnswers: z
    .object({
      weddingCount: z.string().optional(),
      mainProblem: z.string().optional(),
      firstGoal: z.string().optional(),
    })
    .optional(),
})

export const WeddingSchema = z.object({
  id,
  coupleName: z.string().min(1, 'Le nom du couple est obligatoire.'),
  date: isoDate,
  venue: z.string(),
  soldAmount: z.number().nonnegative('Le montant du contrat ne peut pas être négatif.'),
  clientBudget: z.number().nonnegative('Le budget client ne peut pas être négatif.'),
  status: WeddingStatusSchema,
  archived: z.boolean().default(false),
  vendorIds: z.array(id),
  notes: z.string().optional(),
  /** Marge minimale recommandée entre deux moments du planning (minutes) — remplace la valeur globale par défaut si renseignée. */
  minBufferMinutes: z.number().int().nonnegative().optional(),
  /** Renseigné une fois la clôture (Phase 5) effectuée — cf. ClosingSessionSchema. Présence = mariage verrouillé (édition non recommandée hors réouverture explicite). */
  closingSessionId: id.optional(),
  createdAt: isoDate,
  updatedAt: isoDate,
})

/**
 * `status` et `arrivalTime` restent ici bien qu'ils soient conceptuellement
 * propres à la relation mariage↔prestataire (un prestataire peut être
 * "confirmé" pour un mariage et "à contacter" pour un autre, avec une heure
 * d'arrivée différente à chaque fois) — même défaut que celui corrigé pour
 * le coût ci-dessous. Non traités dans cette correction (scope limité au
 * coût, cf. VendorWeddingLinkSchema) : à migrer vers VendorWeddingLink dans
 * une phase ultérieure si confirmé.
 */
export const VendorSchema = z.object({
  id,
  name: z.string().min(1, 'Le nom du prestataire est obligatoire.'),
  company: z.string().optional(),
  category: z.string().min(1, 'La catégorie est obligatoire.'),
  phone: z.string().optional(),
  email: z.string().email('Adresse email invalide.').optional(),
  /** Statut du prestataire pour ce mariage — cf. VendorStatusSchema. Défaut ajouté pour rester compatible avec les données créées avant son introduction. */
  status: VendorStatusSchema.default('a_contacter'),
  /** Heure d'arrivée au format HH:MM. */
  arrivalTime: z.string().optional(),
  notes: z.string().optional(),
  weddingIds: z.array(id),
})

/**
 * Coût d'un prestataire pour UN mariage précis — un même prestataire peut
 * être lié à plusieurs mariages (Vendor.weddingIds) sans que son coût soit
 * partagé entre eux. Avant l'introduction de ce modèle, le coût vivait
 * directement sur Vendor (scalaire, donc compté plusieurs fois pour un
 * prestataire partagé) — cf. migrate.ts, migration v3→v4.
 */
export const VendorWeddingLinkSchema = z.object({
  id,
  vendorId: id,
  weddingId: id,
  estimatedCost: z.number().nonnegative().optional(),
  actualCost: z.number().nonnegative().optional(),
  /**
   * true uniquement pour un lien créé par la migration v3→v4 à partir d'un
   * coût partagé (prestataire lié à ≥2 mariages à l'époque) : ce coût a été
   * dupliqué tel quel dans chaque mariage, faute de savoir lequel était le
   * bon — jamais présenté comme fiable tant que ce n'est pas vérifié.
   * Effacé dès que setVendorCostForWedding est appelé sur ce lien (même
   * avec la même valeur — la vérification, pas le changement, compte).
   * Un lien créé normalement (hors migration) ne l'a jamais à true.
   */
  needsCostReview: z.boolean().optional(),
})

/** Un report conserve le statut de travail de la tâche : ce n'est pas un statut à part. */
export const PostponeEntrySchema = z.object({
  fromDate: isoDate,
  toDate: isoDate,
  reason: z.string().optional(),
  createdAt: isoDate,
})

export const TaskSchema = z.object({
  id,
  title: z.string().min(1, 'Le titre de la tâche est obligatoire.'),
  description: z.string().optional(),
  status: TaskStatusSchema,
  priority: TaskPrioritySchema.default('normale'),
  weddingId: id.optional(),
  vendorId: id.optional(),
  dueDate: isoDate.optional(),
  startDate: isoDate.optional(),
  endDate: isoDate.optional(),
  completedAt: isoDate.optional(),
  postponedCount: z.number().int().nonnegative().default(0),
  postponeHistory: z.array(PostponeEntrySchema).default([]),
  /** Pertinent seulement quand status === 'en_attente'. */
  waitingOn: TaskWaitingOnSchema.optional(),
  waitingReason: z.string().optional(),
  notes: z.string().optional(),
  /** 'automatic' = créée par Relia (ex. confirmation prestataire), jamais par une saisie manuelle directe. */
  source: z.enum(['manual', 'automatic']).default('manual'),
  /** Phase du jour J (Vue Jour J, Phase 3) — facultative, cf. DayPhaseSchema. */
  phase: DayPhaseSchema.optional(),
  createdAt: isoDate,
  updatedAt: isoDate,
})

export const TimelineEventTypeSchema = z.enum(['jalon', 'jour_j', 'livraison_prestataire'])

export const TimelineEventStatusSchema = z.enum(['prevu', 'confirme', 'a_verifier', 'termine'])

export const TimelineEventSchema = z.object({
  id,
  weddingId: id,
  title: z.string().min(1, 'Le nom du moment est obligatoire.'),
  description: z.string().optional(),
  /** Jour de l'événement, format ISO — comparé et trié comme une vraie date, jamais une phrase libre. */
  date: isoDate,
  /** Format HH:MM. */
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  durationMinutes: z.number().int().positive().optional(),
  location: z.string().optional(),
  vendorId: id.optional(),
  responsiblePerson: z.string().optional(),
  isPhotoMoment: z.boolean().default(false),
  bufferBeforeMinutes: z.number().int().nonnegative().optional(),
  bufferAfterMinutes: z.number().int().nonnegative().optional(),
  type: TimelineEventTypeSchema,
  status: TimelineEventStatusSchema.default('prevu'),
  notes: z.string().optional(),
  /** Phase du jour J (Vue Jour J, Phase 3) — facultative, cf. DayPhaseSchema. */
  phase: DayPhaseSchema.optional(),
  createdAt: isoDate,
  updatedAt: isoDate,
})

/**
 * "Autre dépense" uniquement — jamais un coût fournisseur. Les coûts
 * fournisseurs vivent sur Vendor.estimatedCost / Vendor.actualCost (Phase 4),
 * seule source qui a un sens pour un prestataire partagé entre plusieurs
 * mariages. Séparer les deux évite de mélanger chiffre d'affaires, coût
 * fournisseur et autre dépense (cf. Phase 8).
 */
export const ExpenseCategorySchema = z.enum([
  'main_doeuvre',
  'fournitures',
  'transport',
  'location',
  'repas',
  'hebergement',
  'frais_divers',
  'autre',
])

export const ExpenseStatusSchema = z.enum(['prevue', 'engagee', 'payee'])

export const ExpenseSchema = z.object({
  id,
  weddingId: id,
  description: z.string().min(1, 'Veuillez renseigner la description.'),
  category: ExpenseCategorySchema,
  amount: z.number().positive('Veuillez saisir un montant valide.'),
  date: isoDate,
  status: ExpenseStatusSchema.default('engagee'),
  notes: z.string().optional(),
  createdAt: isoDate,
  updatedAt: isoDate,
})

/**
 * "Proposé"/"À envoyer"/"En attente d'approbation" ne modifient jamais le
 * chiffre d'affaires officiel. Seuls "Approuvé" et "Réalisé" (qui suppose une
 * approbation préalable) sont facturables et comptent dans les calculs — cf.
 * src/features/finances/calculations.ts.
 */
export const ScopeChangeStatusSchema = z.enum([
  'proposee',
  'a_envoyer',
  'en_attente_approbation',
  'approuvee',
  'rejetee',
  'realisee',
])

export const ScopeChangeSchema = z.object({
  id,
  weddingId: id,
  description: z.string().min(1, 'Veuillez renseigner la description.'),
  date: isoDate,
  /** Coût fournisseur généré par ce changement. */
  vendorCost: z.number().nonnegative('Veuillez saisir un montant valide.'),
  /** Prix facturé au client pour ce changement — 0 si non facturé (geste commercial). */
  clientPrice: z.number().nonnegative('Veuillez saisir un montant valide.'),
  status: ScopeChangeStatusSchema.default('proposee'),
  notes: z.string().optional(),
  createdAt: isoDate,
  updatedAt: isoDate,
})

/**
 * Une ligne de proposition ou de facture indicative. `total` est toujours
 * recalculé (quantity × unitPrice) à l'enregistrement — jamais une valeur
 * ancienne stockée de confiance (cf. Phase 9, section CALCULS).
 * `included` = compte dans le sous-total (service de la formule) ;
 * `optional` = présentée séparément comme une option, jamais dans le
 * sous-total tant qu'elle n'est pas intégrée à la formule par la décoratrice.
 */
export const ProposalLineItemSchema = z.object({
  id,
  description: z.string().min(1, 'Veuillez renseigner la description.'),
  category: z.string().min(1, 'Veuillez sélectionner une catégorie.'),
  quantity: z.number().positive('Veuillez saisir une quantité valide.'),
  unitPrice: z.number().nonnegative('Veuillez saisir un prix valide.'),
  total: z.number(),
  included: z.boolean().default(true),
  optional: z.boolean().default(false),
  notes: z.string().optional(),
})

export const ProposalStatusSchema = z.enum([
  'brouillon',
  'a_envoyer',
  'envoyee',
  'en_attente_approbation',
  'approuvee',
  'rejetee',
  'expiree',
])

export const ProposalSchema = z.object({
  id,
  weddingId: id,
  /** Formule d'origine — les templates par défaut restent séparés des propositions réellement créées (cf. src/features/proposals/templates.ts). */
  template: ProposalTierSchema,
  title: z.string().min(1, 'Veuillez renseigner le titre.'),
  clientName: z.string(),
  validUntil: isoDate.optional(),
  lineItems: z.array(ProposalLineItemSchema),
  /** Toujours recalculé à partir de lineItems — cf. src/features/proposals/calculations.ts. */
  subtotal: z.number(),
  vatMode: VatStatusSchema,
  vatRate: z.number().min(0).max(100).optional(),
  /** Indicatif uniquement — jamais une valeur fiscale garantie. */
  taxAmount: z.number(),
  total: z.number(),
  depositPercentage: z.number().min(0).max(100).optional(),
  depositAmount: z.number(),
  balanceAmount: z.number(),
  status: ProposalStatusSchema.default('brouillon'),
  /** Renseigné uniquement quand status passe à "approuvee". */
  approvedAt: isoDate.optional(),
  notes: z.string().optional(),
  createdAt: isoDate,
  updatedAt: isoDate,
})

/**
 * "Incluse" = générée depuis une ligne de la proposition d'origine (ou
 * confirmée telle quelle) ; "ajoutée ultérieurement" = service vendu après
 * coup, hors proposition initiale (ex. upsell en cours de préparation) ;
 * "retirée" = ne sera finalement pas fourni, mais on garde une trace plutôt
 * que de supprimer silencieusement (utile si le client change d'avis).
 */
export const SoldServiceStatusSchema = z.enum(['incluse', 'ajoutee_ulterieurement', 'retiree'])

/**
 * Prestation vendue : ce que l'organisatrice s'est réellement engagée à
 * fournir pour ce mariage, matérialisé une fois une proposition approuvée.
 * Distinct de ProposalLineItem : la proposition peut encore changer après
 * approbation (scope change), alors que SoldService fige ce qui a été
 * préparé/communiqué — une modification ultérieure de la proposition ne doit
 * jamais réécrire silencieusement ces enregistrements (cf.
 * generateSoldServicesFromProposal, qui ne régénère jamais si des prestations
 * existent déjà pour cette proposition).
 */
export const SoldServiceSchema = z.object({
  id,
  weddingId: id,
  proposalId: id,
  title: z.string().min(1, 'Veuillez renseigner un titre.'),
  description: z.string().optional(),
  quantity: z.number().positive('Veuillez saisir une quantité valide.').optional(),
  soldPrice: z.number().nonnegative('Veuillez saisir un prix valide.'),
  status: SoldServiceStatusSchema.default('incluse'),
  notes: z.string().optional(),
  /** Renseigné dès qu'une tâche de préparation a été créée depuis cette prestation — empêche toute recréation en double. */
  taskId: id.optional(),
  createdAt: isoDate,
  updatedAt: isoDate,
})

/**
 * Ligne préconfigurée d'une formule de devis — sert uniquement à initialiser
 * les lignes d'une nouvelle proposition (cf. src/features/proposals/templates.ts).
 * Modifiable par l'utilisatrice depuis Paramètres, indépendamment des
 * propositions déjà créées à partir de cette formule.
 */
export const ProposalTemplateLineSchema = z.object({
  id,
  description: z.string().min(1, 'Veuillez renseigner la description.'),
  category: z.string().min(1, 'Veuillez renseigner la catégorie.'),
  quantity: z.number().positive('Veuillez saisir une quantité valide.'),
  unitPrice: z.number().nonnegative('Veuillez saisir un prix valide.'),
  included: z.boolean().default(true),
  optional: z.boolean().default(false),
})

export const ProposalTemplateSchema = z.object({
  tier: ProposalTierSchema,
  label: z.string().min(1, 'Veuillez renseigner le nom de la formule.'),
  tagline: z.string().optional(),
  lines: z.array(ProposalTemplateLineSchema),
})

export const ClientDecisionSchema = z.object({
  id,
  weddingId: id,
  subject: z.string().min(1),
  decision: z.string().optional(),
  date: isoDate,
  dueDate: isoDate.optional(),
  pending: z.boolean(),
})

/**
 * Facture indicative uniquement : jamais présentée comme un document
 * juridiquement conforme (pas de numérotation légale officielle, pas de
 * valeur probante). Les coordonnées de l'entreprise sont lues en direct
 * depuis BusinessConfig au moment de l'affichage/impression, jamais dupliquées
 * ici — seul le contenu propre au document (numéro, lignes, montants) est
 * persisté.
 */
export const InvoiceSchema = z.object({
  id,
  weddingId: id,
  /** Proposition d'origine si la facture en a été dérivée — facultatif, une facture peut aussi être créée vide. */
  proposalId: id.optional(),
  invoiceNumber: z.string().min(1),
  date: isoDate,
  clientName: z.string(),
  lineItems: z.array(ProposalLineItemSchema),
  subtotal: z.number(),
  vatMode: VatStatusSchema,
  vatRate: z.number().min(0).max(100).optional(),
  taxAmount: z.number(),
  total: z.number(),
  depositAmount: z.number().optional(),
  balanceAmount: z.number().optional(),
  legalMentions: z.string().optional(),
  isIndicativePreview: z.literal(true),
  createdAt: isoDate,
  updatedAt: isoDate,
})

/**
 * Mode d'obtention d'un élément matériel pour CE mariage — jamais un
 * mouvement de stock ni une réservation : Relia ne gère pas d'inventaire
 * global partagé entre mariages (cf. Phase 2, hors périmètre volontaire).
 */
export const EquipmentAcquisitionModeSchema = z.enum(['stock_personnel', 'achat', 'location', 'fabrication', 'autre'])

export const EquipmentStatusSchema = z.enum(['a_prevoir', 'pret', 'charge', 'installe', 'recupere'])

/** Destination finale d'un élément matériel une fois désinstallé (Phase 4). */
export const EquipmentDestinationSchema = z.enum(['stock', 'fournisseur', 'poubelle', 'autre'])

/**
 * Élément de la checklist matériel d'UN mariage — jamais partagé ni
 * comptabilisé avec un autre mariage (pas d'inventaire global, cf. Phase 2).
 */
export const EquipmentItemSchema = z.object({
  id,
  weddingId: id,
  name: z.string().min(1, 'Veuillez renseigner un nom.'),
  quantity: z.number().positive('Veuillez saisir une quantité valide.'),
  /** Catégorie ou zone (ex. "Décoration", "Réception") — champ libre, comme Vendor.category. */
  category: z.string().optional(),
  acquisitionMode: EquipmentAcquisitionModeSchema,
  status: EquipmentStatusSchema.default('a_prevoir'),
  notes: z.string().optional(),
  /** Suivi de désinstallation (Phase 4) — tous facultatifs, jamais rétroactivement obligatoires. */
  isDamaged: z.boolean().optional(),
  damageNotes: z.string().optional(),
  destination: EquipmentDestinationSchema.optional(),
  destinationNotes: z.string().optional(),
  /** Renseigné automatiquement la première fois que status passe à 'recupere' — jamais écrasé ensuite. */
  returnedAt: isoDate.optional(),
  createdAt: isoDate,
  updatedAt: isoDate,
})

export const PortfolioImageSchema = z.object({
  id,
  caption: z.string().optional(),
  /** Image encodée en base64 — jamais téléversée ailleurs qu'en LocalStorage (cf. Phase 5, hors périmètre volontaire : pas de stockage cloud). */
  dataUrl: z.string().startsWith('data:image'),
  uploadedAt: isoDate,
})

/**
 * Bilan figé au moment de la clôture — une photographie, jamais recalculée
 * après coup : un mariage rouvert puis réédité (coût ajouté, tâche
 * complétée...) ne doit jamais changer silencieusement un bilan déjà archivé.
 * Réutilise les mêmes calculs que l'onglet Finances (cf.
 * src/features/finances/calculations.ts) plutôt que d'inventer un second
 * modèle budget/réel : `approvedRevenue`/`totalCosts`/`profit`/`marginPct`
 * ont exactement le même sens qu'ailleurs dans l'app.
 */
export const ClosingSessionSummarySchema = z.object({
  completedTasks: z.number().int().nonnegative(),
  totalTasks: z.number().int().nonnegative(),
  recoveredEquipment: z.number().int().nonnegative(),
  totalEquipment: z.number().int().nonnegative(),
  damagedEquipment: z.number().int().nonnegative(),
  /** Élément matériel jamais marqué "récupéré" au moment de la clôture. */
  pendingEquipment: z.number().int().nonnegative(),
  approvedRevenue: z.number(),
  totalCosts: z.number(),
  profit: z.number(),
  marginPct: z.number(),
})

/**
 * Clôture d'UN mariage — au plus une par mariage (cf. Wedding.closingSessionId).
 * Une réouverture (reopenWedding) efface la référence côté Wedding mais
 * conserve cet enregistrement tel quel : jamais supprimé silencieusement,
 * une nouvelle clôture ultérieure en créera un second.
 */
export const ClosingSessionSchema = z.object({
  id,
  weddingId: id,
  closingDate: isoDate,
  clientFeedback: z.string().optional(),
  clientRating: z.number().min(1).max(5).optional(),
  /** Max 5 images côté UI — non recontrôlé ici (cf. ClosingPortfolio). */
  portfolioImages: z.array(PortfolioImageSchema).default([]),
  summary: ClosingSessionSummarySchema,
  createdAt: isoDate,
  updatedAt: isoDate,
})

export const UiPreferencesSchema = z.object({
  theme: z.enum(['system', 'light', 'dark']).default('system'),
})

export const WorkspaceSchema = z
  .object({
    schemaVersion: z.literal(CURRENT_SCHEMA_VERSION),
    businessConfig: BusinessConfigSchema,
    userProfile: UserProfileSchema,
    weddings: z.array(WeddingSchema),
    vendors: z.array(VendorSchema),
    vendorWeddingLinks: z.array(VendorWeddingLinkSchema).default([]),
    tasks: z.array(TaskSchema),
    timelineEvents: z.array(TimelineEventSchema),
    expenses: z.array(ExpenseSchema),
    scopeChanges: z.array(ScopeChangeSchema),
    proposals: z.array(ProposalSchema),
    soldServices: z.array(SoldServiceSchema).default([]),
    /** Formules de devis personnalisables — jamais vide en pratique (cf. migrateWorkspace, qui réinjecte les 3 formules par défaut si absentes). */
    proposalTemplates: z.array(ProposalTemplateSchema).default([]),
    clientDecisions: z.array(ClientDecisionSchema),
    invoices: z.array(InvoiceSchema),
    equipmentItems: z.array(EquipmentItemSchema).default([]),
    closingSessions: z.array(ClosingSessionSchema).default([]),
    uiPreferences: UiPreferencesSchema,
    /** Identifiants déterministes (cf. detectTimelineConflicts) des alertes de planning écartées par l'utilisatrice. */
    ignoredConflictIds: z.array(z.string()).default([]),
  })
  .superRefine((workspace, ctx) => {
    const weddingIds = new Set(workspace.weddings.map((w) => w.id))
    const vendorIds = new Set(workspace.vendors.map((v) => v.id))

    const checkWeddingRef = (path: (string | number)[], weddingId?: string) => {
      if (weddingId && !weddingIds.has(weddingId)) {
        ctx.addIssue({ code: 'custom', path, message: `weddingId "${weddingId}" ne correspond à aucun mariage.` })
      }
    }
    const checkVendorRef = (path: (string | number)[], vendorId?: string) => {
      if (vendorId && !vendorIds.has(vendorId)) {
        ctx.addIssue({ code: 'custom', path, message: `vendorId "${vendorId}" ne correspond à aucun prestataire.` })
      }
    }

    workspace.tasks.forEach((task, i) => {
      checkWeddingRef(['tasks', i, 'weddingId'], task.weddingId)
      checkVendorRef(['tasks', i, 'vendorId'], task.vendorId)
    })
    workspace.vendors.forEach((vendor, i) => {
      vendor.weddingIds.forEach((wid, j) => checkWeddingRef(['vendors', i, 'weddingIds', j], wid))
    })
    const seenVendorWeddingPairs = new Set<string>()
    workspace.vendorWeddingLinks.forEach((link, i) => {
      checkVendorRef(['vendorWeddingLinks', i, 'vendorId'], link.vendorId)
      checkWeddingRef(['vendorWeddingLinks', i, 'weddingId'], link.weddingId)
      const pairKey = `${link.vendorId}:${link.weddingId}`
      if (seenVendorWeddingPairs.has(pairKey)) {
        ctx.addIssue({
          code: 'custom',
          path: ['vendorWeddingLinks', i],
          message: `Coût en double pour le prestataire "${link.vendorId}" sur le mariage "${link.weddingId}".`,
        })
      }
      seenVendorWeddingPairs.add(pairKey)
      const vendor = workspace.vendors.find((v) => v.id === link.vendorId)
      if (vendor && !vendor.weddingIds.includes(link.weddingId)) {
        ctx.addIssue({
          code: 'custom',
          path: ['vendorWeddingLinks', i],
          message: `Ce coût référence une relation mariage-prestataire qui n'existe pas ("${link.weddingId}" absent de weddingIds pour le prestataire "${link.vendorId}").`,
        })
      }
    })
    workspace.weddings.forEach((wedding, i) => {
      wedding.vendorIds.forEach((vid, j) => checkVendorRef(['weddings', i, 'vendorIds', j], vid))
    })
    workspace.timelineEvents.forEach((event, i) => {
      checkWeddingRef(['timelineEvents', i, 'weddingId'], event.weddingId)
      checkVendorRef(['timelineEvents', i, 'vendorId'], event.vendorId)
    })
    workspace.expenses.forEach((expense, i) => {
      checkWeddingRef(['expenses', i, 'weddingId'], expense.weddingId)
    })
    workspace.scopeChanges.forEach((sc, i) => checkWeddingRef(['scopeChanges', i, 'weddingId'], sc.weddingId))
    workspace.clientDecisions.forEach((d, i) => checkWeddingRef(['clientDecisions', i, 'weddingId'], d.weddingId))
    const proposalIds = new Set(workspace.proposals.map((p) => p.id))
    workspace.invoices.forEach((inv, i) => {
      checkWeddingRef(['invoices', i, 'weddingId'], inv.weddingId)
      if (inv.proposalId && !proposalIds.has(inv.proposalId)) {
        ctx.addIssue({ code: 'custom', path: ['invoices', i, 'proposalId'], message: `proposalId "${inv.proposalId}" ne correspond à aucune proposition.` })
      }
    })
    workspace.proposals.forEach((p, i) => checkWeddingRef(['proposals', i, 'weddingId'], p.weddingId))
    const taskIds = new Set(workspace.tasks.map((t) => t.id))
    workspace.soldServices.forEach((s, i) => {
      checkWeddingRef(['soldServices', i, 'weddingId'], s.weddingId)
      if (!proposalIds.has(s.proposalId)) {
        ctx.addIssue({ code: 'custom', path: ['soldServices', i, 'proposalId'], message: `proposalId "${s.proposalId}" ne correspond à aucune proposition.` })
      }
      if (s.taskId && !taskIds.has(s.taskId)) {
        ctx.addIssue({ code: 'custom', path: ['soldServices', i, 'taskId'], message: `taskId "${s.taskId}" ne correspond à aucune tâche.` })
      }
    })
    workspace.equipmentItems.forEach((e, i) => checkWeddingRef(['equipmentItems', i, 'weddingId'], e.weddingId))
    const closingSessionIds = new Set(workspace.closingSessions.map((c) => c.id))
    workspace.closingSessions.forEach((c, i) => checkWeddingRef(['closingSessions', i, 'weddingId'], c.weddingId))
    workspace.weddings.forEach((w, i) => {
      if (w.closingSessionId && !closingSessionIds.has(w.closingSessionId)) {
        ctx.addIssue({
          code: 'custom',
          path: ['weddings', i, 'closingSessionId'],
          message: `closingSessionId "${w.closingSessionId}" ne correspond à aucune clôture.`,
        })
      }
    })
  })

export type TaskStatus = z.infer<typeof TaskStatusSchema>
export type TaskPriority = z.infer<typeof TaskPrioritySchema>
export type TaskWaitingOn = z.infer<typeof TaskWaitingOnSchema>
export type DayPhase = z.infer<typeof DayPhaseSchema>
export type WeddingStatus = z.infer<typeof WeddingStatusSchema>
export type ProposalTier = z.infer<typeof ProposalTierSchema>
export type VendorCategory = z.infer<typeof VendorCategorySchema>
export type VendorStatus = z.infer<typeof VendorStatusSchema>
export type VatStatus = z.infer<typeof VatStatusSchema>
export type BusinessConfig = z.infer<typeof BusinessConfigSchema>
export type UserProfile = z.infer<typeof UserProfileSchema>
export type Wedding = z.infer<typeof WeddingSchema>
export type Vendor = z.infer<typeof VendorSchema>
export type VendorWeddingLink = z.infer<typeof VendorWeddingLinkSchema>
export type PostponeEntry = z.infer<typeof PostponeEntrySchema>
export type Task = z.infer<typeof TaskSchema>
export type TimelineEventType = z.infer<typeof TimelineEventTypeSchema>
export type TimelineEventStatus = z.infer<typeof TimelineEventStatusSchema>
export type TimelineEvent = z.infer<typeof TimelineEventSchema>
export type ExpenseCategory = z.infer<typeof ExpenseCategorySchema>
export type ExpenseStatus = z.infer<typeof ExpenseStatusSchema>
export type Expense = z.infer<typeof ExpenseSchema>
export type ScopeChangeStatus = z.infer<typeof ScopeChangeStatusSchema>
export type ScopeChange = z.infer<typeof ScopeChangeSchema>
export type ProposalLineItem = z.infer<typeof ProposalLineItemSchema>
export type ProposalStatus = z.infer<typeof ProposalStatusSchema>
export type Proposal = z.infer<typeof ProposalSchema>
export type SoldServiceStatus = z.infer<typeof SoldServiceStatusSchema>
export type SoldService = z.infer<typeof SoldServiceSchema>
export type ProposalTemplateLine = z.infer<typeof ProposalTemplateLineSchema>
export type ProposalTemplate = z.infer<typeof ProposalTemplateSchema>
export type ClientDecision = z.infer<typeof ClientDecisionSchema>
export type Invoice = z.infer<typeof InvoiceSchema>
export type EquipmentAcquisitionMode = z.infer<typeof EquipmentAcquisitionModeSchema>
export type EquipmentDestination = z.infer<typeof EquipmentDestinationSchema>
export type EquipmentStatus = z.infer<typeof EquipmentStatusSchema>
export type EquipmentItem = z.infer<typeof EquipmentItemSchema>
export type PortfolioImage = z.infer<typeof PortfolioImageSchema>
export type ClosingSessionSummary = z.infer<typeof ClosingSessionSummarySchema>
export type ClosingSession = z.infer<typeof ClosingSessionSchema>
export type UiPreferences = z.infer<typeof UiPreferencesSchema>
export type Workspace = z.infer<typeof WorkspaceSchema>
