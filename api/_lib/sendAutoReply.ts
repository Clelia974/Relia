/**
 * Auto-réponse envoyée à une prospect juste après sa demande (formulaire
 * /lead/new/:userId) — via l'API REST Brevo directement (un simple appel
 * fetch), pas le SDK @getbrevo/brevo : évite une dépendance de plus pour
 * un seul appel HTTP.
 *
 * Volontairement optionnel : contrairement aux autres variables serveur
 * (cf. requireEnv), BREVO_API_KEY absente ne doit jamais faire échouer la
 * capture de la demande elle-même — c'est la partie qui compte vraiment ;
 * l'auto-réponse est une amélioration, pas une dépendance dure. Si la clé
 * n'est pas configurée, ou si Brevo échoue, on logue et on continue.
 */
export async function sendAutoReply(input: {
  clientEmail: string
  clientName: string
  eventTypeLabel: string
  eventDate: string
}): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) {
    console.warn('BREVO_API_KEY absente — auto-réponse non envoyée (demande tout de même enregistrée).')
    return
  }

  const formattedDate = new Date(input.eventDate).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
      body: JSON.stringify({
        sender: { name: 'Jordu', email: 'contact@evenementscles.com' },
        to: [{ email: input.clientEmail, name: input.clientName }],
        subject: 'Votre demande a bien été reçue',
        htmlContent: `<p>Bonjour ${escapeHtml(input.clientName)},</p>
<p>Merci pour votre demande concernant votre ${escapeHtml(input.eventTypeLabel.toLowerCase())} du ${formattedDate}.</p>
<p>Votre message a bien été reçu — vous aurez une réponse très rapidement.</p>
<p>À très vite !</p>`,
      }),
    })
    if (!response.ok) {
      console.error('Erreur envoi auto-réponse Brevo :', response.status, await response.text())
    }
  } catch (err) {
    console.error('Erreur envoi auto-réponse Brevo :', err)
  }
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
