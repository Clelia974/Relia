import { useState } from 'react'
import { Copy } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/EmptyState'
import { buildDefaultTasksForWedding, createDefaultTaskTemplate } from '@/features/tasks/defaultTaskTemplate'
import { markLeadStatus } from '@/features/leads/leadsApi'
import { useLeadsInbox } from '@/features/leads/useLeadsInbox'
import { useAuth } from '@/hooks/useAuth'
import {
  LEAD_EVENT_TYPE_LABELS,
  LEAD_SOURCE_LABELS,
  LEAD_STATUS_LABELS,
  type Lead,
  type LeadStatusSchema,
} from '@/schemas/lead'
import { useWorkspaceStore } from '@/store/workspaceStore'
import type { z } from 'zod'

type LeadStatus = z.infer<typeof LeadStatusSchema>

const RELANCE_DEVIS_DAYS = 5

/** Étapes suivantes proposées selon le statut courant — "Devis envoyé" est à part (cf. handleSign) : c'est la signature qui crée le mariage, pas un simple changement de statut. */
const LEAD_QUICK_ACTIONS: Partial<Record<LeadStatus, { label: string; next: LeadStatus }[]>> = {
  nouveau: [{ label: 'Marquer comme répondu', next: 'repondu' }],
  repondu: [
    { label: 'En attente de réponse', next: 'en_attente_reponse' },
    { label: 'Devis envoyé', next: 'devis_envoye' },
  ],
  en_attente_reponse: [{ label: 'Devis envoyé', next: 'devis_envoye' }],
}

/**
 * Boîte de réception des demandes reçues via le formulaire public
 * (/lead/new/:userId) — une demande reste "leads" pendant toute la
 * négociation (nouveau → devis envoyé), jamais transformée en mariage
 * avant la signature : Calendrier/Finances/Prestataires ne doivent
 * jamais se remplir de prospects incertains (cf. retour utilisatrice).
 */
export function LeadsInboxPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { leads, isLoading, error, refresh } = useLeadsInbox()
  const createWedding = useWorkspaceStore((s) => s.createWedding)
  const addTask = useWorkspaceStore((s) => s.addTask)
  const deleteTask = useWorkspaceStore((s) => s.deleteTask)
  const allTasks = useWorkspaceStore((s) => s.workspace.tasks)
  const taskTemplate = useWorkspaceStore((s) => s.workspace.taskTemplate)
  const [pendingId, setPendingId] = useState<string | null>(null)

  const formLink = user ? `${window.location.origin}/lead/new/${user.id}` : ''

  const copyLink = async () => {
    if (!formLink) return
    await navigator.clipboard.writeText(formLink)
    toast.success('Lien copié.')
  }

  /** Retire la relance devis en cours pour cette demande — plus utile une fois signée ou écartée. */
  const clearRelanceTask = (leadId: string) => {
    for (const task of allTasks) {
      if (task.leadId === leadId && task.status !== 'terminee') deleteTask(task.id)
    }
  }

  const handleStatusChange = async (lead: Lead, next: LeadStatus) => {
    setPendingId(lead.id)
    try {
      await markLeadStatus(lead.id, next)
      if (next === 'devis_envoye') {
        const dueDate = new Date(Date.now() + RELANCE_DEVIS_DAYS * 24 * 60 * 60 * 1000).toISOString()
        addTask({
          title: `Relancer le devis — ${lead.client_name}`,
          dueDate,
          source: 'automatic',
          leadId: lead.id,
        })
      }
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
      clearRelanceTask(lead.id)
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

  const handleIgnore = async (lead: Lead) => {
    setPendingId(lead.id)
    try {
      clearRelanceTask(lead.id)
      await markLeadStatus(lead.id, 'ignore')
      toast.success('Demande écartée.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la mise à jour.')
    } finally {
      setPendingId(null)
      refresh()
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground">Demandes reçues</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Les demandes envoyées via votre lien de contact public arrivent ici — elles ne deviennent un mariage
          qu'à la signature.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Votre lien de contact</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-2">
          <code className="flex-1 truncate rounded-md border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
            {formLink}
          </code>
          <Button variant="outline" size="icon" onClick={copyLink} aria-label="Copier le lien">
            <Copy className="size-4" />
          </Button>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-risk">{error}</p>}

      {!isLoading && leads.length === 0 && !error && (
        <EmptyState title="Aucune demande en cours" description="Partagez votre lien de contact pour en recevoir." />
      )}

      <div className="flex flex-col gap-3">
        {leads.map((lead) => (
          <Card key={lead.id}>
            <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-medium text-foreground">
                  {lead.client_name} <span className="font-normal text-muted-foreground">· {LEAD_STATUS_LABELS[lead.status]}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  {LEAD_EVENT_TYPE_LABELS[lead.event_type]}
                  {lead.event_date ? ` · ${new Date(lead.event_date).toLocaleDateString('fr-FR')}` : ''}
                  {lead.venue ? ` · ${lead.venue}` : ''}
                  {lead.guest_count !== null ? ` · ${lead.guest_count} invités` : ''} ·{' '}
                  {LEAD_SOURCE_LABELS[lead.source]}
                </p>
                {lead.message && <p className="mt-1 text-sm text-muted-foreground">{lead.message}</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                {LEAD_QUICK_ACTIONS[lead.status]?.map((action) => (
                  <Button
                    key={action.next}
                    size="sm"
                    disabled={pendingId === lead.id}
                    onClick={() => handleStatusChange(lead, action.next)}
                  >
                    {action.label}
                  </Button>
                ))}
                {lead.status === 'devis_envoye' && (
                  <Button size="sm" disabled={pendingId === lead.id} onClick={() => handleSign(lead)}>
                    Marquer comme signé
                  </Button>
                )}
                <Button variant="outline" size="sm" disabled={pendingId === lead.id} onClick={() => handleIgnore(lead)}>
                  Ignorer
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
