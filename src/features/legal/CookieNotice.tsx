import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

const STORAGE_KEY = 'relia-cookie-notice-seen'

function hasSeenNotice() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * Bandeau d'information (pas de consentement à recueillir : aucun cookie de suivi ni publicitaire).
 * Si un outil de mesure d'audience ou de publicité est ajouté un jour, ce bandeau devra devenir un vrai
 * recueil de consentement (refuser aussi simple qu'accepter) et la page /cookies être mise à jour.
 */
export function CookieNotice() {
  const [visible, setVisible] = useState(() => !hasSeenNotice())
  if (!visible) return null

  const dismiss = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // stockage indisponible : le bandeau reviendra à la prochaine visite
    }
    setVisible(false)
  }

  return (
    <div
      role="region"
      aria-label="Information sur les cookies"
      className="animate-notice-in fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-xl flex-col gap-3 rounded-xl border border-border bg-card p-4 text-sm shadow-(--shadow-raised) sm:flex-row sm:items-center"
    >
      <p className="flex-1 text-foreground/85">
        RELIA n'utilise aucun cookie de suivi ni de publicité. Ton espace de travail est seulement conservé dans ton navigateur.{' '}
        <Link to="/cookies" className="text-primary underline underline-offset-4">En savoir plus</Link>
      </p>
      <Button size="sm" variant="outline" onClick={dismiss}>Compris</Button>
    </div>
  )
}
