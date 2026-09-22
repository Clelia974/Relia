/** Message d'erreur commun aux formulaires d'authentification (échec Supabase) — masqué si aucun message. */
export function AuthErrorMessage({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <p role="alert" className="rounded-lg border border-risk/40 bg-risk-bg px-3 py-2 text-sm text-risk">
      {message}
    </p>
  )
}
