import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

interface Row {
  label: string
  count: number
}
interface Kpis {
  generatedAt: string
  users: {
    total: number
    active: number
    cancelled: number
    trialsRunning: number
    trialsExpired: number
    signups7: number
    signups30: number
    signupsByDay: { day: string; count: number }[]
    expiringSoon: { email: string; daysLeft: number }[]
    conversionRate: number | null
    churnRate30: number | null
    cancelled30: number
    avgDaysToCancel: number | null
    cancelBuckets: Row[]
    avgDaysToFirstPayment: number | null
    mrr: number
    launchOffer: { redeemed: number; limit: number }
  }
  events: {
    totalEvents: number
    funnel: Row[]
    ctaByLocation: Row[]
    sectionViews: Row[]
    topPages: Row[]
    timeOnPage: { path: string; avgSeconds: number; visits: number }[]
    featureViews: Row[]
    faqOpens: Row[]
    demoClicks: number
  }
}

const SECTION_LABELS: Record<string, string> = {
  hero: 'Accroche', probleme: 'Problème', solution: 'Solution (frise)', demo: 'Vidéo démo', fonctionnalites: 'Fonctionnalités',
  etapes: '3 étapes', temoignages: 'Avis', tarifs: 'Tarifs', faq: 'FAQ', 'appel-final': 'Appel final',
}
const CTA_LABELS: Record<string, string> = { header: 'En-tête', hero: 'Accroche', etapes: '3 étapes', tarifs: 'Tarifs', final: 'Appel final' }

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 font-heading text-3xl font-semibold text-foreground">{value}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  )
}

function Bars({ rows, labels, empty = 'Pas encore de données.' }: { rows: Row[]; labels?: Record<string, string>; empty?: string }) {
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">{empty}</p>
  const max = Math.max(...rows.map((r) => r.count), 1)
  return (
    <ul className="flex flex-col gap-2">
      {rows.map((r) => (
        <li key={r.label} className="text-sm">
          <div className="flex justify-between gap-3">
            <span className="min-w-0 truncate">{labels?.[r.label] ?? r.label}</span>
            <span className="shrink-0 font-medium tabular-nums">{r.count}</span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-[#520C0C]/10">
            <div className="h-full rounded-full bg-[#520C0C]" style={{ width: `${(r.count / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

function Panel({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-lg">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export function AdminPage() {
  const [data, setData] = useState<Kpis | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session) throw new Error('Connecte-toi pour ouvrir le tableau de bord.')
        const response = await fetch('/api/admin/kpis', { headers: { Authorization: `Bearer ${session.access_token}` } })
        if (response.status === 403) throw new Error('Accès réservé à l’administratrice.')
        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as { detail?: string } | null
          throw new Error(`Impossible de charger les indicateurs${body?.detail ? ` (${body.detail})` : ` (code ${response.status})`}.`)
        }
        const json = (await response.json()) as Kpis
        if (!cancelled) setData(json)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Erreur inconnue.')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (error) return <p className="py-12 text-center text-muted-foreground">{error}</p>
  if (!data) return <p className="py-12 text-center text-muted-foreground">Chargement des indicateurs…</p>

  const { users: u, events: e } = data
  const maxDay = Math.max(...u.signupsByDay.map((d) => d.count), 1)

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="font-heading text-3xl font-semibold text-foreground">Tableau de bord</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Mis à jour le {new Date(data.generatedAt).toLocaleString('fr-FR')}. Visites comptées sur les 30 derniers jours, de façon anonyme.
        </p>
      </header>

      <section aria-labelledby="abos" className="flex flex-col gap-4">
        <h2 id="abos" className="font-heading text-xl font-semibold">Abonnements</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Abonnées actives" value={u.active} hint={`Revenu mensuel estimé : ${u.mrr} €`} />
          <Stat label="Essais en cours" value={u.trialsRunning} hint={`${u.trialsExpired} essais terminés sans abonnement`} />
          <Stat label="Conversion" value={u.conversionRate === null ? '—' : `${u.conversionRate} %`} hint="Inscrites devenues abonnées" />
          <Stat label="Offre de lancement" value={`${u.launchOffer.redeemed} / ${u.launchOffer.limit}`} hint="Places prises" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Inscriptions" value={u.total} hint={`${u.signups7} cette semaine · ${u.signups30} sur 30 jours`} />
          <Stat label="Résiliations (30 jours)" value={u.cancelled30} hint={u.churnRate30 === null ? undefined : `Taux de résiliation : ${u.churnRate30} %`} />
          <Stat label="Délai avant résiliation" value={u.avgDaysToCancel === null ? '—' : `${u.avgDaysToCancel} j`} hint="En moyenne, après le 1er paiement" />
          <Stat label="Délai avant 1er paiement" value={u.avgDaysToFirstPayment === null ? '—' : `${u.avgDaysToFirstPayment} j`} hint="En moyenne, après l’inscription" />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Inscriptions par jour" description="30 derniers jours">
          <div className="flex h-28 items-end gap-1" role="img" aria-label="Inscriptions par jour sur 30 jours">
            {u.signupsByDay.map((d) => (
              <div key={d.day} title={`${d.day} : ${d.count}`} className="flex-1 rounded-t bg-[#520C0C]/70" style={{ height: `${Math.max((d.count / maxDay) * 100, d.count ? 8 : 2)}%` }} />
            ))}
          </div>
        </Panel>
        <Panel title="Au bout de combien de jours elles résilient" description="Depuis le premier paiement">
          <Bars rows={u.cancelBuckets} empty="Aucune résiliation pour l’instant." />
        </Panel>
      </div>

      <Panel title="Essais qui se terminent dans 3 jours ou moins" description="Les clientes à relancer">
        {u.expiringSoon.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun essai ne se termine bientôt.</p>
        ) : (
          <ul className="divide-y divide-border text-sm">
            {u.expiringSoon.map((x) => (
              <li key={x.email} className="flex justify-between gap-3 py-2">
                <span className="truncate">{x.email}</span>
                <span className="shrink-0 text-muted-foreground">{x.daysLeft === 0 ? 'aujourd’hui' : `dans ${x.daysLeft} j`}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <section aria-labelledby="visites" className="flex flex-col gap-4">
        <h2 id="visites" className="font-heading text-xl font-semibold">Visites et usage</h2>
        {e.totalEvents === 0 && <p className="text-sm text-muted-foreground">Aucune visite enregistrée pour l’instant : les chiffres apparaîtront après les premières visites du site en ligne.</p>}
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Du visiteur à l’achat" description="Combien de personnes à chaque étape">
            <Bars rows={e.funnel} />
          </Panel>
          <Panel title="Quel bouton convertit" description="Clics sur « Commencer mon premier mariage »">
            <Bars rows={e.ctaByLocation} labels={CTA_LABELS} />
          </Panel>
          <Panel title="Sections les plus lues" description="Page d’accueil, par visite">
            <Bars rows={e.sectionViews} labels={SECTION_LABELS} />
          </Panel>
          <Panel title="Fonctionnalités regardées" description="Dans le défilement des écrans">
            <Bars rows={e.featureViews} />
          </Panel>
          <Panel title="Pages les plus visitées" description="Landing et application, sans identifiants">
            <Bars rows={e.topPages} />
          </Panel>
          <Panel title="Temps passé par page" description="Durée moyenne, onglet visible">
            {e.timeOnPage.length === 0 ? (
              <p className="text-sm text-muted-foreground">Pas encore de données.</p>
            ) : (
              <ul className="divide-y divide-border text-sm">
                {e.timeOnPage.map((t) => (
                  <li key={t.path} className="flex justify-between gap-3 py-2">
                    <span className="truncate">{t.path}</span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {Math.floor(t.avgSeconds / 60)} min {String(t.avgSeconds % 60).padStart(2, '0')} s · {t.visits} visites
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title="Questions de la FAQ ouvertes">
            <Bars rows={e.faqOpens} />
          </Panel>
          <Panel title="Autres">
            <p className="text-sm">Clics sur « Voir une démo » : <strong>{e.demoClicks}</strong></p>
          </Panel>
        </div>
      </section>
    </div>
  )
}
