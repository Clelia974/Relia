import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { buildProposalInputFromTemplate } from '@/features/proposals/buildProposalInput'
import { TemplatePickerDialog } from '@/features/proposals/components/TemplatePickerDialog'
import type { ProposalSubject } from '@/features/proposals/proposalSubject'
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
  const businessConfig = useWorkspaceStore((s) => s.workspace.businessConfig)
  const proposalTemplates = useWorkspaceStore((s) => s.workspace.proposalTemplates)
  const createProposal = useWorkspaceStore((s) => s.createProposal)
  const addTask = useWorkspaceStore((s) => s.addTask)
  const allProposals = useWorkspaceStore((s) => s.workspace.proposals)
  const proposal = allProposals.find((p) => p.id === proposalId)

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

  const handleMarkSent = () => {
    scheduleDevisRelance(addTask, lead)
    markLeadStatus(lead.id, 'devis_envoye').catch((err) => {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la mise à jour de la demande.')
    })
  }

  return <ProposalBuilderInner proposalId={proposal.id} subject={subject} onMarkSent={handleMarkSent} />
}
