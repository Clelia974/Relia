import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { buildDefaultTasksForWedding, createDefaultTaskTemplate } from '@/features/tasks/defaultTaskTemplate'
import { markLeadStatus } from '@/features/leads/leadsApi'
import { clearLeadRelance, scheduleDevisRelance } from '@/features/leads/relanceTask'
import { useRelanceDevis } from '@/features/proposals/useRelanceDevis'
import { LEAD_SOURCE_LABELS, LEAD_STATUS_LABELS, type Lead, type LeadStatusSchema } from '@/schemas/lead'
import { useWorkspaceStore } from '@/store/workspaceStore'
import type { z } from 'zod'

type LeadStatus = z.infer<typeof LeadStatusSchema>

/**
 * Actions sur un lead partagées entre la liste (LeadsInboxPage) et la
 * fiche détaillée (LeadDetailPage) — une seule implémentation pour
 * changement de statut / signature / relance / ignorer, jamais dupliquée.
 */
export function useLeadActions(refresh: () => void) {
  const navigate = useNavigate()
  const createWedding = useWorkspaceStore((s) => s.createWedding)
  const addTask = useWorkspaceStore((s) => s.addTask)
  const deleteTask = useWorkspaceStore((s) => s.deleteTask)
  const allTasks = useWorkspaceStore((s) => s.workspace.tasks)
  const allProposals = useWorkspaceStore((s) => s.workspace.proposals)
  const businessConfig = useWorkspaceStore((s) => s.workspace.businessConfig)
  const taskTemplate = useWorkspaceStore((s) => s.workspace.taskTemplate)
  const { relanceDevis, isLoading: isRelanceSending } = useRelanceDevis()
  const [pendingId, setPendingId] = useState<string | null>(null)
  /** Lead en attente de confirmation dans l'aperçu d'email de relance — null si aucun n'est ouvert. */
  const [relanceTarget, setRelanceTarget] = useState<Lead | null>(null)

  const senderName = businessConfig.companyName?.trim() || 'SilkyPlace'

  const handleStatusChange = async (lead: Lead, next: LeadStatus) => {
    setPendingId(lead.id)
    try {
      await markLeadStatus(lead.id, next)
      toast.success(`Statut mis à jour : ${LEAD_STATUS_LABELS[next]}.`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la mise à jour.')
    } finally {
      setPendingId(null)
      refresh()
    }
  }

  /** Seul moment où un mariage est créé — la signature, pas avant. */
  const handleSign = async (lead: Lead) => {
    setPendingId(lead.id)
    try {
      const weddingDate = lead.event_date ? new Date(lead.event_date).toISOString() : new Date().toISOString()
      const notesParts = [
        `Source : ${LEAD_SOURCE_LABELS[lead.source]}`,
        lead.message ? `Message : ${lead.message}` : null,
      ].filter(Boolean)
      const id = createWedding({
        coupleName: lead.client_name,
        date: weddingDate,
        venue: lead.venue ?? '',
        soldAmount: 0,
        clientBudget: lead.budget_estimate ?? 0,
        status: 'signe',
        clientPhone: lead.client_phone ?? undefined,
        clientEmail: lead.client_email ?? undefined,
        guestCount: lead.guest_count ?? undefined,
        notes: notesParts.join('\n'),
      })
      const template = taskTemplate.length > 0 ? taskTemplate : createDefaultTaskTemplate()
      for (const task of buildDefaultTasksForWedding(id, weddingDate, template)) addTask(task)
      clearLeadRelance(allTasks, deleteTask, lead.id)
      await markLeadStatus(lead.id, 'importe')
      toast.success('Devis signé — mariage créé avec sa checklist de démarrage.')
      navigate(`/mariages/${id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la conversion.')
    } finally {
      setPendingId(null)
      refresh()
    }
  }

  const latestSharedProposal = (leadId: string) =>
    allProposals
      .filter((p) => p.leadId === leadId && p.shareId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]

  /**
   * Relance manuelle : repousse toujours l'échéance de la tâche de relance
   * de 5 jours à partir d'aujourd'hui. Si un email de rappel est possible
   * (devis déjà partagé + adresse cliente connue), ouvre d'abord un aperçu
   * — jamais d'envoi à l'aveugle — plutôt que d'envoyer directement ;
   * sinon la relance reste une simple note interne, comme avant.
   */
  const handleRelance = (lead: Lead) => {
    const proposal = latestSharedProposal(lead.id)
    if (lead.client_email && proposal?.shareId) {
      setRelanceTarget(lead)
      return
    }
    clearLeadRelance(allTasks, deleteTask, lead.id)
    scheduleDevisRelance(addTask, lead)
    toast.success('Relance notée — prochain rappel dans 5 jours.')
  }

  /** Confirmation depuis l'aperçu d'email (EmailPreviewDialog) — envoie réellement le rappel. */
  const confirmRelance = async (customMessage: string) => {
    const lead = relanceTarget
    if (!lead) return
    clearLeadRelance(allTasks, deleteTask, lead.id)
    scheduleDevisRelance(addTask, lead)
    const proposal = latestSharedProposal(lead.id)
    if (lead.client_email && proposal?.shareId) {
      const sent = await relanceDevis({
        shareId: proposal.shareId,
        clientEmail: lead.client_email,
        clientName: lead.client_name,
        companyName: businessConfig.companyName,
        replyToEmail: businessConfig.email,
        customMessage,
      })
      toast.success(sent ? 'Relance notée — email de rappel envoyé à la cliente.' : "Relance notée — l'email de rappel n'a pas pu être envoyé.")
    }
    setRelanceTarget(null)
  }

  const handleIgnore = async (lead: Lead) => {
    setPendingId(lead.id)
    try {
      clearLeadRelance(allTasks, deleteTask, lead.id)
      await markLeadStatus(lead.id, 'ignore')
      toast.success('Demande écartée.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la mise à jour.')
    } finally {
      setPendingId(null)
      refresh()
    }
  }

  return {
    pendingId,
    handleStatusChange,
    handleSign,
    handleRelance,
    handleIgnore,
    senderName,
    relanceTarget,
    confirmRelance,
    closeRelanceDialog: () => setRelanceTarget(null),
    isRelanceSending,
  }
}
