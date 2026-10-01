import { useSyncExternalStore } from 'react'

const DESKTOP_QUERY = '(min-width: 1024px)'

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(DESKTOP_QUERY)
  mql.addEventListener('change', onChange)
  return () => mql.removeEventListener('change', onChange)
}

/** Les éditeurs visuels (moodboard, plan de salle) se pilotent à la souris : sur téléphone et petite tablette, ils sont seulement consultables. */
export function useIsDesktop() {
  return useSyncExternalStore(subscribe, () => window.matchMedia(DESKTOP_QUERY).matches, () => true)
}
