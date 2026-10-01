/**
 * Email de relance — rappelle à la cliente qu'un devis attend sa réponse,
 * avec le même lien que l'envoi initial (cf. api/devis/share.ts, la
 * facture n'est jamais recréée, seul un nouvel email part). Best-effort,
 * comme sendDevisEmail.ts : un échec ne doit jamais faire échouer la
 * demande de relance elle-même (la tâche interne est de toute façon déjà
 * reprogrammée avant l'appel).
 */
export async function sendDevisRelanceEmail(input: {
  clientEmail: string
  clientName: string
  shareId: string
  companyName?: string
  replyToEmail?: string
  /** Mot personnalisé ajouté par la décoratrice, relu dans l'aperçu avant envoi (cf. EmailPreviewDialog). */
  customMessage?: string
}): Promise<boolean> {
  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) {
    console.warn('BREVO_API_KEY absente — email de relance non envoyé.')
    return false
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
        subject: `Votre devis vous attend toujours — ${senderName}`,
        htmlContent: `<p>Bonjour ${escapeHtml(input.clientName)},</p>
${input.customMessage?.trim() ? `<p>${escapeHtml(input.customMessage.trim())}</p>\n` : ''}<p>Un petit rappel de la part de ${escapeHtml(senderName)} — votre devis est toujours disponible en ligne, n'hésitez pas à y jeter un œil quand vous aurez un moment :</p>
<p><a href="${devisUrl}">${devisUrl}</a></p>
<p>N'hésitez pas à revenir vers ${input.replyToEmail ? 'nous' : `${escapeHtml(senderName)}`} pour toute question.</p>
<p>À très vite !</p>`,
      }),
    })
    if (!response.ok) {
      console.error('Erreur envoi email relance Brevo :', response.status, await response.text())
      return false
    }
    return true
  } catch (err) {
    console.error('Erreur envoi email relance Brevo :', err)
    return false
  }
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
