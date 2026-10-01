/**
 * Email envoyé à la cliente avec le lien vers son contrat (page publique
 * /contrat/:id, qui redirige vers le fichier PDF) — via l'API REST Brevo
 * directement, même approche que sendDevisEmail.ts.
 *
 * Volontairement best-effort : le contrat est déjà enregistré et
 * consultable via son lien à l'instant où cette fonction est appelée
 * (cf. api/contrats/share.ts) — un échec d'envoi ne doit jamais faire
 * échouer la requête qui a créé le partage.
 */
export async function sendContratEmail(input: {
  clientEmail: string
  clientName: string
  shareId: string
  companyName?: string
  replyToEmail?: string
  /** Mot personnalisé ajouté par la décoratrice, relu dans l'aperçu avant envoi (cf. EmailPreviewDialog). */
  customMessage?: string
}): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) {
    console.warn('BREVO_API_KEY absente — email du contrat non envoyé (contrat tout de même enregistré).')
    return
  }

  const siteUrl = process.env.VITE_SITE_URL ?? 'https://relia-app.vercel.app'
  const contratUrl = `${siteUrl}/contrat/${input.shareId}`
  const senderName = input.companyName?.trim() || 'SilkyPlace'

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
      body: JSON.stringify({
        sender: { name: senderName, email: 'contact@evenementscles.com' },
        ...(input.replyToEmail ? { replyTo: { email: input.replyToEmail, name: senderName } } : {}),
        to: [{ email: input.clientEmail, name: input.clientName }],
        subject: `Votre contrat de la part de ${senderName}`,
        htmlContent: `<p>Bonjour ${escapeHtml(input.clientName)},</p>
${input.customMessage?.trim() ? `<p>${escapeHtml(input.customMessage.trim())}</p>\n` : ''}<p>${escapeHtml(senderName)} vous a transmis votre contrat — vous pouvez le consulter directement en ligne :</p>
<p><a href="${contratUrl}">${contratUrl}</a></p>
<p>N'hésitez pas à revenir vers ${input.replyToEmail ? 'nous' : `${escapeHtml(senderName)}`} pour toute question.</p>
<p>À très vite !</p>`,
      }),
    })
    if (!response.ok) {
      console.error('Erreur envoi email contrat Brevo :', response.status, await response.text())
    }
  } catch (err) {
    console.error('Erreur envoi email contrat Brevo :', err)
  }
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
