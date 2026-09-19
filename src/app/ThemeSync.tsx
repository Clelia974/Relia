import { useEffect } from 'react'
import { useResolvedTheme } from '@/app/useResolvedTheme'

/**
 * Seul endroit de l'app qui pose ou retire la classe .dark sur <html> —
 * monté une fois à la racine. La résolution système/light/dark vit dans
 * useResolvedTheme ; ce composant ne fait qu'appliquer le résultat au DOM.
 */
export function ThemeSync() {
  const resolvedTheme = useResolvedTheme()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark')
  }, [resolvedTheme])

  return null
}
