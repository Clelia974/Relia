import { cn } from '@/lib/utils'

const PALETTE = [
  { bg: '#EDE9FE', text: '#6D28D9' },
  { bg: '#CCFBF1', text: '#0F766E' },
  { bg: '#FEF3C7', text: '#92400E' },
  { bg: '#E0F2FE', text: '#075985' },
  { bg: '#FCE7F3', text: '#BE185D' },
  { bg: '#ECFCCB', text: '#4D7C0F' },
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
  const { bg, text } = pickColor(name)
  return (
    <span
      className={cn('flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold', className)}
      style={{ backgroundColor: bg, color: text }}
      aria-hidden="true"
    >
      {getInitials(name)}
    </span>
  )
}
