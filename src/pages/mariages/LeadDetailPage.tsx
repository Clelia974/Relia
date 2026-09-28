import { Copy, FileText, Mail, Phone } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LeadStatusBadge } from '@/features/leads/components/LeadStatusBadge'
import { useLead } from '@/features/leads/useLead'
import { useLeadActions } from '@/features/leads/useLeadActions'
import { ProposalStatusBadge } from '@/features/proposals/components/ProposalStatusBadge'
import { copyTextToClipboard } from '@/lib/clipboard'
import { currency } from '@/lib/currency'
import { LEAD_EVENT_TYPE_LABELS, LEAD_SOURCE_LABELS, type LeadStatusSchema } from '@/schemas/lead'
import { useWorkspaceStore } from '@/store/workspaceStore'
import type { z } from 'zod'

type LeadStatus = z.infer<typeof LeadStatusSchema>

const LEAD_QUICK_ACTIONS: Partial<Record<LeadStatus, { label: string; next: LeadStatus }[]>> = {
  nouveau: [{ label: 'Marquer comme répondu', next: 'repondu' }],
  repondu: [{ label: 'En attente de réponse', next: 'en_attente_reponse' }],
}

const CAN_CREATE_DEVIS_STATUSES = new Set<LeadStatus>(['nouveau', 'repondu', 'en_attente_reponse'])

/**
 * Fiche détaillée d'une demande — toutes les coordonnées et TOUS les devis
 * créés pour ce lead (avec leur statut et leur lien de partage), plutôt
 * qu'un simple aperçu dans "Demandes reçues" : la décoratrice doit pouvoir
 * tout consulter et agir depuis un seul endroit.
 */
export function LeadDetailPage() {
  const { leadId } = useParams<{ leadId: string }>()
  const navigate = useNavigate()
  const { lead, isLoading, error, refresh } = useLead(leadId)
  const allProposals = useWorkspaceStore((s) => s.workspace.proposals)
  const { pendingId, handleStatusChange, handleSign, handleRelance, handleIgnore } = useLeadActions(refresh)

  if (isLoading) return null
  if (error || !lead) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed border-border px-6 py-16">
        <h1 className="font-heading text-xl font-semibold text-foreground">Demande introuvable</h1>
        <Button asChild variant="outline">
          <Link to="/mariages/demandes">Retour aux demandes</Link>
        </Button>
      </div>
    )
  }

  const proposals = allProposals
    .filter((p) => p.leadId === lead.id)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

  const copyShareLink = async (shareId: string) => {
    const ok = await copyTextToClipboard(`${window.location.origin}/devis/${shareId}`)
    toast[ok ? 'success' : 'error'](ok ? 'Lien copié.' : 'Impossible de copier.')
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <Link to="/mariages/demandes" className="text-sm text-muted-foreground hover:underline">
          ← Demandes reçues
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h1 className="font-heading text-2xl font-semibold text-foreground">{lead.client_name}</h1>
          <LeadStatusBadge status={lead.status} />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {LEAD_EVENT_TYPE_LABELS[lead.event_type]}
          {lead.event_date ? ` · ${new Date(lead.event_date).toLocaleDateString('fr-FR')}` : ''}
          {' · '}
          {LEAD_SOURCE_LABELS[lead.source]}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {LEAD_QUICK_ACTIONS[lead.status]?.map((action) => (
          <Button key={action.next} size="sm" disabled={pendingId === lead.id} onClick={() => handleStatusChange(lead, action.next)}>
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

      <Card>
        <CardContent className="flex flex-col gap-3 text-sm">
          <p className="text-xs font-medium text-muted-foreground">Coordonnées</p>
          {lead.client_phone && (
            <div className="flex items-center justify-between gap-2">
              <a href={`tel:${lead.client_phone}`} className="flex items-center gap-2 text-foreground hover:underline">
                <Phone className="size-4 text-muted-foreground" aria-hidden="true" />
                {lead.client_phone}
              </a>
              <Button
                variant="outline"
                size="icon"
                aria-label="Copier le téléphone"
                onClick={async () => {
                  const ok = await copyTextToClipboard(lead.client_phone!)
                  toast[ok ? 'success' : 'error'](ok ? 'Téléphone copié.' : 'Impossible de copier.')
                }}
              >
                <Copy className="size-4" />
              </Button>
            </div>
          )}
          {lead.client_email && (
            <div className="flex items-center justify-between gap-2">
              <a href={`mailto:${lead.client_email}`} className="flex items-center gap-2 truncate text-foreground hover:underline">
                <Mail className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="truncate">{lead.client_email}</span>
              </a>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0"
                aria-label="Copier l'email"
                onClick={async () => {
                  const ok = await copyTextToClipboard(lead.client_email!)
                  toast[ok ? 'success' : 'error'](ok ? 'Email copié.' : 'Impossible de copier.')
                }}
              >
                <Copy className="size-4" />
              </Button>
            </div>
          )}
          {!lead.client_phone && !lead.client_email && <p className="text-muted-foreground">Aucune coordonnée laissée par la cliente.</p>}
          {lead.venue && (
            <p>
              <span className="text-muted-foreground">Lieu envisagé : </span>
              {lead.venue}
            </p>
          )}
          {lead.guest_count !== null && (
            <p>
              <span className="text-muted-foreground">Invités : </span>
              {lead.guest_count}
            </p>
          )}
          {lead.budget_estimate !== null && (
            <p>
              <span className="text-muted-foreground">Budget estimé : </span>
              {lead.budget_estimate.toLocaleString('fr-FR')} €
            </p>
          )}
          {lead.message && (
            <div>
              <p className="text-muted-foreground">Message :</p>
              <p className="whitespace-pre-line">{lead.message}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold text-foreground">Devis</h2>
          {CAN_CREATE_DEVIS_STATUSES.has(lead.status) && (
            <Button size="sm" variant="outline" onClick={() => navigate(`/mariages/demandes/${lead.id}/devis/nouveau`)}>
              + Nouveau devis
            </Button>
          )}
        </div>
        {proposals.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun devis créé pour l'instant.</p>
        ) : (
          proposals.map((proposal) => (
            <Card key={proposal.id}>
              <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 font-medium text-foreground">
                    <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    {proposal.title}
                    <ProposalStatusBadge status={proposal.status} />
                  </p>
                  <p className="text-sm text-muted-foreground">
                    N° {proposal.proposalNumber} · {currency.format(proposal.total)}
                  </p>
                  {proposal.shareId && (
                    <div className="mt-2 flex items-center gap-2">
                      <code className="truncate rounded-md border border-border bg-card px-2 py-1 text-xs text-muted-foreground">
                        {`${window.location.origin}/devis/${proposal.shareId}`}
                      </code>
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-7 shrink-0"
                        aria-label="Copier le lien du devis"
                        onClick={() => copyShareLink(proposal.shareId!)}
                      >
                        <Copy className="size-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() => navigate(`/mariages/demandes/${lead.id}/devis/${proposal.id}`)}
                >
                  Ouvrir
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
