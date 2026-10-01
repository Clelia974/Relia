/**
 * Email envoyé à la cliente avec le lien vers son devis (page publique
 * /devis/:id) — via l'API REST Brevo directement, même approche que
 * sendAutoReply.ts.
 *
 * Volontairement best-effort : le devis est déjà enregistré et consultable
 * via son lien à l'instant où cette fonction est appelée (cf. api/devis/share.ts) —
 * un échec d'envoi ne doit jamais faire échouer la requête qui a créé le devis.
 */
export async function sendDevisEmail(input: {
  clientEmail: string
  clientName: string
  shareId: string
  /** Nom de l'entreprise de la décoratrice (businessConfig.companyName) — affiché comme expéditeur pour que la cliente reconnaisse qui lui écrit, pas "SilkyPlace". */
  companyName?: string
  /** Email pro de la décoratrice (businessConfig.email), si renseigné — mis en Reply-To pour qu'une réponse de la cliente lui arrive directement, jamais à l'adresse générique de SilkyPlace. */
  replyToEmail?: string
  /** Mot personnalisé ajouté par la décoratrice, relu dans l'aperçu avant envoi (cf. EmailPreviewDialog) — inséré tel quel juste après la formule de politesse. */
  customMessage?: string
}): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) {
    console.warn('BREVO_API_KEY absente — email du devis non envoyé (devis tout de même enregistré).')
    return
  }

  const siteUrl = process.env.VITE_SITE_URL ?? 'https://relia-app.vercel.app'
  const devisUrl = `${siteUrl}/devis/${input.shareId}`
  const senderName = input.companyName?.trim() || 'SilkyPlace'

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
      body: JSON.stringify({
        sender: { name: senderName, email: 'contact@evenementscles.com' },
        ...(input.replyToEmail ? { replyTo: { email: input.replyToEmail, name: senderName } } : {}),
        to: [{ email: input.clientEmail, name: input.clientName }],
        subject: `Votre devis de la part de ${senderName}`,
        htmlContent: `<p>Bonjour ${escapeHtml(input.clientName)},</p>
${input.customMessage?.trim() ? `<p>${escapeHtml(input.customMessage.trim())}</p>\n` : ''}<p>${escapeHtml(senderName)} vous a préparé un devis — vous pouvez le consulter directement en ligne :</p>
<p><a href="${devisUrl}">${devisUrl}</a></p>
<p>N'hésitez pas à revenir vers ${input.replyToEmail ? 'nous' : `${escapeHtml(senderName)}`} pour toute question.</p>
<p>À très vite !</p>`,
      }),
    })
    if (!response.ok) {
      console.error('Erreur envoi email devis Brevo :', response.status, await response.text())
    }
  } catch (err) {
    console.error('Erreur envoi email devis Brevo :', err)
  }
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
