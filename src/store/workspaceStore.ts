import { create } from 'zustand'
import { persist, type PersistStorage } from 'zustand/middleware'
import { generateId } from '@/lib/id'
import { nowIso } from '@/lib/now'
import { createDefaultProposalTemplates } from '@/features/proposals/templates'
import { createDemoWorkspace, createEmptyWorkspace } from '@/lib/workspace/factories'
import { migrateWorkspace } from '@/lib/workspace/migrate'
import { createSafeWorkspaceStorage } from '@/lib/workspace/safeStorage'
import { usePersistenceStatus } from '@/store/persistenceStatus'
import type {
  BusinessConfig,
  EquipmentItem,
  EquipmentStatus,
  Expense,
  Invoice,
  Proposal,
  ProposalStatus,
  ProposalTemplate,
  ProposalTier,
  ScopeChange,
  SoldService,
  SoldServiceStatus,
  Task,
  TaskStatus,
  TimelineEvent,
  UserProfile,
  Vendor,
  VendorStatus,
  VendorWeddingLink,
  Wedding,
  Workspace,
} from '@/types/entities'

const STORAGE_KEY = 'relia-workspace'

/**
 * Pont entre la couche de stockage (synchrone, appelée pendant l'évaluation
 * du module — donc AVANT que `useWorkspaceStore` n'existe) et `merge`
 * (appelé dans le même cycle d'hydratation synchrone). Ces variables ne sont
 * jamais lues en dehors de ce fichier : elles servent uniquement à faire
 * remonter un incident de LECTURE détecté par `createSafeWorkspaceStorage`
 * jusqu'à `merge`, qui construit alors l'état final (avec message clair)
 * sans jamais référencer `useWorkspaceStore` avant son initialisation.
 */
let pendingCorruptedRaw: string | null = null
let pendingReadUnavailable = false

type NewWeddingInput = Pick<Wedding, 'coupleName' | 'date' | 'venue' | 'soldAmount' | 'clientBudget' | 'status'> &
  Partial<Pick<Wedding, 'notes' | 'vendorIds'>>

type NewVendorInput = Pick<Vendor, 'name' | 'category'> &
  Partial<Pick<Vendor, 'company' | 'phone' | 'email' | 'status' | 'arrivalTime' | 'notes' | 'weddingIds'>> & {
    /** Coût initial pour LE mariage de création (input.weddingIds[0]) — crée le VendorWeddingLink correspondant en une seule action. */
    estimatedCost?: number
    actualCost?: number
  }

type NewTaskInput = Pick<Task, 'title'> &
  Partial<
    Pick<
      Task,
      | 'description'
      | 'weddingId'
      | 'vendorId'
      | 'dueDate'
      | 'startDate'
      | 'endDate'
      | 'status'
      | 'priority'
      | 'waitingOn'
      | 'waitingReason'
      | 'notes'
      | 'source'
      | 'phase'
    >
  >

type NewTimelineEventInput = Pick<TimelineEvent, 'weddingId' | 'title' | 'date' | 'type'> &
  Partial<
    Pick<
      TimelineEvent,
      | 'description'
      | 'startTime'
      | 'endTime'
      | 'durationMinutes'
      | 'location'
      | 'vendorId'
      | 'responsiblePerson'
      | 'isPhotoMoment'
      | 'bufferBeforeMinutes'
      | 'bufferAfterMinutes'
      | 'status'
      | 'notes'
      | 'phase'
    >
  >

type NewExpenseInput = Pick<Expense, 'weddingId' | 'description' | 'category' | 'amount' | 'date'> &
  Partial<Pick<Expense, 'status' | 'notes'>>

type NewScopeChangeInput = Pick<ScopeChange, 'weddingId' | 'description' | 'date' | 'vendorCost' | 'clientPrice'> &
  Partial<Pick<ScopeChange, 'status' | 'notes'>>

type NewProposalInput = Pick<Proposal, 'weddingId' | 'template' | 'title' | 'lineItems' | 'subtotal' | 'vatMode' | 'taxAmount' | 'total' | 'depositAmount' | 'balanceAmount'> &
  Partial<Pick<Proposal, 'clientName' | 'validUntil' | 'vatRate' | 'depositPercentage' | 'status' | 'notes'>>

type NewSoldServiceInput = Pick<SoldService, 'weddingId' | 'proposalId' | 'title' | 'soldPrice'> &
  Partial<Pick<SoldService, 'description' | 'quantity' | 'status' | 'notes'>>

type NewInvoiceInput = Pick<Invoice, 'weddingId' | 'invoiceNumber' | 'date' | 'lineItems' | 'subtotal' | 'vatMode' | 'taxAmount' | 'total'> &
  Partial<Pick<Invoice, 'proposalId' | 'clientName' | 'vatRate' | 'depositAmount' | 'balanceAmount' | 'legalMentions'>>

type NewEquipmentItemInput = Pick<EquipmentItem, 'weddingId' | 'name' | 'quantity' | 'acquisitionMode'> &
  Partial<Pick<EquipmentItem, 'category' | 'status' | 'notes'>>

interface WorkspaceStoreState {
  workspace: Workspace
  /** Non-null lorsque l'hydratation depuis LocalStorage a dû ignorer des données invalides. */
  hydrationIssue: string | null
  clearHydrationIssue: () => void
  /** Copie brute (jamais retravaillée) de la dernière donnée locale illisible — permet de proposer un export de récupération. Null si l'hydratation n'a rencontré aucun problème, ou après export/effacement. */
  corruptedBackupRaw: string | null
  clearCorruptedBackup: () => void
  /** Redéclenche une tentative d'écriture immédiate du workspace courant (bouton "Réessayer" de l'alerte de persistance — cf. src/store/persistenceStatus.ts pour le message affiché). */
  retryPersist: () => void

  createWedding: (input: NewWeddingInput) => string
  updateWedding: (id: string, patch: Partial<Omit<Wedding, 'id' | 'createdAt'>>) => void
  archiveWedding: (id: string) => void
  deleteWedding: (id: string) => void

  addVendor: (input: NewVendorInput) => string
  updateVendor: (id: string, patch: Partial<Omit<Vendor, 'id'>>) => void
  updateVendorStatus: (id: string, status: VendorStatus) => void
  markVendorConfirmed: (id: string) => void
  /** Coût d'un prestataire POUR UN mariage précis — upsert (crée le lien s'il n'existe pas, le met à jour sinon). Efface toujours needsCostReview sur ce lien, même si la valeur ne change pas : la vérification, pas le changement, compte. */
  setVendorCostForWedding: (vendorId: string, weddingId: string, cost: { estimatedCost?: number; actualCost?: number }) => void
  /**
   * Retire un prestataire de CE mariage uniquement : supprime son lien de
   * coût pour ce mariage, retire ce weddingId de vendor.weddingIds, et ne
   * supprime le Vendor globalement que s'il n'est plus lié à aucun mariage
   * après ce retrait. Les tâches/événements de CE mariage perdent leur
   * référence à ce prestataire ; ceux des autres mariages ne sont jamais
   * touchés.
   */
  removeVendorFromWedding: (vendorId: string, weddingId: string) => void

  addTask: (input: NewTaskInput) => string
  updateTask: (id: string, patch: Partial<Omit<Task, 'id' | 'createdAt'>>) => void
  updateTaskStatus: (id: string, status: TaskStatus) => void
  completeTask: (id: string) => void
  reportTask: (id: string, input: { newDueDate: string; reason?: string }) => void
  deleteTask: (id: string) => void

  addTimelineEvent: (input: NewTimelineEventInput) => string
  updateTimelineEvent: (id: string, patch: Partial<Omit<TimelineEvent, 'id' | 'createdAt'>>) => void
  deleteTimelineEvent: (id: string) => void
  ignoreTimelineConflict: (conflictId: string) => void
  unignoreTimelineConflict: (conflictId: string) => void

  addExpense: (input: NewExpenseInput) => string
  updateExpense: (id: string, patch: Partial<Omit<Expense, 'id' | 'weddingId' | 'createdAt'>>) => void
  deleteExpense: (id: string) => void

  addScopeChange: (input: NewScopeChangeInput) => string
  updateScopeChange: (id: string, patch: Partial<Omit<ScopeChange, 'id' | 'weddingId' | 'createdAt'>>) => void
  approveScopeChange: (id: string) => void
  rejectScopeChange: (id: string) => void
  deleteScopeChange: (id: string) => void

  createProposal: (input: NewProposalInput) => string
  updateProposal: (id: string, patch: Partial<Omit<Proposal, 'id' | 'weddingId' | 'createdAt'>>) => void
  updateProposalStatus: (id: string, status: ProposalStatus) => void
  duplicateProposal: (id: string) => string | null
  deleteProposal: (id: string) => void

  /**
   * Génère les prestations vendues à partir des lignes incluses d'une
   * proposition APPROUVÉE. Idempotent : si des prestations existent déjà
   * pour cette proposition, ne régénère rien (retourne []) — pour ne jamais
   * écraser un travail de préparation déjà en cours si la proposition est
   * modifiée après coup. Retourne [] aussi si la proposition est introuvable,
   * pas approuvée, ou n'a aucune ligne incluse.
   */
  generateSoldServicesFromProposal: (proposalId: string) => string[]
  addSoldService: (input: NewSoldServiceInput) => string
  updateSoldService: (id: string, patch: Partial<Omit<SoldService, 'id' | 'weddingId' | 'proposalId' | 'createdAt'>>) => void
  updateSoldServiceStatus: (id: string, status: SoldServiceStatus) => void
  deleteSoldService: (id: string) => void
  /**
   * Crée une tâche de préparation à partir d'une prestation vendue.
   * Idempotent : si une tâche a déjà été créée pour cette prestation
   * (soldService.taskId renseigné), ne recrée rien et retourne l'id existant.
   */
  createTaskFromSoldService: (id: string) => string | null

  createInvoicePreview: (input: NewInvoiceInput) => string
  updateInvoicePreview: (id: string, patch: Partial<Omit<Invoice, 'id' | 'weddingId' | 'createdAt'>>) => void
  deleteInvoicePreview: (id: string) => void

  addEquipmentItem: (input: NewEquipmentItemInput) => string
  updateEquipmentItem: (id: string, patch: Partial<Omit<EquipmentItem, 'id' | 'weddingId' | 'createdAt'>>) => void
  updateEquipmentItemStatus: (id: string, status: EquipmentStatus) => void
  deleteEquipmentItem: (id: string) => void
  /**
   * Crée une tâche de démontage par zone (catégorie) encore concernée par un
   * élément non récupéré. Idempotent : une zone qui a déjà sa tâche de
   * démontage (même titre déterministe, même mariage, phase 'demontage')
   * n'en reçoit jamais une seconde, même si le bouton est cliqué plusieurs
   * fois. Retourne les ids des tâches créées (jamais celles déjà existantes).
   */
  createBreakdownTasksForZones: (weddingId: string, dueDate: string, vendorId?: string) => string[]

  updateBusinessConfig: (patch: Partial<Omit<BusinessConfig, 'id'>>) => void

  updateProposalTemplate: (tier: ProposalTier, patch: Pick<ProposalTemplate, 'label' | 'tagline' | 'lines'>) => void

  updateOnboardingAnswers: (patch: Partial<NonNullable<UserProfile['onboardingAnswers']>>) => void
  completeOnboarding: () => void
  updateUserProfile: (patch: Partial<Omit<UserProfile, 'id'>>) => void

  replaceWorkspace: (workspace: Workspace) => void
  resetWorkspace: (mode: 'empty' | 'demo') => void
}

export const useWorkspaceStore = create<WorkspaceStoreState>()(
  persist(
    (set, get) => ({
      workspace: createEmptyWorkspace(),
      hydrationIssue: null,
      clearHydrationIssue: () => set({ hydrationIssue: null }),
      corruptedBackupRaw: null,
      clearCorruptedBackup: () => set({ corruptedBackupRaw: null }),
      retryPersist: () => set((state) => ({ ...state })),

      createWedding: (input) => {
        const id = generateId()
        const timestamp = nowIso()
        const wedding: Wedding = {
          id,
          coupleName: input.coupleName,
          date: input.date,
          venue: input.venue,
          soldAmount: input.soldAmount,
          clientBudget: input.clientBudget,
          status: input.status,
          archived: false,
          vendorIds: input.vendorIds ?? [],
          notes: input.notes,
          createdAt: timestamp,
          updatedAt: timestamp,
        }
        set((state) => ({
          workspace: { ...state.workspace, weddings: [...state.workspace.weddings, wedding] },
        }))
        return id
      },

      updateWedding: (id, patch) => {
        set((state) => ({
          workspace: {
            ...state.workspace,
            weddings: state.workspace.weddings.map((w) =>
              w.id === id ? { ...w, ...patch, updatedAt: nowIso() } : w,
            ),
          },
        }))
      },

      archiveWedding: (id) => {
        set((state) => ({
          workspace: {
            ...state.workspace,
            weddings: state.workspace.weddings.map((w) => (w.id === id ? { ...w, archived: true, updatedAt: nowIso() } : w)),
          },
        }))
      },

      deleteWedding: (id) => {
        set((state) => {
          const w = state.workspace
          // Un prestataire qui n'était lié qu'à ce mariage devient orphelin
          // une fois son seul lien retiré — même règle que removeVendorFromWedding,
          // qui supprime déjà le Vendor dans ce cas précis.
          const vendors = w.vendors
            .map((vendor) => ({ ...vendor, weddingIds: vendor.weddingIds.filter((wid) => wid !== id) }))
            .filter((vendor) => vendor.weddingIds.length > 0)
          return {
            workspace: {
              ...w,
              weddings: w.weddings.filter((wedding) => wedding.id !== id),
              vendors,
              vendorWeddingLinks: w.vendorWeddingLinks.filter((link) => link.weddingId !== id),
              tasks: w.tasks.filter((t) => t.weddingId !== id),
              timelineEvents: w.timelineEvents.filter((e) => e.weddingId !== id),
              expenses: w.expenses.filter((e) => e.weddingId !== id),
              scopeChanges: w.scopeChanges.filter((s) => s.weddingId !== id),
              clientDecisions: w.clientDecisions.filter((d) => d.weddingId !== id),
              proposals: w.proposals.filter((p) => p.weddingId !== id),
              invoices: w.invoices.filter((i) => i.weddingId !== id),
              soldServices: w.soldServices.filter((s) => s.weddingId !== id),
              equipmentItems: w.equipmentItems.filter((e) => e.weddingId !== id),
            },
          }
        })
      },

      addVendor: (input) => {
        const id = generateId()
        const weddingIds = input.weddingIds ?? []
        const vendor: Vendor = {
          id,
          name: input.name,
          category: input.category,
          company: input.company,
          phone: input.phone,
          email: input.email,
          status: input.status ?? 'a_contacter',
          arrivalTime: input.arrivalTime,
          notes: input.notes,
          weddingIds,
        }
        const hasInitialCost = input.estimatedCost !== undefined || input.actualCost !== undefined
        const initialLink: VendorWeddingLink | null =
          hasInitialCost && weddingIds[0]
            ? {
                id: generateId(),
                vendorId: id,
                weddingId: weddingIds[0],
                estimatedCost: input.estimatedCost,
                actualCost: input.actualCost,
              }
            : null
        set((state) => ({
          workspace: {
            ...state.workspace,
            vendors: [...state.workspace.vendors, vendor],
            vendorWeddingLinks: initialLink
              ? [...state.workspace.vendorWeddingLinks, initialLink]
              : state.workspace.vendorWeddingLinks,
          },
        }))
        return id
      },

      updateVendor: (id, patch) => {
        set((state) => ({
          workspace: {
            ...state.workspace,
            vendors: state.workspace.vendors.map((v) => (v.id === id ? { ...v, ...patch } : v)),
          },
        }))
      },

      updateVendorStatus: (id, status) => {
        set((state) => ({
          workspace: { ...state.workspace, vendors: state.workspace.vendors.map((v) => (v.id === id ? { ...v, status } : v)) },
        }))
      },

      markVendorConfirmed: (id) => get().updateVendorStatus(id, 'confirme'),

      setVendorCostForWedding: (vendorId, weddingId, cost) => {
        set((state) => {
          const links = state.workspace.vendorWeddingLinks
          const existing = links.find((l) => l.vendorId === vendorId && l.weddingId === weddingId)
          const updatedLink: VendorWeddingLink = existing
            ? { ...existing, ...cost, needsCostReview: undefined }
            : { id: generateId(), vendorId, weddingId, ...cost }
          return {
            workspace: {
              ...state.workspace,
              vendorWeddingLinks: existing
                ? links.map((l) => (l.vendorId === vendorId && l.weddingId === weddingId ? updatedLink : l))
                : [...links, updatedLink],
            },
          }
        })
      },

      removeVendorFromWedding: (vendorId, weddingId) => {
        set((state) => {
          const w = state.workspace
          const vendor = w.vendors.find((v) => v.id === vendorId)
          if (!vendor) return { workspace: w }
          const remainingWeddingIds = vendor.weddingIds.filter((wid) => wid !== weddingId)
          const deleteVendorEntirely = remainingWeddingIds.length === 0
          return {
            workspace: {
              ...w,
              vendors: deleteVendorEntirely
                ? w.vendors.filter((v) => v.id !== vendorId)
                : w.vendors.map((v) => (v.id === vendorId ? { ...v, weddingIds: remainingWeddingIds } : v)),
              vendorWeddingLinks: w.vendorWeddingLinks.filter(
                (link) => !(link.vendorId === vendorId && link.weddingId === weddingId),
              ),
              weddings: w.weddings.map((wedding) =>
                wedding.id === weddingId
                  ? { ...wedding, vendorIds: wedding.vendorIds.filter((vid) => vid !== vendorId) }
                  : wedding,
              ),
              tasks: w.tasks.map((t) =>
                t.weddingId === weddingId && t.vendorId === vendorId ? { ...t, vendorId: undefined } : t,
              ),
              timelineEvents: w.timelineEvents.map((e) =>
                e.weddingId === weddingId && e.vendorId === vendorId ? { ...e, vendorId: undefined } : e,
              ),
            },
          }
        })
      },

      addTask: (input) => {
        const id = generateId()
        const timestamp = nowIso()
        const task: Task = {
          id,
          title: input.title,
          description: input.description,
          status: input.status ?? 'a_preparer',
          priority: input.priority ?? 'normale',
          weddingId: input.weddingId,
          vendorId: input.vendorId,
          dueDate: input.dueDate,
          startDate: input.startDate,
          endDate: input.endDate,
          postponedCount: 0,
          postponeHistory: [],
          waitingOn: input.waitingOn,
          waitingReason: input.waitingReason,
          notes: input.notes,
          source: input.source ?? 'manual',
          phase: input.phase,
          createdAt: timestamp,
          updatedAt: timestamp,
        }
        set((state) => ({ workspace: { ...state.workspace, tasks: [...state.workspace.tasks, task] } }))
        return id
      },

      updateTask: (id, patch) => {
        set((state) => ({
          workspace: {
            ...state.workspace,
            tasks: state.workspace.tasks.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: nowIso() } : t)),
          },
        }))
      },

      updateTaskStatus: (id, status) => {
        set((state) => ({
          workspace: {
            ...state.workspace,
            tasks: state.workspace.tasks.map((t) =>
              t.id === id
                ? { ...t, status, completedAt: status === 'terminee' ? nowIso() : undefined, updatedAt: nowIso() }
                : t,
            ),
          },
        }))
      },

      completeTask: (id) => get().updateTaskStatus(id, 'terminee'),

      reportTask: (id, { newDueDate, reason }) => {
        set((state) => ({
          workspace: {
            ...state.workspace,
            tasks: state.workspace.tasks.map((t) => {
              if (t.id !== id) return t
              const fromDate = t.dueDate ?? nowIso()
              return {
                ...t,
                dueDate: newDueDate,
                updatedAt: nowIso(),
                postponedCount: t.postponedCount + 1,
                postponeHistory: [...t.postponeHistory, { fromDate, toDate: newDueDate, reason, createdAt: nowIso() }],
              }
            }),
          },
        }))
      },

      deleteTask: (id) => {
        set((state) => ({ workspace: { ...state.workspace, tasks: state.workspace.tasks.filter((t) => t.id !== id) } }))
      },

      addTimelineEvent: (input) => {
        const id = generateId()
        const timestamp = nowIso()
        const event: TimelineEvent = {
          id,
          weddingId: input.weddingId,
          title: input.title,
          description: input.description,
          date: input.date,
          startTime: input.startTime,
          endTime: input.endTime,
          durationMinutes: input.durationMinutes,
          location: input.location,
          vendorId: input.vendorId,
          responsiblePerson: input.responsiblePerson,
          isPhotoMoment: input.isPhotoMoment ?? false,
          bufferBeforeMinutes: input.bufferBeforeMinutes,
          bufferAfterMinutes: input.bufferAfterMinutes,
          type: input.type,
          status: input.status ?? 'prevu',
          notes: input.notes,
          phase: input.phase,
          createdAt: timestamp,
          updatedAt: timestamp,
        }
        set((state) => ({ workspace: { ...state.workspace, timelineEvents: [...state.workspace.timelineEvents, event] } }))
        return id
      },

      updateTimelineEvent: (id, patch) => {
        set((state) => ({
          workspace: {
            ...state.workspace,
            timelineEvents: state.workspace.timelineEvents.map((e) => (e.id === id ? { ...e, ...patch, updatedAt: nowIso() } : e)),
          },
        }))
      },

      deleteTimelineEvent: (id) => {
        set((state) => ({
          workspace: { ...state.workspace, timelineEvents: state.workspace.timelineEvents.filter((e) => e.id !== id) },
        }))
      },

      ignoreTimelineConflict: (conflictId) => {
        set((state) => ({
          workspace: {
            ...state.workspace,
            ignoredConflictIds: state.workspace.ignoredConflictIds.includes(conflictId)
              ? state.workspace.ignoredConflictIds
              : [...state.workspace.ignoredConflictIds, conflictId],
          },
        }))
      },

      unignoreTimelineConflict: (conflictId) => {
        set((state) => ({
          workspace: {
            ...state.workspace,
            ignoredConflictIds: state.workspace.ignoredConflictIds.filter((id) => id !== conflictId),
          },
        }))
      },

      addExpense: (input) => {
        const id = generateId()
        const timestamp = nowIso()
        const expense: Expense = {
          id,
          weddingId: input.weddingId,
          description: input.description,
          category: input.category,
          amount: input.amount,
          date: input.date,
          status: input.status ?? 'engagee',
          notes: input.notes,
          createdAt: timestamp,
          updatedAt: timestamp,
        }
        set((state) => ({ workspace: { ...state.workspace, expenses: [...state.workspace.expenses, expense] } }))
        return id
      },

      updateExpense: (id, patch) => {
        set((state) => ({
          workspace: {
            ...state.workspace,
            expenses: state.workspace.expenses.map((e) => (e.id === id ? { ...e, ...patch, updatedAt: nowIso() } : e)),
          },
        }))
      },

      deleteExpense: (id) => {
        set((state) => ({ workspace: { ...state.workspace, expenses: state.workspace.expenses.filter((e) => e.id !== id) } }))
      },

      addScopeChange: (input) => {
        const id = generateId()
        const timestamp = nowIso()
        const scopeChange: ScopeChange = {
          id,
          weddingId: input.weddingId,
          description: input.description,
          date: input.date,
          vendorCost: input.vendorCost,
          clientPrice: input.clientPrice,
          status: input.status ?? 'proposee',
          notes: input.notes,
          createdAt: timestamp,
          updatedAt: timestamp,
        }
        set((state) => ({ workspace: { ...state.workspace, scopeChanges: [...state.workspace.scopeChanges, scopeChange] } }))
        return id
      },

      updateScopeChange: (id, patch) => {
        set((state) => ({
          workspace: {
            ...state.workspace,
            scopeChanges: state.workspace.scopeChanges.map((sc) => (sc.id === id ? { ...sc, ...patch, updatedAt: nowIso() } : sc)),
          },
        }))
      },

      approveScopeChange: (id) => get().updateScopeChange(id, { status: 'approuvee' }),

      rejectScopeChange: (id) => get().updateScopeChange(id, { status: 'rejetee' }),

      deleteScopeChange: (id) => {
        set((state) => ({
          workspace: { ...state.workspace, scopeChanges: state.workspace.scopeChanges.filter((sc) => sc.id !== id) },
        }))
      },

      createProposal: (input) => {
        const id = generateId()
        const timestamp = nowIso()
        const proposal: Proposal = {
          id,
          weddingId: input.weddingId,
          template: input.template,
          title: input.title,
          clientName: input.clientName ?? '',
          validUntil: input.validUntil,
          lineItems: input.lineItems,
          subtotal: input.subtotal,
          vatMode: input.vatMode,
          vatRate: input.vatRate,
          taxAmount: input.taxAmount,
          total: input.total,
          depositPercentage: input.depositPercentage,
          depositAmount: input.depositAmount,
          balanceAmount: input.balanceAmount,
          status: input.status ?? 'brouillon',
          notes: input.notes,
          createdAt: timestamp,
          updatedAt: timestamp,
        }
        set((state) => ({ workspace: { ...state.workspace, proposals: [...state.workspace.proposals, proposal] } }))
        return id
      },

      updateProposal: (id, patch) => {
        set((state) => ({
          workspace: {
            ...state.workspace,
            proposals: state.workspace.proposals.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: nowIso() } : p)),
          },
        }))
      },

      updateProposalStatus: (id, status) => {
        set((state) => ({
          workspace: {
            ...state.workspace,
            proposals: state.workspace.proposals.map((p) =>
              p.id === id
                ? { ...p, status, approvedAt: status === 'approuvee' ? nowIso() : p.approvedAt, updatedAt: nowIso() }
                : p,
            ),
          },
        }))
      },

      duplicateProposal: (id) => {
        const source = get().workspace.proposals.find((p) => p.id === id)
        if (!source) return null
        const newId = generateId()
        const timestamp = nowIso()
        const duplicate: Proposal = {
          ...source,
          id: newId,
          title: `${source.title} (copie)`,
          lineItems: source.lineItems.map((line) => ({ ...line, id: generateId() })),
          status: 'brouillon',
          approvedAt: undefined,
          createdAt: timestamp,
          updatedAt: timestamp,
        }
        set((state) => ({ workspace: { ...state.workspace, proposals: [...state.workspace.proposals, duplicate] } }))
        return newId
      },

      deleteProposal: (id) => {
        set((state) => ({
          workspace: {
            ...state.workspace,
            proposals: state.workspace.proposals.filter((p) => p.id !== id),
            invoices: state.workspace.invoices.map((inv) => (inv.proposalId === id ? { ...inv, proposalId: undefined } : inv)),
            // Une prestation vendue référence toujours une proposition (proposalId non
            // facultatif, cf. schéma) : impossible de simplement délier comme pour une
            // facture — elle doit disparaître avec la proposition qui l'a fait naître.
            soldServices: state.workspace.soldServices.filter((s) => s.proposalId !== id),
          },
        }))
      },

      generateSoldServicesFromProposal: (proposalId) => {
        const state = get()
        const proposal = state.workspace.proposals.find((p) => p.id === proposalId)
        if (!proposal || proposal.status !== 'approuvee') return []
        const alreadyGenerated = state.workspace.soldServices.some((s) => s.proposalId === proposalId)
        if (alreadyGenerated) return []

        const timestamp = nowIso()
        const created: SoldService[] = proposal.lineItems
          .filter((line) => line.included)
          .map((line) => ({
            id: generateId(),
            weddingId: proposal.weddingId,
            proposalId: proposal.id,
            title: line.description,
            quantity: line.quantity,
            soldPrice: line.total,
            status: 'incluse',
            notes: line.notes,
            createdAt: timestamp,
            updatedAt: timestamp,
          }))
        if (created.length === 0) return []

        set((s) => ({ workspace: { ...s.workspace, soldServices: [...s.workspace.soldServices, ...created] } }))
        return created.map((c) => c.id)
      },

      addSoldService: (input) => {
        const id = generateId()
        const timestamp = nowIso()
        const soldService: SoldService = {
          id,
          weddingId: input.weddingId,
          proposalId: input.proposalId,
          title: input.title,
          description: input.description,
          quantity: input.quantity,
          soldPrice: input.soldPrice,
          status: input.status ?? 'ajoutee_ulterieurement',
          notes: input.notes,
          createdAt: timestamp,
          updatedAt: timestamp,
        }
        set((state) => ({ workspace: { ...state.workspace, soldServices: [...state.workspace.soldServices, soldService] } }))
        return id
      },

      updateSoldService: (id, patch) => {
        set((state) => ({
          workspace: {
            ...state.workspace,
            soldServices: state.workspace.soldServices.map((s) => (s.id === id ? { ...s, ...patch, updatedAt: nowIso() } : s)),
          },
        }))
      },

      updateSoldServiceStatus: (id, status) => {
        set((state) => ({
          workspace: {
            ...state.workspace,
            soldServices: state.workspace.soldServices.map((s) => (s.id === id ? { ...s, status, updatedAt: nowIso() } : s)),
          },
        }))
      },

      deleteSoldService: (id) => {
        set((state) => ({
          workspace: { ...state.workspace, soldServices: state.workspace.soldServices.filter((s) => s.id !== id) },
        }))
      },

      createTaskFromSoldService: (id) => {
        const soldService = get().workspace.soldServices.find((s) => s.id === id)
        if (!soldService) return null
        if (soldService.taskId) return soldService.taskId

        const taskId = get().addTask({
          title: soldService.title,
          description: soldService.description,
          weddingId: soldService.weddingId,
        })
        set((state) => ({
          workspace: {
            ...state.workspace,
            soldServices: state.workspace.soldServices.map((s) => (s.id === id ? { ...s, taskId, updatedAt: nowIso() } : s)),
          },
        }))
        return taskId
      },

      createInvoicePreview: (input) => {
        const id = generateId()
        const timestamp = nowIso()
        const invoice: Invoice = {
          id,
          weddingId: input.weddingId,
          proposalId: input.proposalId,
          invoiceNumber: input.invoiceNumber,
          date: input.date,
          clientName: input.clientName ?? '',
          lineItems: input.lineItems,
          subtotal: input.subtotal,
          vatMode: input.vatMode,
          vatRate: input.vatRate,
          taxAmount: input.taxAmount,
          total: input.total,
          depositAmount: input.depositAmount,
          balanceAmount: input.balanceAmount,
          legalMentions: input.legalMentions,
          isIndicativePreview: true,
          createdAt: timestamp,
          updatedAt: timestamp,
        }
        set((state) => ({ workspace: { ...state.workspace, invoices: [...state.workspace.invoices, invoice] } }))
        return id
      },

      updateInvoicePreview: (id, patch) => {
        set((state) => ({
          workspace: {
            ...state.workspace,
            invoices: state.workspace.invoices.map((inv) => (inv.id === id ? { ...inv, ...patch, updatedAt: nowIso() } : inv)),
          },
        }))
      },

      deleteInvoicePreview: (id) => {
        set((state) => ({ workspace: { ...state.workspace, invoices: state.workspace.invoices.filter((inv) => inv.id !== id) } }))
      },

      addEquipmentItem: (input) => {
        const id = generateId()
        const timestamp = nowIso()
        const item: EquipmentItem = {
          id,
          weddingId: input.weddingId,
          name: input.name,
          quantity: input.quantity,
          category: input.category,
          acquisitionMode: input.acquisitionMode,
          status: input.status ?? 'a_prevoir',
          notes: input.notes,
          createdAt: timestamp,
          updatedAt: timestamp,
        }
        set((state) => ({ workspace: { ...state.workspace, equipmentItems: [...state.workspace.equipmentItems, item] } }))
        return id
      },

      updateEquipmentItem: (id, patch) => {
        set((state) => ({
          workspace: {
            ...state.workspace,
            equipmentItems: state.workspace.equipmentItems.map((e) => (e.id === id ? { ...e, ...patch, updatedAt: nowIso() } : e)),
          },
        }))
      },

      updateEquipmentItemStatus: (id, status) => {
        set((state) => ({
          workspace: {
            ...state.workspace,
            equipmentItems: state.workspace.equipmentItems.map((e) =>
              e.id === id
                ? { ...e, status, returnedAt: status === 'recupere' ? (e.returnedAt ?? nowIso()) : e.returnedAt, updatedAt: nowIso() }
                : e,
            ),
          },
        }))
      },

      deleteEquipmentItem: (id) => {
        set((state) => ({
          workspace: { ...state.workspace, equipmentItems: state.workspace.equipmentItems.filter((e) => e.id !== id) },
        }))
      },

      createBreakdownTasksForZones: (weddingId, dueDate, vendorId) => {
        const state = get()
        const pending = state.workspace.equipmentItems.filter((e) => e.weddingId === weddingId && e.status !== 'recupere')
        const zones = [...new Set(pending.map((e) => e.category ?? 'Non classé'))]
        const existingTitles = new Set(
          state.workspace.tasks
            .filter((t) => t.weddingId === weddingId && t.phase === 'demontage')
            .map((t) => t.title),
        )

        const timestamp = nowIso()
        const created: Task[] = zones
          .map((zone) => `Démontage : ${zone}`)
          .filter((title) => !existingTitles.has(title))
          .map((title) => ({
            id: generateId(),
            title,
            description: `Récupérer et trier le matériel de la zone « ${title.replace('Démontage : ', '')} ».`,
            status: 'a_faire' as const,
            priority: 'normale' as const,
            weddingId,
            vendorId,
            dueDate,
            postponedCount: 0,
            postponeHistory: [],
            source: 'automatic' as const,
            phase: 'demontage' as const,
            createdAt: timestamp,
            updatedAt: timestamp,
          }))

        if (created.length === 0) return []
        set((s) => ({ workspace: { ...s.workspace, tasks: [...s.workspace.tasks, ...created] } }))
        return created.map((t) => t.id)
      },

      updateBusinessConfig: (patch) => {
        set((state) => ({ workspace: { ...state.workspace, businessConfig: { ...state.workspace.businessConfig, ...patch } } }))
      },

      updateProposalTemplate: (tier, patch) => {
        set((state) => {
          const templates =
            state.workspace.proposalTemplates.length > 0 ? state.workspace.proposalTemplates : createDefaultProposalTemplates()
          const exists = templates.some((t) => t.tier === tier)
          const proposalTemplates = exists
            ? templates.map((t) => (t.tier === tier ? { ...t, ...patch } : t))
            : [...templates, { tier, ...patch }]
          return { workspace: { ...state.workspace, proposalTemplates } }
        })
      },

      updateOnboardingAnswers: (patch) => {
        set((state) => ({
          workspace: {
            ...state.workspace,
            userProfile: {
              ...state.workspace.userProfile,
              onboardingAnswers: { ...state.workspace.userProfile.onboardingAnswers, ...patch },
            },
          },
        }))
      },

      completeOnboarding: () => {
        set((state) => ({
          workspace: { ...state.workspace, userProfile: { ...state.workspace.userProfile, onboarded: true } },
        }))
      },

      updateUserProfile: (patch) => {
        set((state) => ({
          workspace: { ...state.workspace, userProfile: { ...state.workspace.userProfile, ...patch } },
        }))
      },

      replaceWorkspace: (workspace) => set({ workspace, hydrationIssue: null, corruptedBackupRaw: null }),

      resetWorkspace: (mode) =>
        set({
          workspace: mode === 'demo' ? createDemoWorkspace() : createEmptyWorkspace(),
          hydrationIssue: null,
          corruptedBackupRaw: null,
        }),
    }),
    {
      name: STORAGE_KEY,
      storage: createSafeWorkspaceStorage({
        onReadCorrupted: (raw) => {
          pendingCorruptedRaw = raw
        },
        onReadUnavailable: () => {
          pendingReadUnavailable = true
        },
        onWriteError: (message) => {
          // usePersistenceStatus n'a pas de middleware `persist` : le
          // signaler ne redéclenche jamais d'écriture, contrairement à
          // useWorkspaceStore.setState(...) qui aurait bouclé indéfiniment
          // tant que l'écriture échoue (persist réécrit à chaque set()).
          usePersistenceStatus.getState().setPersistenceIssue(message)
        },
        onWriteSuccess: () => {
          usePersistenceStatus.getState().clearPersistenceIssue()
        },
      }) as PersistStorage<{ workspace: Workspace }>,
      partialize: (state) => ({ workspace: state.workspace }),
      merge: (persisted, current) => {
        if (pendingReadUnavailable) {
          pendingReadUnavailable = false
          usePersistenceStatus
            .getState()
            .setPersistenceIssue(
              'Le stockage local est indisponible dans ce navigateur : vos modifications ne pourront pas être sauvegardées automatiquement.',
            )
          return current
        }

        if (pendingCorruptedRaw !== null) {
          const raw = pendingCorruptedRaw
          pendingCorruptedRaw = null
          return {
            ...current,
            hydrationIssue:
              "Vos données locales n'ont pas pu être lues (fichier corrompu) — une copie de la donnée d'origine a été conservée sur cet appareil, et un espace vide a été restauré pour ne pas bloquer l'application.",
            corruptedBackupRaw: raw,
          }
        }

        if (!persisted || typeof persisted !== 'object' || !('workspace' in persisted)) {
          return current
        }
        const result = migrateWorkspace((persisted as { workspace: unknown }).workspace)
        if (!result.ok) {
          return {
            ...current,
            hydrationIssue: `Vos données locales étaient illisibles (${result.reason}) — une copie de la donnée d'origine a été conservée sur cet appareil, et un espace vide a été restauré pour ne pas bloquer l'application.`,
            corruptedBackupRaw: JSON.stringify(persisted),
          }
        }
        return { ...current, workspace: result.workspace }
      },
    },
  ),
)
