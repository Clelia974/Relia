import { useState } from 'react'
import { Copy } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/EmptyState'
import { markLeadStatus } from '@/features/leads/leadsApi'
import { useLeadsInbox } from '@/features/leads/useLeadsInbox'
import { useAuth } from '@/hooks/useAuth'
import { LEAD_EVENT_TYPE_LABELS, LEAD_SOURCE_LABELS, type Lead } from '@/schemas/lead'
import { useWorkspaceStore } from '@/store/workspaceStore'

const RELANCE_AFTER_DAYS = 5

/** Pas de cron/email pour la V2 : un simple repère visuel suffit tant que le volume reste faible — cf. audit. */
function isDueForRelance(lead: Lead): boolean {
  const ageMs = Date.now() - new Date(lead.created_at).getTime()
  return ageMs > RELANCE_AFTER_DAYS * 24 * 60 * 60 * 1000
}

/**
 * Boîte de réception des demandes reçues via le formulaire public
 * (/lead/new/:userId) — une fois converties, elles vivent comme n'importe
 * quel autre mariage (statut "Prospect") : ce n'est qu'une entrée, pas un
 * second système de suivi parallèle.
 */
export function LeadsInboxPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { leads, isLoading, error, refresh } = useLeadsInbox()
  const createWedding = useWorkspaceStore((s) => s.createWedding)
  const [pendingId, setPendingId] = useState<string | null>(null)

  const formLink = user ? `${window.location.origin}/lead/new/${user.id}` : ''

  const copyLink = async () => {
    if (!formLink) return
    await navigator.clipboard.writeText(formLink)
    toast.success('Lien copié.')
  }

  const handleConvert = async (lead: Lead) => {
    setPendingId(lead.id)
    try {
      const weddingDate = lead.event_date ? new Date(lead.event_date).toISOString() : new Date().toISOString()
      const notesParts = [
        `Source : ${LEAD_SOURCE_LABELS[lead.source]}`,
        lead.message ? `Message : ${lead.message}` : null,
      ].filter(Boolean)
      // Pas de checklist de démarrage générée ici : elle n'a de sens qu'une fois le devis/contrat
      // signé, pas dès le stade prospect — sinon, des tâches pour un mariage qui ne se concrétisera
      // peut-être jamais (cf. retour utilisatrice).
      const id = createWedding({
        coupleName: lead.client_name,
        date: weddingDate,
        venue: lead.venue ?? '',
        soldAmount: 0,
        clientBudget: lead.budget_estimate ?? 0,
        status: 'prospect',
        clientPhone: lead.client_phone ?? undefined,
        clientEmail: lead.client_email ?? undefined,
        guestCount: lead.guest_count ?? undefined,
        notes: notesParts.join('\n'),
      })
      await markLeadStatus(lead.id, 'importe')
      toast.success('Mariage créé à partir de la demande.')
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
          Les demandes envoyées via votre lien de contact public arrivent ici.
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
        <EmptyState title="Aucune nouvelle demande" description="Partagez votre lien de contact pour en recevoir." />
      )}

      <div className="flex flex-col gap-3">
        {leads.map((lead) => (
          <Card key={lead.id}>
            <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="flex items-center gap-2 font-medium text-foreground">
                  {lead.client_name}
                  {isDueForRelance(lead) && (
                    <Badge variant="outline" className="border-warning/40 text-warning">
                      ⏰ À relancer
                    </Badge>
                  )}
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
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={pendingId === lead.id} onClick={() => handleIgnore(lead)}>
                  Ignorer
                </Button>
                <Button size="sm" disabled={pendingId === lead.id} onClick={() => handleConvert(lead)}>
                  Créer le mariage
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
