import { useState } from 'react'
import { Copy, Mail, Phone } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { EmptyState } from '@/components/EmptyState'
import { buildDefaultTasksForWedding, createDefaultTaskTemplate } from '@/features/tasks/defaultTaskTemplate'
import { LeadStatusBadge } from '@/features/leads/components/LeadStatusBadge'
import { markLeadStatus } from '@/features/leads/leadsApi'
import { clearLeadRelance, scheduleDevisRelance } from '@/features/leads/relanceTask'
import { useLeadsInbox } from '@/features/leads/useLeadsInbox'
import { useRelanceDevis } from '@/features/proposals/useRelanceDevis'
import { copyTextToClipboard } from '@/lib/clipboard'
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

/** Étapes suivantes proposées selon le statut courant — "Devis envoyé" est à part : on ne l'atteint jamais par un simple changement de statut, seulement en envoyant réellement le devis depuis son éditeur (cf. "Créer un devis"). */
const LEAD_QUICK_ACTIONS: Partial<Record<LeadStatus, { label: string; next: LeadStatus }[]>> = {
  nouveau: [{ label: 'Marquer comme répondu', next: 'repondu' }],
  repondu: [{ label: 'En attente de réponse', next: 'en_attente_reponse' }],
}

/** "Créer un devis" court-circuite les étapes intermédiaires : pas besoin d'être passée par "Répondu" pour ouvrir directement l'éditeur de devis. */
const CAN_CREATE_DEVIS_STATUSES = new Set<LeadStatus>(['nouveau', 'repondu', 'en_attente_reponse'])

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
  const allProposals = useWorkspaceStore((s) => s.workspace.proposals)
  const businessConfig = useWorkspaceStore((s) => s.workspace.businessConfig)
  const taskTemplate = useWorkspaceStore((s) => s.workspace.taskTemplate)
  const { relanceDevis } = useRelanceDevis()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [detailLead, setDetailLead] = useState<Lead | null>(null)

  const formLink = user ? `${window.location.origin}/lead/new/${user.id}` : ''
  const embedCode = user
    ? `<iframe src="${window.location.origin}/lead/new/${user.id}?embed=1" style="width:100%;max-width:480px;height:900px;border:0;"></iframe>`
    : ''

  const copyLink = async () => {
    if (!formLink) return
    await navigator.clipboard.writeText(formLink)
    toast.success('Lien copié.')
  }

  const copyEmbedCode = async () => {
    if (!embedCode) return
    await navigator.clipboard.writeText(embedCode)
    toast.success('Code d’intégration copié.')
  }

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

  /**
   * Relance manuelle : repousse l'échéance de la tâche de relance de 5 jours
   * à partir d'aujourd'hui, ET envoie un email de rappel à la cliente si son
   * devis a bien un lien de partage (cf. Proposal.shareId) et qu'elle a
   * laissé une adresse — sinon la relance reste purement une note interne,
   * comme avant. Jamais de recréation du partage, seulement un nouvel email
   * pointant vers le lien déjà existant.
   */
  const handleRelance = async (lead: Lead) => {
    clearLeadRelance(allTasks, deleteTask, lead.id)
    scheduleDevisRelance(addTask, lead)
    const proposal = allProposals
      .filter((p) => p.leadId === lead.id && p.shareId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]
    if (lead.client_email && proposal?.shareId) {
      const sent = await relanceDevis({
        shareId: proposal.shareId,
        clientEmail: lead.client_email,
        clientName: lead.client_name,
        companyName: businessConfig.companyName,
        replyToEmail: businessConfig.email,
      })
      toast.success(sent ? 'Relance notée — email de rappel envoyé à la cliente.' : "Relance notée — l'email de rappel n'a pas pu être envoyé.")
    } else {
      toast.success('Relance notée — prochain rappel dans 5 jours.')
    }
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
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded-md border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
              {formLink}
            </code>
            <Button variant="outline" size="icon" onClick={copyLink} aria-label="Copier le lien">
              <Copy className="size-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted-foreground">Pour l'intégrer directement sur votre site</p>
              <code className="mt-1 block truncate rounded-md border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
                {embedCode}
              </code>
            </div>
            <Button variant="outline" size="icon" onClick={copyEmbedCode} aria-label="Copier le code d’intégration">
              <Copy className="size-4" />
            </Button>
          </div>
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
              <button
                type="button"
                className="flex-1 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => setDetailLead(lead)}
                aria-label={`Voir les coordonnées de ${lead.client_name}`}
              >
                <p className="flex flex-wrap items-center gap-2 font-medium text-foreground">
                  {lead.client_name}
                  <LeadStatusBadge status={lead.status} />
                </p>
                <p className="text-sm text-muted-foreground">
                  {LEAD_EVENT_TYPE_LABELS[lead.event_type]}
                  {lead.event_date ? ` · ${new Date(lead.event_date).toLocaleDateString('fr-FR')}` : ''}
                  {lead.venue ? ` · ${lead.venue}` : ''}
                  {lead.guest_count !== null ? ` · ${lead.guest_count} invités` : ''} ·{' '}
                  {LEAD_SOURCE_LABELS[lead.source]}
                </p>
                {lead.message && <p className="mt-1 text-sm text-muted-foreground">{lead.message}</p>}
              </button>
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
                {CAN_CREATE_DEVIS_STATUSES.has(lead.status) && (
                  <Button
                    size="sm"
                    variant={lead.status === 'nouveau' ? 'outline' : 'default'}
                    onClick={() => navigate(`/mariages/demandes/${lead.id}/devis/nouveau`)}
                  >
                    Créer un devis
                  </Button>
                )}
                {lead.status === 'devis_envoye' && (
                  <>
                    <Button variant="outline" size="sm" disabled={pendingId === lead.id} onClick={() => handleRelance(lead)}>
                      Relancer
                    </Button>
                    <Button size="sm" disabled={pendingId === lead.id} onClick={() => handleSign(lead)}>
                      Marquer comme signé
                    </Button>
                  </>
                )}
                <Button variant="outline" size="sm" disabled={pendingId === lead.id} onClick={() => handleIgnore(lead)}>
                  Ignorer
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={detailLead !== null} onOpenChange={(open) => !open && setDetailLead(null)}>
        <DialogContent>
          {detailLead && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {detailLead.client_name}
                  <LeadStatusBadge status={detailLead.status} />
                </DialogTitle>
                <DialogDescription>
                  {LEAD_EVENT_TYPE_LABELS[detailLead.event_type]}
                  {detailLead.event_date ? ` · ${new Date(detailLead.event_date).toLocaleDateString('fr-FR')}` : ''}
                  {' · '}
                  {LEAD_SOURCE_LABELS[detailLead.source]}
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-3 text-sm">
                {detailLead.client_phone && (
                  <div className="flex items-center justify-between gap-2">
                    <a href={`tel:${detailLead.client_phone}`} className="flex items-center gap-2 text-foreground hover:underline">
                      <Phone className="size-4 text-muted-foreground" aria-hidden="true" />
                      {detailLead.client_phone}
                    </a>
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="Copier le téléphone"
                      onClick={async () => {
                        const ok = await copyTextToClipboard(detailLead.client_phone!)
                        toast[ok ? 'success' : 'error'](ok ? 'Téléphone copié.' : 'Impossible de copier.')
                      }}
                    >
                      <Copy className="size-4" />
                    </Button>
                  </div>
                )}
                {detailLead.client_email && (
                  <div className="flex items-center justify-between gap-2">
                    <a href={`mailto:${detailLead.client_email}`} className="flex items-center gap-2 truncate text-foreground hover:underline">
                      <Mail className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                      <span className="truncate">{detailLead.client_email}</span>
                    </a>
                    <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      aria-label="Copier l'email"
                      onClick={async () => {
                        const ok = await copyTextToClipboard(detailLead.client_email!)
                        toast[ok ? 'success' : 'error'](ok ? 'Email copié.' : 'Impossible de copier.')
                      }}
                    >
                      <Copy className="size-4" />
                    </Button>
                  </div>
                )}
                {!detailLead.client_phone && !detailLead.client_email && (
                  <p className="text-muted-foreground">Aucune coordonnée laissée par la cliente.</p>
                )}
                {detailLead.venue && (
                  <p>
                    <span className="text-muted-foreground">Lieu envisagé : </span>
                    {detailLead.venue}
                  </p>
                )}
                {detailLead.guest_count !== null && (
                  <p>
                    <span className="text-muted-foreground">Invités : </span>
                    {detailLead.guest_count}
                  </p>
                )}
                {detailLead.budget_estimate !== null && (
                  <p>
                    <span className="text-muted-foreground">Budget estimé : </span>
                    {detailLead.budget_estimate.toLocaleString('fr-FR')} €
                  </p>
                )}
                {detailLead.message && (
                  <div>
                    <p className="text-muted-foreground">Message :</p>
                    <p className="whitespace-pre-line">{detailLead.message}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
