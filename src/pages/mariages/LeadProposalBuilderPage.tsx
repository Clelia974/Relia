import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { buildProposalInputFromTemplate } from '@/features/proposals/buildProposalInput'
import { TemplatePickerDialog } from '@/features/proposals/components/TemplatePickerDialog'
import type { ProposalSubject } from '@/features/proposals/proposalSubject'
import type { DevisSnapshot } from '@/features/proposals/devisSnapshot'
import { useShareDevis } from '@/features/proposals/useShareDevis'
import { EmailPreviewDialog } from '@/features/email/EmailPreviewDialog'
import { useLead } from '@/features/leads/useLead'
import { markLeadStatus } from '@/features/leads/leadsApi'
import { scheduleDevisRelance } from '@/features/leads/relanceTask'
import { useWorkspaceStore } from '@/store/workspaceStore'
import { ProposalBuilderInner } from '@/pages/mariages/ProposalBuilderPage'
import type { ProposalTier } from '@/types/entities'

/**
 * Même éditeur de devis que pour un mariage (ProposalBuilderInner), mais
 * pour une demande pas encore signée — aucun mariage n'existe à ce stade
 * (cf. redesign leads/mariages : rien n'est créé avant la signature).
 */
export function LeadProposalBuilderPage() {
  const { leadId, proposalId } = useParams<{ leadId: string; proposalId: string }>()
  const navigate = useNavigate()
  const { lead, isLoading, error } = useLead(leadId)
  const { shareDevis, isLoading: isSharing } = useShareDevis()
  const businessConfig = useWorkspaceStore((s) => s.workspace.businessConfig)
  const proposalTemplates = useWorkspaceStore((s) => s.workspace.proposalTemplates)
  const createProposal = useWorkspaceStore((s) => s.createProposal)
  const setProposalShareId = useWorkspaceStore((s) => s.setProposalShareId)
  const addTask = useWorkspaceStore((s) => s.addTask)
  const allProposals = useWorkspaceStore((s) => s.workspace.proposals)
  const proposal = allProposals.find((p) => p.id === proposalId)
  const [pendingSnapshot, setPendingSnapshot] = useState<DevisSnapshot | null>(null)

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

  const subject: ProposalSubject = {
    coupleName: lead.client_name,
    date: lead.event_date ?? new Date().toISOString(),
    venue: lead.venue ?? '',
    clientAddress: undefined,
    clientPhone: lead.client_phone ?? undefined,
    backHref: '/mariages/demandes',
    backLabel: '← Demandes reçues',
    proposalHref: (id) => `/mariages/demandes/${lead.id}/devis/${id}`,
  }

  const handlePickTemplate = (tier: ProposalTier) => {
    const template = proposalTemplates.find((t) => t.tier === tier)
    if (!template) return
    const id = createProposal({
      leadId: lead.id,
      ...buildProposalInputFromTemplate(template, lead.client_name, { clientPhone: lead.client_phone ?? undefined }, businessConfig),
    })
    toast.success('Devis créé.')
    navigate(`/mariages/demandes/${lead.id}/devis/${id}`, { replace: true })
  }

  if (!proposal) {
    return <TemplatePickerDialog open onOpenChange={() => navigate('/mariages/demandes')} onPick={handlePickTemplate} />
  }

  /**
   * L'enregistrement local (statut de la demande + tâche de relance) se
   * fait toujours, même si le lien de partage échoue : le devis est de
   * toute façon déjà "envoyé" du point de vue de la décoratrice, qui vient
   * de cliquer le bouton après relecture — cf. useShareDevis, best-effort.
   *
   * Le lien est généré même sans email client (facultatif sur le
   * formulaire de demande) : la décoratrice peut toujours le copier et
   * l'envoyer elle-même (WhatsApp, SMS…) — l'email Brevo n'est qu'un
   * envoi automatique en plus quand une adresse est renseignée.
   */
  const doShare = async (snapshot: DevisSnapshot, customMessage?: string) => {
    scheduleDevisRelance(addTask, lead)
    markLeadStatus(lead.id, 'devis_envoye').catch((err) => {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la mise à jour de la demande.')
    })
    const shareId = await shareDevis({ snapshot, clientEmail: lead.client_email ?? undefined, clientName: lead.client_name, customMessage })
    if (!shareId) {
      toast.error("Le lien du devis n'a pas pu être généré — le statut a bien été mis à jour.")
      return
    }
    setProposalShareId(proposal.id, shareId)
    toast.success(
      lead.client_email ? 'Devis envoyé par email à la cliente.' : 'Lien du devis généré — copiez-le pour l’envoyer vous-même.',
    )
  }

  /** Une adresse client existe : la décoratrice voit d'abord un aperçu de l'email avant tout envoi (jamais à l'aveugle). Sinon, pas d'email possible — le lien est simplement généré. */
  const handleMarkSent = (snapshot: DevisSnapshot) => {
    if (lead.client_email) setPendingSnapshot(snapshot)
    else doShare(snapshot)
  }

  const senderName = businessConfig.companyName?.trim() || 'Zordi'

  return (
    <>
      <ProposalBuilderInner proposalId={proposal.id} subject={subject} onMarkSent={handleMarkSent} />
      <EmailPreviewDialog
        open={pendingSnapshot !== null}
        onOpenChange={(open) => !open && setPendingSnapshot(null)}
        clientName={lead.client_name}
        senderName={senderName}
        subject={`Votre devis de la part de ${senderName}`}
        introText="vous a préparé un devis — vous pouvez le consulter directement en ligne :"
        isSending={isSharing}
        onConfirm={(customMessage) => {
          if (pendingSnapshot) doShare(pendingSnapshot, customMessage)
          setPendingSnapshot(null)
        }}
      />
    </>
  )
}
