import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { generateId } from '@/lib/id'
import { nowIso } from '@/lib/now'
import { createDefaultProposalTemplates } from '@/features/proposals/templates'
import { createDemoWorkspace, createEmptyWorkspace } from '@/lib/workspace/factories'
import { migrateWorkspace } from '@/lib/workspace/migrate'
import type {
  BusinessConfig,
  Expense,
  Invoice,
  Proposal,
  ProposalStatus,
  ProposalTemplate,
  ProposalTier,
  ScopeChange,
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
    >
  >

type NewExpenseInput = Pick<Expense, 'weddingId' | 'description' | 'category' | 'amount' | 'date'> &
  Partial<Pick<Expense, 'status' | 'notes'>>

type NewScopeChangeInput = Pick<ScopeChange, 'weddingId' | 'description' | 'date' | 'vendorCost' | 'clientPrice'> &
  Partial<Pick<ScopeChange, 'status' | 'notes'>>

type NewProposalInput = Pick<Proposal, 'weddingId' | 'template' | 'title' | 'lineItems' | 'subtotal' | 'vatMode' | 'taxAmount' | 'total' | 'depositAmount' | 'balanceAmount'> &
  Partial<Pick<Proposal, 'clientName' | 'validUntil' | 'vatRate' | 'depositPercentage' | 'status' | 'notes'>>

type NewInvoiceInput = Pick<Invoice, 'weddingId' | 'invoiceNumber' | 'date' | 'lineItems' | 'subtotal' | 'vatMode' | 'taxAmount' | 'total'> &
  Partial<Pick<Invoice, 'proposalId' | 'clientName' | 'vatRate' | 'depositAmount' | 'balanceAmount' | 'legalMentions'>>

interface WorkspaceStoreState {
  workspace: Workspace
  /** Non-null lorsque l'hydratation depuis LocalStorage a dû ignorer des données invalides. */
  hydrationIssue: string | null
  clearHydrationIssue: () => void

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

  createInvoicePreview: (input: NewInvoiceInput) => string
  updateInvoicePreview: (id: string, patch: Partial<Omit<Invoice, 'id' | 'weddingId' | 'createdAt'>>) => void
  deleteInvoicePreview: (id: string) => void

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
          return {
            workspace: {
              ...w,
              weddings: w.weddings.filter((wedding) => wedding.id !== id),
              vendors: w.vendors.map((vendor) => ({
                ...vendor,
                weddingIds: vendor.weddingIds.filter((wid) => wid !== id),
              })),
              vendorWeddingLinks: w.vendorWeddingLinks.filter((link) => link.weddingId !== id),
              tasks: w.tasks.filter((t) => t.weddingId !== id),
              timelineEvents: w.timelineEvents.filter((e) => e.weddingId !== id),
              expenses: w.expenses.filter((e) => e.weddingId !== id),
              scopeChanges: w.scopeChanges.filter((s) => s.weddingId !== id),
              clientDecisions: w.clientDecisions.filter((d) => d.weddingId !== id),
              proposals: w.proposals.filter((p) => p.weddingId !== id),
              invoices: w.invoices.filter((i) => i.weddingId !== id),
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
          },
        }))
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

      replaceWorkspace: (workspace) => set({ workspace, hydrationIssue: null }),

      resetWorkspace: (mode) => set({ workspace: mode === 'demo' ? createDemoWorkspace() : createEmptyWorkspace(), hydrationIssue: null }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ workspace: state.workspace }),
      merge: (persisted, current) => {
        if (!persisted || typeof persisted !== 'object' || !('workspace' in persisted)) {
          return current
        }
        const result = migrateWorkspace((persisted as { workspace: unknown }).workspace)
        if (!result.ok) {
          return {
            ...current,
            hydrationIssue: `Vos données locales étaient illisibles (${result.reason}) — un espace vide a été restauré pour ne pas bloquer l'application.`,
          }
        }
        return { ...current, workspace: result.workspace }
      },
    },
  ),
)
