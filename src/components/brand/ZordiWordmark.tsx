import { cn } from '@/lib/utils'

interface ZordiWordmarkProps {
  className?: string
  color?: string
  checkColor?: string
}

/**
 * Wordmark "zordi" — le point du "i" est remplacé par le checkmark de marque
 * (validé avec Clélia). Positionné en unités em pour rester cohérent à toutes
 * les tailles de texte (header compact, hero, etc.) sans dupliquer le tracé.
 */
export function ZordiWordmark({ className, color = 'currentColor', checkColor = '#A9B08F' }: ZordiWordmarkProps) {
  return (
    <span className={cn('relative inline-flex items-baseline', className)} style={{ color }}>
      zordı
      <svg
        viewBox="0 0 100 100"
        aria-hidden="true"
        style={{ position: 'absolute', right: '0.09em', top: '0.36em', width: '0.37em', height: '0.37em' }}
      >
        <path d="M16,54 Q30,76 48,56 Q64,38 84,8" fill="none" stroke={checkColor} strokeWidth="28" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}
