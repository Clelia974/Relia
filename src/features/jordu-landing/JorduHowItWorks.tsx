import { useEffect, useState } from 'react'
import { Camera, Mail, MessageCircle, Phone } from 'lucide-react'
import { cn } from '@/lib/utils'

const AUTOPLAY_MS = 3500

type Tone = 'new' | 'pending' | 'progress' | 'done' | 'muted'

const TONE_CLASSES: Record<Tone, string> = {
  new: 'bg-[#680808] text-[#DDE6EF]',
  pending: 'bg-warning-bg text-warning',
  progress: 'bg-[#A9B08F]/20 text-[#5F6B4C]',
  done: 'bg-success/15 text-success',
  muted: 'bg-muted text-muted-foreground',
}

const ROWS = [
  { name: 'Camille & Antoine', icon: Camera },
  { name: 'Sophie Martin', icon: MessageCircle },
  { name: 'Julie & Marc', icon: Mail },
  { name: 'Nora', icon: Phone },
]

interface Step {
  title: string
  caption: string
  headline: string
  rows: { tone: Tone; label: string }[]
}

const STEPS: Step[] = [
  {
    title: 'Tu reçois une demande',
    caption: 'Peu importe le canal, elle arrive au même endroit.',
    headline: 'Nouvelle demande — Camille & Antoine',
    rows: [
      { tone: 'new', label: 'Nouveau' },
      { tone: 'muted', label: 'En attente' },
      { tone: 'muted', label: 'En attente' },
      { tone: 'muted', label: 'Confirmé' },
    ],
  },
  {
    title: 'Elle trouve sa place dans ton suivi',
    caption: 'Classée automatiquement, sans rien faire.',
    headline: 'Classée dans ton suivi',
    rows: [
      { tone: 'pending', label: 'En attente' },
      { tone: 'pending', label: 'En attente' },
      { tone: 'pending', label: 'En attente' },
      { tone: 'done', label: 'Confirmé' },
    ],
  },
  {
    title: 'Tu sais ce qu’il reste à faire',
    caption: 'Un coup d’œil suffit.',
    headline: '2 demandes à traiter',
    rows: [
      { tone: 'pending', label: 'En attente' },
      { tone: 'progress', label: 'Devis envoyé' },
      { tone: 'pending', label: 'En attente' },
      { tone: 'done', label: 'Confirmé' },
    ],
  },
  {
    title: 'Tu avances sans devoir tout retenir',
    caption: 'Chaque étape est notée pour toi.',
    headline: 'Relance programmée',
    rows: [
      { tone: 'progress', label: 'Relance prévue' },
      { tone: 'progress', label: 'Devis envoyé' },
      { tone: 'pending', label: 'En attente' },
      { tone: 'done', label: 'Confirmé' },
    ],
  },
  {
    title: 'Tu fermes ton ordinateur',
    caption: 'Tu sais où reprendre demain.',
    headline: 'Tout est à jour',
    rows: [
      { tone: 'done', label: 'Relancée' },
      { tone: 'done', label: 'Devis envoyé' },
      { tone: 'done', label: 'Répondu' },
      { tone: 'done', label: 'Confirmé' },
    ],
  },
]

/**
 * Stepper interactif (clique sur une étape -> la carte d'aperçu se met à jour) —
 * inspiré du "clique sur une étape pour la voir en action" de gbcrea.com, adapté
 * au vocabulaire déjà en place sur la page (mêmes 4 demandes fictives à travers
 * les 5 étapes plutôt que 5 illustrations différentes).
 */
export function JorduHowItWorks() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const step = STEPS[active]

  // Défile automatiquement d'étape en étape ; le délai se réarme à chaque
  // changement (auto ou clic manuel), donc chaque étape reste affichée le
  // même temps peu importe comment on y est arrivé. En pause au survol/focus
  // pour laisser le temps de lire (et respecter WCAG 2.2.2 sur le contenu qui bouge seul).
  useEffect(() => {
    if (paused) return
    const id = setTimeout(() => setActive((a) => (a + 1) % STEPS.length), AUTOPLAY_MS)
    return () => clearTimeout(id)
  }, [active, paused])

  return (
    <div
      className="grid gap-6 sm:grid-cols-2 sm:items-start"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <ol className="flex flex-col gap-2">
        {STEPS.map((s, i) => (
          <li key={s.title}>
            <button
              type="button"
              onClick={() => setActive(i)}
              aria-pressed={active === i}
              className={cn(
                'flex w-full items-start gap-3.5 rounded-xl border p-4 text-left transition-colors',
                active === i ? 'border-[#680808] bg-[#680808]/5' : 'border-border hover:border-[#680808]/40',
              )}
            >
              <span
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors',
                  active === i ? 'bg-[#680808] text-[#DDE6EF]' : 'bg-muted text-muted-foreground',
                )}
              >
                {i + 1}
              </span>
              <span>
                <span className="block text-sm font-medium text-foreground">{s.title}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{s.caption}</span>
              </span>
            </button>
          </li>
        ))}
      </ol>

      <div key={active} className="animate-notice-in rounded-2xl border border-border bg-card p-5 sm:sticky sm:top-24">
        <p className="text-xs font-medium uppercase tracking-wide text-[#5F6B4C]">{step.headline}</p>
        <div className="mt-3 flex flex-col divide-y divide-border">
          {ROWS.map((row, i) => (
            <div key={row.name} className="flex items-center justify-between gap-3 py-2.5">
              <span className="flex items-center gap-2 text-sm text-foreground">
                <row.icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                {row.name}
              </span>
              <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-xs font-medium', TONE_CLASSES[step.rows[i].tone])}>
                {step.rows[i].label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
