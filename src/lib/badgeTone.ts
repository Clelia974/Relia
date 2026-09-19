/**
 * Les 4 tons sémantiques partagés par tous les badges de statut de l'app —
 * jamais une couleur décorative isolée, toujours l'un de ces quatre (cf.
 * MarginStatusBadge : "jamais uniquement la couleur : texte + icône
 * toujours présents"). Chaque écran garde sa propre table statut → ton ;
 * seule la classe Tailwind qui en résulte est centralisée ici.
 */
export type BadgeTone = 'muted' | 'success' | 'warning' | 'risk'

const TONE_CLASSES: Record<BadgeTone, string> = {
  muted: 'bg-muted text-muted-foreground',
  success: 'bg-success-bg text-success',
  warning: 'bg-warning-bg text-warning',
  risk: 'bg-risk-bg text-risk',
}

export function toneClass(tone: BadgeTone): string {
  return TONE_CLASSES[tone]
}
