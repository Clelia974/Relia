import { useEffect, useState } from 'react'
import { useWorkspaceStore } from '@/store/workspaceStore'

function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Résout uiPreferences.theme ('system' | 'light' | 'dark') en thème effectif
 * 'light' | 'dark', en suivant en direct les changements de préférence
 * système quand theme === 'system'. Seul endroit de l'app qui contient cette
 * logique de résolution — tout composant ayant besoin du thème résolu
 * (classe .dark, Sonner…) appelle ce hook plutôt que de la réimplémenter.
 */
export function useResolvedTheme(): 'light' | 'dark' {
  const theme = useWorkspaceStore((s) => s.workspace.uiPreferences.theme)
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(getSystemTheme)

  useEffect(() => {
    if (theme !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setSystemTheme(getSystemTheme())
    onChange()
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [theme])

  return theme === 'system' ? systemTheme : theme
}
