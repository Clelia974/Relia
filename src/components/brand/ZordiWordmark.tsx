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
        style={{
          position: 'absolute',
          right: 'clamp(2px, 0.09em, 999px)',
          top: 'clamp(4px, 0.36em, 999px)',
          width: 'clamp(13px, 0.37em, 999px)',
          height: 'clamp(13px, 0.37em, 999px)',
        }}
      >
        <path d="M16,54 Q30,76 48,56 Q64,38 84,8" fill="none" stroke={checkColor} strokeWidth="22" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}
