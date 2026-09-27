import { useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { CalendarClock, ClipboardList, Coins, Eye, Pencil, TriangleAlert, Users } from 'lucide-react'
import { Link, useLocation, useNavigate, useOutletContext } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { VendorEmptyState } from '@/features/vendors/components/VendorEmptyState'
import { getWeddingAssignments } from '@/features/vendors/assignments'
import { countConfirmed, countTotal, findNextVendorToContact, hasUrgentVendor } from '@/features/vendors/summary'
import { TaskEmptyState } from '@/features/tasks/components/TaskEmptyState'
import { computeWeddingTaskStats, findNextPriorityTask } from '@/features/tasks/summary'
import { buildDefaultTasksForWedding, createDefaultTaskTemplate } from '@/features/tasks/defaultTaskTemplate'
import { WeddingEditForm } from '@/features/weddings/components/WeddingEditForm'
import type { WeddingEditFormValues } from '@/features/weddings/weddingEditForm.schema'
import { currency } from '@/lib/currency'
import { WEDDING_STATUS_LABELS } from '@/lib/weddingStatus'
import { useWorkspaceStore } from '@/store/workspaceStore'
import type { WeddingStatus } from '@/types/entities'
import type { WeddingOutletContext } from '@/pages/mariages/WeddingLayout'

/** Actions rapides proposées selon le statut courant — au-delà de "Devis envoyé" (Signé et suite), le pipeline détaillé prend le relais, plus besoin de raccourcis. */
const QUICK_STATUS_ACTIONS: Partial<Record<WeddingStatus, { label: string; next: WeddingStatus }[]>> = {
  prospect: [
    { label: 'Marquer comme répondu', next: 'repondu' },
    { label: 'Marquer en attente de réponse', next: 'en_attente_reponse' },
  ],
  repondu: [
    { label: 'Marquer en attente de réponse', next: 'en_attente_reponse' },
    { label: 'Marquer devis envoyé', next: 'devis_envoye' },
  ],
  en_attente_reponse: [{ label: 'Marquer devis envoyé', next: 'devis_envoye' }],
  devis_envoye: [{ label: 'Marquer comme signé', next: 'signe' }],
}
const CANCELABLE_STATUSES = new Set<WeddingStatus>(['prospect', 'repondu', 'en_attente_reponse', 'devis_envoye'])

const NEXT_STEPS = [
  { to: 'prestataires', label: 'Ajouter des prestataires', icon: Users },
  { to: 'taches', label: 'Ajouter une tâche', icon: ClipboardList },
  { to: 'planning', label: 'Construire le planning', icon: CalendarClock },
  { to: 'finances', label: 'Ajouter les coûts', icon: Coins },
]

export function WeddingOverviewTab() {
  const { wedding } = useOutletContext<WeddingOutletContext>()
  const navigate = useNavigate()
  const location = useLocation()
  const [showStarter, setShowStarter] = useState(Boolean((location.state as { justCreated?: boolean } | null)?.justCreated))

  const allVendors = useWorkspaceStore((s) => s.workspace.vendors)
  const allVendorLinks = useWorkspaceStore((s) => s.workspace.vendorWeddingLinks)
  const vendors = getWeddingAssignments(allVendors, allVendorLinks, wedding.id)
  const total = countTotal(vendors)
  const confirmed = countConfirmed(vendors)
  const nextToContact = findNextVendorToContact(vendors, wedding.date)
  const urgent = hasUrgentVendor(vendors, wedding.date)

  const allTasks = useWorkspaceStore((s) => s.workspace.tasks)
  const tasks = allTasks.filter((t) => t.weddingId === wedding.id)
  const taskStats = computeWeddingTaskStats(tasks)
  const nextTask = findNextPriorityTask(tasks)

  const allTimelineEvents = useWorkspaceStore((s) => s.workspace.timelineEvents)
  const hasTimelineEvents = allTimelineEvents.some((e) => e.weddingId === wedding.id)
  const updateWedding = useWorkspaceStore((s) => s.updateWedding)
  const addTask = useWorkspaceStore((s) => s.addTask)
  const taskTemplate = useWorkspaceStore((s) => s.workspace.taskTemplate)
  const [editOpen, setEditOpen] = useState(false)
  const [editFocusField, setEditFocusField] = useState<'notes' | undefined>(undefined)

  /**
   * Le passage à "Signé" est le seul déclencheur de la checklist de démarrage — jamais à la
   * création (cf. retour utilisatrice : générer des tâches pour un simple prospect qui ne
   * signera peut-être jamais est une perte de temps).
   */
  const handleQuickStatusChange = (next: WeddingStatus) => {
    updateWedding(wedding.id, { status: next })
    if (next === 'signe') {
      const template = taskTemplate.length > 0 ? taskTemplate : createDefaultTaskTemplate()
      for (const task of buildDefaultTasksForWedding(wedding.id, wedding.date, template)) addTask(task)
      toast.success('Mariage signé — checklist de démarrage générée.')
    } else {
      toast.success(`Statut mis à jour : ${WEDDING_STATUS_LABELS[next]}.`)
    }
  }

  const handleCancel = () => {
    updateWedding(wedding.id, { status: 'annule' })
    toast.success('Mariage marqué comme annulé.')
  }

  const handleEditSubmit = (values: WeddingEditFormValues) => {
    updateWedding(wedding.id, {
      coupleName: values.coupleName.trim(),
      date: new Date(values.date).toISOString(),
      venue: values.venue.trim(),
      clientAddress: values.clientAddress.trim() || undefined,
      clientPhone: values.clientPhone.trim() || undefined,
      clientEmail: values.clientEmail.trim() || undefined,
      guestCount: values.guestCount === '' ? undefined : Number(values.guestCount),
      soldAmount: values.soldAmount === '' ? 0 : Number(values.soldAmount),
      clientBudget: values.clientBudget === '' ? 0 : Number(values.clientBudget),
      status: values.status,
      notes: values.notes.trim() || undefined,
      archived: values.archived,
    })
    setEditOpen(false)
    toast.success('Mariage mis à jour.')
  }

  return (
    <div className="flex flex-col gap-6">
      {showStarter && (
        <Card className="border-thread/40 bg-accent">
          <CardContent className="flex flex-col gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">{wedding.coupleName}</p>
              <h2 className="font-heading text-lg font-semibold text-foreground">Votre mariage est créé.</h2>
              <p className="mt-1 text-sm text-muted-foreground">Que souhaitez-vous ajouter maintenant ?</p>
            </div>
            <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
              {NEXT_STEPS.map((step) => (
                <Button key={step.to} asChild variant="outline" className="justify-start bg-card">
                  <Link to={`/mariages/${wedding.id}/${step.to}`}>
                    <step.icon className="size-4" aria-hidden="true" />
                    {step.label}
                  </Link>
                </Button>
              ))}
              <Button variant="ghost" className="justify-start" onClick={() => setShowStarter(false)}>
                <Eye className="size-4" aria-hidden="true" />
                Voir la vue d'ensemble
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Informations du mariage</CardTitle>
          <CardAction>
            <Button
              variant="outline"
              size="sm"
              aria-label="Modifier les informations du mariage"
              onClick={() => {
                setEditFocusField(undefined)
                setEditOpen(true)
              }}
            >
              <Pencil className="size-4" aria-hidden="true" />
              Modifier
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-x-6 gap-y-4 grid-cols-1 sm:grid-cols-2">
            <Field label="Date du mariage" value={format(new Date(wedding.date), 'd MMMM yyyy', { locale: fr })} />
            <Field label="Lieu du mariage" value={wedding.venue || '—'} />
            <Field label="Nombre d’invités" value={wedding.guestCount !== undefined ? String(wedding.guestCount) : '—'} />
            <Field label="Montant du contrat" value={currency.format(wedding.soldAmount)} />
            <Field label="Budget client" value={currency.format(wedding.clientBudget)} />
            <Field label="Statut du mariage" value={WEDDING_STATUS_LABELS[wedding.status]} />
            <Field label="Créé le" value={format(new Date(wedding.createdAt), 'd MMMM yyyy', { locale: fr })} />
          </dl>

          {(QUICK_STATUS_ACTIONS[wedding.status] || CANCELABLE_STATUSES.has(wedding.status)) && (
            <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
              {QUICK_STATUS_ACTIONS[wedding.status]?.map((action) => (
                <Button key={action.next} size="sm" onClick={() => handleQuickStatusChange(action.next)}>
                  {action.label}
                </Button>
              ))}
              {CANCELABLE_STATUSES.has(wedding.status) && (
                <Button size="sm" variant="outline" onClick={handleCancel}>
                  Marquer comme annulé
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
          <CardAction>
            <Button
              variant="outline"
              size="sm"
              aria-label="Modifier les notes"
              onClick={() => {
                setEditFocusField('notes')
                setEditOpen(true)
              }}
            >
              <Pencil className="size-4" aria-hidden="true" />
              Modifier
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {wedding.notes ? (
            <p className="whitespace-pre-wrap text-sm text-foreground">{wedding.notes}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Aucune note pour ce mariage. Ajoutez les préférences du couple ou toute contrainte particulière.
            </p>
          )}
        </CardContent>
      </Card>

      <WeddingEditForm
        key={editOpen ? 'edit' : 'closed'}
        open={editOpen}
        onOpenChange={setEditOpen}
        wedding={wedding}
        hasTimelineEvents={hasTimelineEvents}
        focusField={editFocusField}
        onSubmit={handleEditSubmit}
      />

      <Card>
        <CardHeader>
          <CardTitle>Prestataires</CardTitle>
        </CardHeader>
        <CardContent>
          {total === 0 ? (
            <VendorEmptyState onAdd={() => navigate(`/mariages/${wedding.id}/prestataires`)} />
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                <span className="text-foreground">
                  {total} prestataire{total !== 1 ? 's' : ''} au total
                </span>
                <span className="text-success">{confirmed} confirmé{confirmed !== 1 ? 's' : ''}</span>
                <span className="text-muted-foreground">{total - confirmed} à confirmer</span>
              </div>

              {nextToContact && (
                <p className="text-sm text-muted-foreground">
                  Prochain à contacter : <span className="text-foreground">{nextToContact.vendor.name}</span> (
                  {nextToContact.vendor.category})
                </p>
              )}

              {urgent && (
                <p className="flex items-center gap-1.5 text-sm font-medium text-risk">
                  <TriangleAlert className="size-4" aria-hidden="true" />
                  Une confirmation est urgente.
                </p>
              )}

              <Link
                to={`/mariages/${wedding.id}/prestataires`}
                className="text-sm text-foreground underline-offset-4 hover:underline"
              >
                Voir tous les prestataires →
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tâches</CardTitle>
        </CardHeader>
        <CardContent>
          {taskStats.total === 0 ? (
            <TaskEmptyState
              title="Aucune tâche pour ce mariage."
              description="Ajoutez une tâche pour commencer à organiser ce mariage."
              onAdd={() => navigate(`/mariages/${wedding.id}/taches`)}
            />
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <Progress value={(taskStats.done / taskStats.total) * 100} className="max-w-56" />
                <span className="shrink-0 text-xs text-muted-foreground">
                  {taskStats.done} sur {taskStats.total} terminée{taskStats.total !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                <span className="text-foreground">
                  {taskStats.open} tâche{taskStats.open !== 1 ? 's' : ''} ouverte{taskStats.open !== 1 ? 's' : ''}
                </span>
                {taskStats.urgent > 0 && (
                  <span className="text-risk">
                    {taskStats.urgent} urgente{taskStats.urgent !== 1 ? 's' : ''}
                  </span>
                )}
                {taskStats.waiting > 0 && <span className="text-warning">{taskStats.waiting} en attente</span>}
              </div>

              {nextTask && (
                <p className="text-sm text-muted-foreground">
                  Prochaine priorité : <span className="text-foreground">{nextTask.title}</span>
                </p>
              )}

              <Link
                to={`/mariages/${wedding.id}/taches`}
                className="text-sm text-foreground underline-offset-4 hover:underline"
              >
                Voir toutes les tâches →
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm text-foreground">{value}</dd>
    </div>
  )
}
