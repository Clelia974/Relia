import { cn } from '@/lib/utils'

const PALETTE = [
  'bg-primary/10 text-primary dark:bg-primary/25 dark:text-accent-foreground',
  'bg-accent text-accent-foreground',
  'bg-success-bg text-success',
  'bg-warning-bg text-warning',
  'bg-secondary text-foreground/80',
  'bg-risk-bg text-risk',
]

function getInitials(name: string): string {
  const words = name
    .split(/[\s&/-]+/)
    .map((w) => w.replace(/[^\p{L}]/gu, ''))
    .filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

function pickColor(seed: string) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  return PALETTE[hash % PALETTE.length]
}

interface InitialsBadgeProps {
  name: string
  className?: string
}

/** Chip d'initiales coloré (façon "Guestlist") pour repérer un couple ou un prestataire en un coup d'œil. */
export function InitialsBadge({ name, className }: InitialsBadgeProps) {
  return (
    <span
      className={cn('flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold tracking-wide', pickColor(name), className)}
      aria-hidden="true"
    >
      {getInitials(name)}
    </span>
  )
}
