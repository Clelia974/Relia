import { cn } from '@/lib/utils'

interface ZordiWordmarkProps {
  className?: string
  color?: string
  checkColor?: string
}

/**
 * Wordmark "zordi" — le point du "i" est remplacé par le checkmark de marque
 * (validé avec Clélia). `lineHeight: 1` sur le span est essentiel : sans ça,
 * le "top" du checkmark (en em, mesuré depuis le haut de la boîte de ligne)
 * dérive avec le ratio line-height/font-size — qui change d'une classe
 * Tailwind à l'autre (text-lg = 18px/28px, text-2xl = 24px/32px, etc.), donc
 * un même ratio en em plaçait le checkmark correctement à une seule taille et
 * le décalait à toutes les autres. Avec line-height: 1 fixe, la distance
 * baseline → haut de boîte redevient une fraction constante de la taille de
 * police (indépendante de la classe Tailwind utilisée), donc ces ratios em
 * restent corrects à toutes les tailles réellement utilisées dans l'app
 * (14 à 48px testés). Valeurs calibrées par mesure réelle des métriques de
 * Source Serif 4 (hauteur d'x, ascendante du "d", baseline), pas par essais
 * visuels au pif.
 */
export function ZordiWordmark({ className, color = 'currentColor', checkColor = '#A9B08F' }: ZordiWordmarkProps) {
  return (
    <span className={cn('relative inline-flex items-baseline', className)} style={{ color, lineHeight: 1 }}>
      zordı
      <svg
        viewBox="0 0 100 100"
        aria-hidden="true"
        style={{ position: 'absolute', right: '0.02em', top: '0.11em', width: '0.27em', height: '0.27em' }}
      >
        <path d="M16,54 Q30,76 48,56 Q64,38 84,8" fill="none" stroke={checkColor} strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}
